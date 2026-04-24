import { createHash, randomBytes } from "node:crypto";
import process from "node:process";
import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";
import SneakerModel from "../MongoDB/models/Sneaker";
import TempBookingModel from "../MongoDB/models/TempBooking";
import mongoose from "mongoose";
import sendEmail from "../utils/sendEmail";
import { verifyAndBuySelectedRate } from "../utils/easyPostShipping";
import { uploadImageToShopify } from "../utils/shopifyImages.server";

// In-memory lock to prevent concurrent processing of the same order
const processingLocks = new Map();
const LOCK_TIMEOUT = 60000; // 60 seconds lock timeout

/**
 * Acquire a processing lock for an order
 * Returns true if lock was acquired, false if already processing
 */
function tryAcquireLock(orderId) {
  const existingLock = processingLocks.get(orderId);
  if (existingLock) {
    // Check if lock has timed out
    if (Date.now() - existingLock.timestamp < LOCK_TIMEOUT) {
      return false;
    }
    // Lock has timed out, remove it
    processingLocks.delete(orderId);
  }
  processingLocks.set(orderId, { timestamp: Date.now() });
  return true;
}

/**
 * Release a processing lock for an order
 */
function releaseLock(orderId) {
  processingLocks.delete(orderId);
}

/**
 * Clean up expired locks periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [orderId, lock] of processingLocks.entries()) {
    if (now - lock.timestamp > LOCK_TIMEOUT) {
      processingLocks.delete(orderId);
    }
  }
}, 30000); // Clean up every 30 seconds

/**
 * Process booking creation in the background
 */
async function processBookingInBackground({
  admin,
  payload,
  shop,
  shopifyOrderId,
  tempBooking,
  tempBookingIdAttr
}) {
  try {
    console.log(`Starting background processing for order: ${shopifyOrderId}`);
    
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
            const result = await uploadImageToShopify(admin, b64OrGid, {
              filename: `sneaker-${Date.now()}-${j}.jpg`,
              alt: sneakerInput?.nickname || "Sneaker image",
            });

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

    const normalizedBookingPayload = {
      ...bookingData,
      sneakers: processedSneakers,
    };

    const bookingDoc = new BookingModel({
      customerID: bookingData.customerID,
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      guestInfo: bookingData.customerID ? null : bookingData.guestInfo,
      handoffMethod: bookingData.handoffMethod,
      sneakers: processedSneakers,
      fullPayload: normalizedBookingPayload,
      shopifyOrderID: shopifyOrderId,
      submittedAt: bookingData.submittedAt ? new Date(bookingData.submittedAt) : new Date(),
      status: "Pending"
    });

    const accessToken = randomBytes(32).toString("hex");
    bookingDoc.accessTokenHash = createHash("sha256").update(accessToken).digest("hex");
    
    try {
      await bookingDoc.save();
    } catch (saveError) {
      if (saveError.code === 11000) {
        // Duplicate key error - another process already created this booking
        console.log("Duplicate booking detected (likely created by concurrent process):", shopifyOrderId);
        return;
      }
      throw saveError;
    }

    bookingDoc.secureAccessUrl = buildSecureBookingAccess(shop, bookingDoc._id.toString(), accessToken);
    bookingDoc.qrCodeImageUrl = buildQrCodeImageUrl(bookingDoc.secureAccessUrl);
    await bookingDoc.save();

    if (bookingData.handoffMethod === "shipping" && bookingData.shippingSelection) {
      bookingDoc.shipping = {
        ...bookingData.shippingSelection,
      };

      const shippingContact = {
        ...bookingData.shippingSelection.customerAddress,
        email: bookingData.shippingSelection.customerAddress?.email || customerEmail || bookingData.guestInfo?.email || "",
      };

      if (bookingData.shippingSelection.selectedForwardRate) {
        const verificationResult = process.env.EASYPOST_API_KEY
          ? await verifyAndBuySelectedRate({
            customerAddress: shippingContact,
            parcel: bookingData.shippingSelection.parcel,
            selectedRate: bookingData.shippingSelection.selectedForwardRate,
            direction: "customer_to_store",
            referencePrefix: bookingDoc._id.toString(),
          })
          : buildTestShippingPurchase({
            bookingId: bookingDoc._id.toString(),
            shippingSelection: bookingData.shippingSelection,
            shippingContact,
          });

        if (verificationResult.status === "purchased") {
          bookingDoc.shipping = {
            ...bookingDoc.shipping,
            purchaseStatus: "customer_to_store_purchased",
            labels: {
              ...(bookingDoc.shipping?.labels || {}),
              customerToStore: verificationResult.label,
            },
            storeAddress: verificationResult.storeAddress,
            isTestData: Boolean(verificationResult.isTestData),
            purchasedAt: new Date(),
          };
        } else {
          console.log(`shipping rate changed for sneaker booking of shipping selection:`, {
            bookingDoc,
            orderPayload: payload,
            shippingSelection: bookingData.shippingSelection,
            verificationResult,
          });
          // in case of rate changed
          // bookingDoc.shipping = {
          //   ...bookingDoc.shipping,
          //   purchaseStatus: "customer_to_store_rate_changed",
          //   changedRates: verificationResult.changedRates,
          //   storeAddress: verificationResult.storeAddress,
          //   flaggedAt: new Date(),
          // };

          // await sendEmail(
          //   ADMIN_NOTIFICATION_EMAIL,
          //   "EasyPost shipping rate changed for sneaker booking",
          //   buildRateChangedEmail({
          //     bookingDoc,
          //     orderPayload: payload,
          //     shippingSelection: bookingData.shippingSelection,
          //     verificationResult,
          //   }),
          // );
        }
      }

      await bookingDoc.save();
    }

    await saveBookingAccessToOrder(admin, shopifyOrderId, bookingDoc, payload.note_attributes);

    const recipientEmail = customerEmail || bookingData.guestInfo?.email;
    if (recipientEmail) {
      await sendEmail(
        recipientEmail,
        `Booking confirmed: ${bookingDoc._id.toString()}`,
        buildCustomerBookingEmail({
          bookingDoc,
          orderPayload: payload,
          accessUrl: bookingDoc.secureAccessUrl,
          qrCodeImageUrl: bookingDoc.qrCodeImageUrl,
        }),
      );
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
    console.log("Background booking process completed successfully for order:", shopifyOrderId);

  } catch (err) {
    console.error("Error in background booking processing:", err);
  } finally {
    // Always release the lock when processing is done
    releaseLock(shopifyOrderId);
  }
}

const TEST_STORE_ADDRESS = {
  name: "Sneaker Cleaning Manager Test Store",
  company: "Sneaker Cleaning Manager",
  street1: "123 Test Shipping Lane",
  street2: "Suite 4",
  city: "New York",
  state: "NY",
  zip: "10001",
  country: "US",
  phone: "2125550100",
};

const ADMIN_NOTIFICATION_EMAIL = "test@gmail.com";
const ORDER_UPDATE_MUTATION = `
mutation orderUpdate($input: OrderInput!) {
  orderUpdate(input: $input) {
    order {
      id
      customAttributes {
        key
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

function buildSecureBookingAccess(shopHost, bookingId, accessToken) {
  const params = new URLSearchParams({
    bookingId,
    accessToken,
  });

  return `https://${shopHost}/pages/book-sneaker-pick-up?${params.toString()}`;
}

