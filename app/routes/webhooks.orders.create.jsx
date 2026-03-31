import { Buffer } from "node:buffer";
import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";
import SneakerModel from "../MongoDB/models/Sneaker";
import TempBookingModel from "../MongoDB/models/TempBooking";
import mongoose from "mongoose";
import sendEmail from "../utils/sendEmail";
import { verifyAndBuySelectedRates } from "../utils/easyPostShipping";

const STAGED_UPLOADS_URL_QUERY = `
mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets {
      resourceUrl
      url
      parameters {
        name
        value
      }
    }
    userErrors {
      field
      message
    }
  }
}
`;

const FILE_CREATE_MUTATION = `
mutation fileCreate($files: [FileCreateInput!]!) {
  fileCreate(files: $files) {
    files {
      id
      fileStatus
    }
    userErrors {
      field
      message
    }
  }
}
`;

async function uploadImageToShopify(admin, base64Data, mimeType = "image/jpeg", filename = "sneaker.jpg") {
  try {
    const stagedRes = await admin.graphql(STAGED_UPLOADS_URL_QUERY, {
      variables: {
        input: [
          {
            filename,
            mimeType,
            resource: "IMAGE",
            httpMethod: "POST",
          },
        ],
      },
    });

    const stagedData = await stagedRes.json();
    if (stagedData?.data?.stagedUploadsCreate?.userErrors?.length) {
      console.error("Staged upload error:", stagedData.data.stagedUploadsCreate.userErrors);
      return null;
    }

    const target = stagedData.data.stagedUploadsCreate.stagedTargets[0];
    const formData = new FormData();
    target.parameters.forEach(({ name, value }) => {
      formData.append(name, value);
    });

    if (typeof base64Data !== "string") return null;

    const base64Content = base64Data.includes("base64,")
      ? base64Data.split("base64,")[1]
      : base64Data;

    const buffer = Buffer.from(base64Content, "base64");
    const blob = new Blob([buffer], { type: mimeType });
    formData.append("file", blob, filename);

    const uploadRes = await fetch(target.url, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) return null;

    const fileRes = await admin.graphql(FILE_CREATE_MUTATION, {
      variables: {
        files: [
          {
            alt: "Sneaker image",
            contentType: "IMAGE",
            originalSource: target.resourceUrl,
          },
        ],
      },
    });

    const fileData = await fileRes.json();
    const createdFile = fileData?.data?.fileCreate?.files?.[0];

    return createdFile?.id ? { id: createdFile.id } : null;
  } catch (err) {
    console.error("Upload exception:", err);
    return null;
  }
}

const ADMIN_NOTIFICATION_EMAIL = "vowelweb113@gmail.com";

