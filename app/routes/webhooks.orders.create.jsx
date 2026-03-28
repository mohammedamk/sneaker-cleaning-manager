import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";
import SneakerModel from "../MongoDB/models/Sneaker";
import TempBookingModel from "../MongoDB/models/TempBooking";
import mongoose from "mongoose";

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

export const action = async ({ request }) => {
  const { admin, payload, topic, shop } = await authenticate.webhook(request);

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
    const existing = await BookingModel.findOne({ shopifyOrderID: shopifyOrderId });
    if (existing) {
      console.log("Booking already exists for orderID:", shopifyOrderId);
      return new Response();
    }

    const tempBooking = await TempBookingModel.findById(tempBookingIdAttr.value);
    if (!tempBooking) {
      console.error("Temp booking data not found for ID:", tempBookingIdAttr.value);
      return new Response();
    }

    const bookingData = tempBooking.payload;
    console.log("Finalizing booking for:", bookingData.guestInfo?.email || bookingData.customerID);

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

    const bookingDoc = new BookingModel({
      customerID: bookingData.customerID,
      guestInfo: bookingData.guestInfo,
      handoffMethod: bookingData.handoffMethod,
      sneakers: processedSneakers,
      fullPayload: bookingData,
      shopifyOrderID: shopifyOrderId,
      submittedAt: bookingData.submittedAt ? new Date(bookingData.submittedAt) : new Date(),
      status: "Pending"
    });

    await bookingDoc.save();

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
            { _id: sneakerId, customerID: bookingData.customerID },
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