function buildQrCodeImageUrl(accessUrl) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(accessUrl)}`;
}

function buildCustomerBookingEmail({ bookingDoc, orderPayload, accessUrl, qrCodeImageUrl }) {
  const customerName = bookingDoc?.name || bookingDoc?.guestInfo?.name || "there";
  
  const shippingLabelsSection = bookingDoc?.shipping?.labels
    ? `
      <div style="margin-top:24px;">
        <h3 style="margin:0 0 16px;color:#111827;">Shipping Labels</h3>
        ${bookingDoc.shipping.labels.customerToStore ? `
          <div style="margin-bottom:16px;padding:16px;border:1px solid #d0d5dd;border-radius:10px;background:#f8fafc;">
            <h4 style="margin:0 0 12px 0;color:#374151;font-size:14px;">Forward Shipping Label (Customer to Store)</h4>
            ${bookingDoc.shipping.labels.customerToStore.trackingCode ? `
              <p style="margin:0 0 12px 0;font-size:13px;color:#6b7280;">
                <strong>Tracking Code:</strong> ${bookingDoc.shipping.labels.customerToStore.trackingCode}
              </p>
            ` : ""}
            <p style="margin:0;">
              <a href="${bookingDoc.shipping.labels.customerToStore.postageLabel?.label_url || bookingDoc.shipping.labels.customerToStore.postageLabel?.label_pdf_url}" 
                 style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:600;font-size:13px;margin-right:8px;">
                Download Label
              </a>
            </p>
          </div>
        ` : ""}
        ${bookingDoc.shipping.labels.storeToCustomer ? `
          <div style="margin-bottom:0;padding:16px;border:1px solid #d0d5dd;border-radius:10px;background:#f8fafc;">
            <h4 style="margin:0 0 12px 0;color:#374151;font-size:14px;">Return Shipping Label (Store to Customer)</h4>
            ${bookingDoc.shipping.labels.storeToCustomer.trackingCode ? `
              <p style="margin:0 0 12px 0;font-size:13px;color:#6b7280;">
                <strong>Tracking Code:</strong> ${bookingDoc.shipping.labels.storeToCustomer.trackingCode}
              </p>
            ` : ""}
            <p style="margin:0;">
              <a href="${bookingDoc.shipping.labels.storeToCustomer.postageLabel?.label_url || bookingDoc.shipping.labels.storeToCustomer.postageLabel?.label_pdf_url}" 
                 style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:600;font-size:13px;margin-right:8px;">
                Download Label
              </a>
            </p>
          </div>
        ` : ""}
      </div>
    `
    : "";

  const shippingInstructions = bookingDoc?.handoffMethod === "shipping"
    ? `
      <div style="margin-top:24px;padding:20px;border:1px solid #fde68a;border-radius:12px;background:#fffbeb;">
        <h3 style="margin:0 0 12px;">Shipping Instructions</h3>
        <p style="margin:0 0 12px;">Before shipping your footwear, please package all pairs together in one box.</p>
        <p style="margin:0 0 12px;">All footwear should be shipped outside of their original boxes or packaging.</p>
        <p style="margin:0 0 12px;">Please ship only the footwear included in your order. Including unrelated items or unregistered pairs may result in delays, additional charges, or order cancellation.</p>
        <p style="margin:0;">This helps us keep shipping fair, accurate, and efficient for everyone.</p>
      </div>
    `
    : "";
  const sneakerRows = (bookingDoc?.sneakers || [])
    .map((sneaker) => {
      const sneakerName = sneaker.nickname || "Unnamed sneaker";
      const sneakerDetails = [sneaker.brand, sneaker.model, sneaker.colorway]
        .filter(Boolean)
        .join(" - ");
      const service = sneaker.services?.tier
        ? `${sneaker.services.tier}${sneaker.services.addOns?.length ? ` + ${sneaker.services.addOns.join(", ")}` : ""}`
        : "Service details pending";

      return `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;">${sneakerName}</td>
          <td style="padding:8px;border:1px solid #ddd;">${sneakerDetails || "N/A"}</td>
          <td style="padding:8px;border:1px solid #ddd;">${service}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:680px;margin:0 auto;">
      <h2 style="margin-bottom:8px;">Your Sneaker Cleaning Booking Is Confirmed</h2>
      <p>Hello ${customerName},</p>
      <p>Your booking has been created successfully. You can scan the QR code below or use the secure button to open your booking details page directly.</p>

      <div style="margin:24px 0;padding:20px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;text-align:center;">
        <img src="${qrCodeImageUrl}" alt="QR code for your booking details" width="220" height="220" style="display:block;margin:0 auto 16px;" />
        <a href="${accessUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">
          View Booking Details
        </a>
      </div>

      <p><strong>Booking ID:</strong> ${bookingDoc?._id?.toString() || "N/A"}</p>
      <p><strong>Order:</strong> ${orderPayload?.name || orderPayload?.id || "N/A"}</p>
      <p><strong>Status:</strong> ${bookingDoc?.status || "Pending"}</p>
      <p><strong>Handoff Method:</strong> ${bookingDoc?.handoffMethod || "N/A"}</p>

      <table style="width:100%;border-collapse:collapse;margin-top:20px;">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;background:#f3f4f6;">Sneaker</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;background:#f3f4f6;">Details</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;background:#f3f4f6;">Service</th>
          </tr>
        </thead>
        <tbody>${sneakerRows}</tbody>
      </table>

      ${shippingLabelsSection}
      ${shippingInstructions}

      <p style="margin-top:20px;">If the button does not open, use this secure link:</p>
      <p><a href="${accessUrl}" style="color:#2563eb;word-break:break-all;">${accessUrl}</a></p>
    </div>
  `;
}

async function saveBookingAccessToOrder(admin, orderId, bookingDoc, existingAttributes = []) {
  const preservedAttributes = (existingAttributes || [])
    .filter((attribute) => ![
      "booking_id",
      "booking_access_url",
      "booking_qr_code_url",
      "booking_handoff_method",
      "has_booking_shipping",
      "booking_shipping_directions",
    ].includes(attribute.name))
    .map((attribute) => ({
      key: attribute.name,
      value: String(attribute.value ?? ""),
    }));

  const shippingDirections = [];
  if (bookingDoc?.shipping?.selectedForwardRate) {
    shippingDirections.push("customer_to_store");
  }
  if (bookingDoc?.shipping?.selectedReturnRate) {
    shippingDirections.push("store_to_customer");
  }

  const customAttributes = [
    ...preservedAttributes,
    {
      key: "booking_id",
      value: bookingDoc._id.toString(),
    },
    {
      key: "booking_access_url",
      value: bookingDoc.secureAccessUrl,
    },
    {
      key: "booking_qr_code_url",
      value: bookingDoc.qrCodeImageUrl,
    },
    {
      key: "booking_handoff_method",
      value: bookingDoc?.handoffMethod || "dropoff",
    },
    {
      key: "has_booking_shipping",
      value: bookingDoc?.handoffMethod === "shipping" ? "true" : "false",
    },
    {
      key: "booking_shipping_directions",
      value: shippingDirections.join(","),
    },
  ];

  const response = await admin.graphql(ORDER_UPDATE_MUTATION, {
    variables: {
      input: {
        id: orderId,
        customAttributes,
      },
    },
  });

  const data = await response.json();
  const userErrors = data?.data?.orderUpdate?.userErrors || [];

  if (userErrors.length) {
    console.error("Failed to save booking access customAttributes on order:", userErrors);
  }
}

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

function buildTestLabel(direction, bookingId, selectedRate, customerAddress) {
  const fallbackCarrier = direction === "customerToStore" ? "USPS" : "UPS";
  const fallbackService = direction === "customerToStore" ? "Priority" : "Ground";
  const baseRate = selectedRate || {};
  const trackingSuffix = bookingId.slice(-6).toUpperCase();
  const trackingCode = direction === "customerToStore"
    ? `TEST-IN-${trackingSuffix}`
    : `TEST-OUT-${trackingSuffix}`;

  return {
    shipmentId: `test-shipment-${direction}-${bookingId}`,
    trackingCode,
    selectedRate: {
      id: baseRate.id || `test-rate-${direction}-${bookingId}`,
      carrier: baseRate.carrier || fallbackCarrier,
      service: baseRate.service || fallbackService,
      amount: Number(baseRate.amount || 0),
      amountDisplay: Number(baseRate.amount || 0).toFixed(2),
      currency: baseRate.currency || "USD",
      deliveryDays: baseRate.deliveryDays || null,
      deliveryDate: baseRate.deliveryDate || null,
      deliveryDateGuaranteed: Boolean(baseRate.deliveryDateGuaranteed),
      shipmentId: `test-shipment-${direction}-${bookingId}`,
    },
    postageLabel: {
      label_url: `https://example.com/test-labels/${bookingId}/${direction}.pdf`,
      label_pdf_url: `https://example.com/test-labels/${bookingId}/${direction}.pdf`,
      label_zpl_url: null,
      label_epl2_url: null,
      label_file_type: "application/pdf",
      label_size: "4x6",
      label_date: new Date().toISOString(),
      label_resolution: 300,
      recipient: {
        name: customerAddress?.name || "Test Customer",
        street1: customerAddress?.street1 || "123 Test Street",
        city: customerAddress?.city || "Brooklyn",
        state: customerAddress?.state || "NY",
        zip: customerAddress?.zip || "11201",
      },
    },
  };
}

function buildTestShippingPurchase({ bookingId, shippingSelection, shippingContact }) {
  return {
    status: "purchased",
    label: buildTestLabel(
      "customerToStore",
      bookingId,
      shippingSelection?.selectedForwardRate,
      shippingContact,
    ),
    storeAddress: TEST_STORE_ADDRESS,
    isTestData: true,
  };
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

    // Check if we can acquire a lock for this order
    if (!tryAcquireLock(shopifyOrderId)) {
      console.log("Order is already being processed:", shopifyOrderId);
      return new Response();
    }

    // Send immediate response to Shopify to prevent retries
    const response = new Response("Webhook received", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });

    // Process booking in the background
    // Use setImmediate to ensure the response is sent first
    setImmediate(() => {
      processBookingInBackground({
        admin,
        payload,
        shop,
        shopifyOrderId,
        tempBooking,
        tempBookingIdAttr
      }).catch((err) => {
        console.error("Background booking processing failed:", err);
        // Release lock on error
        releaseLock(shopifyOrderId);
      });
    });

    return response;

  } catch (err) {
    console.error("Error in webhook handler:", err);
    return new Response(null, { status: 500 });
  }
};