function buildRateChangedEmail({ bookingDoc, orderPayload, shippingSelection, verificationResult }) {
  const bookingReference = bookingDoc?._id?.toString() || "Pending booking";
  const orderReference = orderPayload?.name || orderPayload?.id || "Unknown order";
  const customerEmail = bookingDoc?.email || bookingDoc?.guestInfo?.email || "N/A";

  const rateRows = (verificationResult.changedRates || [])
    .map((rateChange) => {
      const quoted = rateChange.quotedRate
        ? `${rateChange.quotedRate.carrier} ${rateChange.quotedRate.service} $${Number(rateChange.quotedRate.amount).toFixed(2)}`
        : "No quoted rate";
      const current = rateChange.currentRate
        ? `${rateChange.currentRate.carrier} ${rateChange.currentRate.service} $${Number(rateChange.currentRate.amount).toFixed(2)}`
        : "Rate no longer available";

      return `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;">${rateChange.direction}</td>
          <td style="padding:8px;border:1px solid #ddd;">${quoted}</td>
          <td style="padding:8px;border:1px solid #ddd;">${current}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#222;">
      <h2>Shipping Rate Changed</h2>
      <p>The EasyPost shipping rate changed after Shopify created an order, so labels were not purchased automatically.</p>
      <p><strong>Booking ID:</strong> ${bookingReference}</p>
      <p><strong>Order:</strong> ${orderReference}</p>
      <p><strong>Customer Email:</strong> ${customerEmail}</p>
      <p><strong>Forward Quote:</strong> ${shippingSelection?.selectedForwardRate?.carrier || "N/A"} ${shippingSelection?.selectedForwardRate?.service || ""} ${shippingSelection?.selectedForwardRate ? `$${Number(shippingSelection.selectedForwardRate.amount).toFixed(2)}` : ""}</p>
      <p><strong>Return Quote:</strong> ${shippingSelection?.selectedReturnRate?.carrier || "N/A"} ${shippingSelection?.selectedReturnRate?.service || ""} ${shippingSelection?.selectedReturnRate ? `$${Number(shippingSelection.selectedReturnRate.amount).toFixed(2)}` : ""}</p>
      <table style="border-collapse:collapse;margin-top:16px;">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Direction</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Quoted</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Current</th>
          </tr>
        </thead>
        <tbody>${rateRows}</tbody>
      </table>
    </div>
  `;
}

export const action = async ({ request }) => {
  const { admin, payload, topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  console.log(`Received ${topic} webhook for ${shop}`);

  if (topic !== "ORDERS_CREATE") {
    return new Response();
  }

  const noteAttributes = payload.note_attributes || [];
  const tempBookingIdAttr = noteAttributes.find(attr => attr.name === "temp_booking_id");

  if (!tempBookingIdAttr || !tempBookingIdAttr.value) {
    console.log("No temp_booking_id found in order note_attributes, skipping...");
    return new Response();
  }

  const shopifyOrderId = payload.admin_graphql_api_id || `gid://shopify/Order/${payload.id}`;

  try {
    // idempotency checking
    let bookingDoc = await BookingModel.findOne({ shopifyOrderID: shopifyOrderId });
    if (bookingDoc) {
      console.log("Booking already exists for orderID:", shopifyOrderId);
      return new Response();
    }

    const tempBooking = await TempBookingModel.findById(tempBookingIdAttr.value);
    if (!tempBooking) {
      console.error("Temp booking data not found for ID:", tempBookingIdAttr.value);
      return new Response();
    }

    const bookingData = tempBooking.payload;
    let customerName = null;
    let customerEmail = null;
    let customerPhone = null;

    // if customerID is present, it's a logged-in customer (not a guest)
    if (bookingData.customerID && payload.customer) {
      customerName = `${payload.customer.first_name || ""} ${payload.customer.last_name || ""}`.trim() || null;
      customerEmail = payload.customer.email || null;
      customerPhone = payload.customer.phone || payload.customer.default_address?.phone || null;

      // converting numeric ID to Shopify GID for consistency in DB
      if (!String(bookingData.customerID).startsWith("gid://")) {
        bookingData.customerID = payload.customer.admin_graphql_api_id || `gid://shopify/Customer/${payload.customer.id}`;
      }
      console.log("Populated customer data from Shopify webhook for logged-in user:", bookingData.customerID);
    }

    console.log("Finalizing booking for:", customerEmail || bookingData.guestInfo?.email || bookingData.customerID);

    const processedSneakers = [];

    // processing images and preparing data
    if (bookingData.sneakers && Array.isArray(bookingData.sneakers)) {
      for (let i = 0; i < bookingData.sneakers.length; i++) {
        const sneakerInput = bookingData.sneakers[i];
        const uploadedImageIds = [];

        if (sneakerInput.images && Array.isArray(sneakerInput.images)) {
          for (let j = 0; j < sneakerInput.images.length; j++) {
            const b64OrGid = sneakerInput.images[j];
            if (!b64OrGid) continue;

            if (typeof b64OrGid === "string" && b64OrGid.startsWith("gid://shopify/")) {
              uploadedImageIds.push(b64OrGid);
              continue;
            }

            // deferred upload happens here
            const result = await uploadImageToShopify(
              admin,
              b64OrGid,
              "image/jpeg",
              `sneaker-${Date.now()}-${j}.jpg`
            );

            if (result?.id) {
              uploadedImageIds.push(result.id);
            }
          }
        }

        processedSneakers.push({
          ...sneakerInput,
          images: uploadedImageIds
        });
      }
    }

    bookingDoc = new BookingModel({
      customerID: bookingData.customerID,
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      guestInfo: bookingData.customerID ? null : bookingData.guestInfo,
      handoffMethod: bookingData.handoffMethod,
      sneakers: processedSneakers,
      fullPayload: bookingData,
      shopifyOrderID: shopifyOrderId,
      submittedAt: bookingData.submittedAt ? new Date(bookingData.submittedAt) : new Date(),
      status: "Pending"
    });

    await bookingDoc.save();

    if (bookingData.handoffMethod === "shipping" && bookingData.shippingSelection) {
      const shippingContact = {
        ...bookingData.shippingSelection.customerAddress,
        email: bookingData.shippingSelection.customerAddress?.email || customerEmail || bookingData.guestInfo?.email || "",
      };

      const verificationResult = await verifyAndBuySelectedRates({
        customerAddress: shippingContact,
        parcel: bookingData.shippingSelection.parcel,
        selectedForwardRate: bookingData.shippingSelection.selectedForwardRate,
        selectedReturnRate: bookingData.shippingSelection.selectedReturnRate,
        referencePrefix: bookingDoc._id.toString(),
      });

      if (verificationResult.status === "purchased") {
        bookingDoc.shipping = {
          ...bookingData.shippingSelection,
          purchaseStatus: "purchased",
          labels: verificationResult.labels,
          storeAddress: verificationResult.storeAddress,
          purchasedAt: new Date(),
        };
      } else {
        bookingDoc.shipping = {
          ...bookingData.shippingSelection,
          purchaseStatus: "rate_changed",
          changedRates: verificationResult.changedRates,
          storeAddress: verificationResult.storeAddress,
          flaggedAt: new Date(),
        };

        await sendEmail(
          ADMIN_NOTIFICATION_EMAIL,
          "EasyPost shipping rate changed for sneaker booking",
          buildRateChangedEmail({
            bookingDoc,
            orderPayload: payload,
            shippingSelection: bookingData.shippingSelection,
            verificationResult,
          }),
        );
      }

      await bookingDoc.save();
    }

    // registry logic
    if (bookingData.customerID) {
      for (const processedSnk of processedSneakers) {
        const sneakerFields = {
          customerID: bookingData.customerID,
          bookingID: bookingDoc._id,
          nickname: processedSnk.nickname,
          brand: processedSnk.brand,
          model: processedSnk.model,
          colorway: processedSnk.colorway,
          size: processedSnk.size,
          sizeUnit: processedSnk.sizeUnit,
          history: processedSnk.history,
          notes: processedSnk.notes,
          services: bookingData.services ? bookingData.services[processedSnk.id || processedSnk._id] : null,
          images: processedSnk.images,
          status: "Pending",
          submittedAt: bookingData.submittedAt ? new Date(bookingData.submittedAt) : new Date(),
        };

        const sneakerId = processedSnk.id || processedSnk._id;
        if (sneakerId && mongoose.Types.ObjectId.isValid(sneakerId)) {
          await SneakerModel.findOneAndUpdate(
            { _id: sneakerId },
            { $set: sneakerFields },
            { upsert: true }
          );
        } else {
          const newSneaker = new SneakerModel(sneakerFields);
          await newSneaker.save();
        }
      }
    }

    // cleanup temp data
    await TempBookingModel.findByIdAndDelete(tempBookingIdAttr.value);
    console.log("Deferred booking process completed successfully for order:", shopifyOrderId);

  } catch (err) {
    console.error("Error in deferred booking webhook:", err);
    return new Response(null, { status: 500 });
  }

  return new Response();
};
