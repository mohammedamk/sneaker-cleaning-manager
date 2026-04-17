import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";
import BookingsIndex from "../component/bookings/BookingsIndex";
import bookingsStyles from "../component/bookings/bookings.css?url";
import sendEmail from "../utils/sendEmail";
import {
  collectBookingImageIds,
  getImageUrls,
  normalizeBookingImages,
  uploadImageToShopify,
} from "../utils/shopifyImages.server";

export const links = () => [
  { rel: "stylesheet", href: bookingsStyles },
];

const FILE_DELETE_MUTATION = `
mutation fileDelete($fileIds: [ID!]!) {
  fileDelete(fileIds: $fileIds) {
    deletedFileIds
    userErrors {
      field
      message
      code
    }
  }
}
`;

const ORDER_CANCEL_MUTATION = `
mutation OrderCancel(
  $orderId: ID!
  $refundMethod: OrderCancelRefundMethodInput!
  $restock: Boolean!
  $reason: OrderCancelReason!
) {
  orderCancel(
    orderId: $orderId
    refundMethod: $refundMethod
    restock: $restock
    reason: $reason
  ) {
    job {
      id
      done
    }
    orderCancelUserErrors {
      field
      message
      code
    }
    userErrors {
      field
      message
    }
  }
}
`;

const BOOKING_STATUS_EMAIL_CONFIG = {
  Received: {
    subject: (booking) => `We received your sneakers: booking ${booking._id.toString()}`,
    heading: "Your sneakers have been received",
    message: [
      "We have received your sneakers at the store.",
      "Our team will inspect them next, and the cleaning process will begin shortly.",
    ],
  },
  "Cleaning Complete": {
    subject: (booking) => `Cleaning complete for booking ${booking._id.toString()}`,
    heading: "Cleaning is complete",
    message: [
      "Your sneaker cleaning service has been completed.",
      "We will notify you again as soon as your order is ready for pickup or shipment.",
    ],
  },
  "Ready for Pickup / Shipment": {
    subject: (booking) => `Booking ready for pickup or shipment: ${booking._id.toString()}`,
    heading: "Your order is ready",
    message: (booking) => [
      booking.handoffMethod === "shipping"
        ? "Your order is now ready for shipment."
        : "Your order is now ready for pickup.",
      "You can review your booking details any time from the booking page.",
    ],
  },
};

function getBookingCustomerName(booking) {
  return booking?.name || booking?.guestInfo?.name || "there";
}

function getBookingRecipientEmail(booking) {
  return booking?.email || booking?.guestInfo?.email || "";
}

function buildBookingAccessSection(booking, buttonLabel = "View Booking Details") {
  const accessUrl = booking?.secureAccessUrl;

  if (!accessUrl) {
    return "";
  }

  return `
    <div style="margin:24px 0;">
      <a href="${accessUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">
        ${buttonLabel}
      </a>
    </div>
    <p style="margin:0;"><a href="${accessUrl}" style="color:#2563eb;word-break:break-all;">${accessUrl}</a></p>
  `;
}

function buildBookingEmailContent({ booking, heading, message, buttonLabel = "View Booking Details", footerMessage = "" }) {
  const customerName = getBookingCustomerName(booking);
  const bookingId = booking?._id?.toString() || "N/A";
  const paragraphs = (Array.isArray(message) ? message : [message])
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 12px;">${paragraph}</p>`)
    .join("");

  return `
    <h2 style="margin:0 0 8px;">${heading}</h2>
    <p style="margin:0 0 12px;">Hello ${customerName},</p>
    ${paragraphs}
    <p style="margin:0 0 16px;"><strong>Booking ID:</strong> ${bookingId}</p>
    ${buildBookingAccessSection(booking, buttonLabel)}
    ${footerMessage ? `<p style="margin:16px 0 0;">${footerMessage}</p>` : ""}
  `;
}

function buildCleanedSneakersEmail(booking, sneakerIndexToInclude = null) {
  let cleanedSneakers = (booking?.sneakers || []).filter(
    (sneaker) => Array.isArray(sneaker.cleanedImages) && sneaker.cleanedImages.length > 0,
  );

  if (Number.isInteger(sneakerIndexToInclude)) {
    cleanedSneakers = cleanedSneakers.filter((_, idx) => idx === sneakerIndexToInclude);
  }

  const sneakerList = cleanedSneakers
    .map((sneaker) => {
      const sneakerName = sneaker.nickname || "Unnamed sneaker";
      const details = [sneaker.brand, sneaker.model, sneaker.colorway]
        .filter(Boolean)
        .join(" - ");

      return `
        <li style="margin-bottom:8px;">
          <strong>${sneakerName}</strong>${details ? ` <span style="color:#6b7280;">(${details})</span>` : ""}
        </li>
      `;
    })
    .join("");

  return `
    ${buildBookingEmailContent({
      booking,
      heading: "Your sneakers are cleaned",
      message: [
        "Your cleaned sneaker photos are now ready to view.",
        "Please review the after-cleaning images from your order details page and approve them once you are satisfied.",
      ],
      buttonLabel: "Review Cleaned Sneaker Images",
      footerMessage: booking?.secureAccessUrl
        ? "If the button does not open, use the secure link above to open your booking details page."
        : "Please open your booking details page and use your booking ID to review the cleaned images.",
    })}
    ${cleanedSneakers.length ? `
      <div style="margin:20px 0 0;padding:18px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;">
        <p style="margin:0 0 10px;"><strong>Updated sneakers</strong></p>
        <ul style="padding-left:20px;margin:0;">
          ${sneakerList}
        </ul>
      </div>
    ` : ""}
  `;
}

async function sendBookingStatusEmail(booking, status) {
  const recipientEmail = getBookingRecipientEmail(booking);

  if (!recipientEmail) {
    return;
  }

  const emailConfig = BOOKING_STATUS_EMAIL_CONFIG[status];

  if (!emailConfig) {
    return;
  }

  const message = typeof emailConfig.message === "function"
    ? emailConfig.message(booking)
    : emailConfig.message;

  await sendEmail(
    recipientEmail,
    emailConfig.subject(booking),
    buildBookingEmailContent({
      booking,
      heading: emailConfig.heading,
      message,
    }),
  );
}

async function getNormalizedBooking(admin, booking) {
  const imageMap = await getImageUrls(admin, collectBookingImageIds(booking));
  return normalizeBookingImages(booking, imageMap);
}

function hasCleanedImages(booking) {
  return (booking?.sneakers || []).some(
    (sneaker) => Array.isArray(sneaker.cleanedImages) && sneaker.cleanedImages.length > 0,
  );
}

async function cancelShopifyOrder(admin, shopifyOrderID) {
  if (!shopifyOrderID) {
    return;
  }

  const response = await admin.graphql(ORDER_CANCEL_MUTATION, {
    variables: {
      orderId: shopifyOrderID,
      refundMethod: {
        originalPaymentMethodsRefund: false,
      },
      restock: true,
      reason: "CUSTOMER",
    },
  });

  const data = await response.json();
  const payload = data?.data?.orderCancel;
  const orderCancelUserErrors = payload?.orderCancelUserErrors || [];
  const userErrors = payload?.userErrors || [];
  const allErrors = [...orderCancelUserErrors, ...userErrors];

  if (allErrors.length > 0) {
    const errorMessage = allErrors
      .map((error) => error?.message)
      .filter(Boolean)
      .join(", ");

    throw new Error(errorMessage || "Shopify could not cancel the order.");
  }
}

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  try {
    if (actionType === "UPDATE_STATUS") {
      const id = formData.get("id");
      const status = formData.get("status");

      const booking = await BookingModel.findById(id);

      if (!booking) {
        return { success: false, actionType, message: "Booking not found." };
      }

      const previousStatus = booking.status;

      if (status === "Canceled" && previousStatus !== "Canceled") {
        await cancelShopifyOrder(admin, booking.shopifyOrderID);
      }

      booking.status = status;

      if (status === "Completed" && previousStatus !== "Completed") {
        booking.lastCleaning = new Date();
      }

      await booking.save();
      if (status !== previousStatus) {
        await sendBookingStatusEmail(booking, status);
      }

      return {
        success: true,
        actionType,
        message: "Status updated successfully",
        booking: await getNormalizedBooking(admin, booking),
      };
    }
    if (actionType === "DELETE") {
      const id = formData.get("id");
      await BookingModel.findByIdAndDelete(id);
      return { success: true, actionType, message: "Booking deleted successfully" };
    }
    if (actionType === "UPLOAD_CLEANED_IMAGES") {
      const id = formData.get("id");
      const cleanedUploadsRaw = formData.get("cleanedUploads");

      if (!id || !cleanedUploadsRaw) {
        return { success: false, actionType, message: "Booking and image payload are required." };
      }

      const booking = await BookingModel.findById(id);

      if (!booking) {
        return { success: false, actionType, message: "Booking not found." };
      }

      const cleanedUploads = JSON.parse(cleanedUploadsRaw);
      const sneakers = [...(booking.sneakers || [])];

      for (const uploadEntry of cleanedUploads) {
        const sneakerIndex = Number(uploadEntry?.sneakerIndex);
        const images = Array.isArray(uploadEntry?.images) ? uploadEntry.images : [];

        if (!Number.isInteger(sneakerIndex) || !sneakers[sneakerIndex]) {
          continue;
        }

        const uploadedImageIds = [];

        for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
          const base64Image = images[imageIndex];
          if (!base64Image) continue;

          const uploadResult = await uploadImageToShopify(admin, base64Image, {
            filename: `cleaned-sneaker-${booking._id}-${sneakerIndex}-${Date.now()}-${imageIndex}.jpg`,
            alt: "Cleaned sneaker image",
          });

          if (uploadResult?.id) {
            uploadedImageIds.push(uploadResult.id);
          }
        }

        if (!uploadedImageIds.length) {
          return {
            success: false,
            actionType,
            message: "We could not upload the cleaned sneaker images. Please try again.",
          };
        }

        sneakers[sneakerIndex] = {
          ...sneakers[sneakerIndex],
          cleanedImages: [
            ...(Array.isArray(sneakers[sneakerIndex].cleanedImages) ? sneakers[sneakerIndex].cleanedImages : []),
            ...uploadedImageIds,
          ],
          cleanedImagesApprovalStatus: null,
          cleanedImagesApprovalNote: null,
        };
      }

      booking.sneakers = sneakers;
      booking.cleanedImagesApprovalStatus = null;
      booking.cleanedImagesApprovalNote = null;
      await booking.save();
      return {
        success: true,
        actionType,
        message: "Cleaned sneaker images uploaded successfully.",
        booking: await getNormalizedBooking(admin, booking),
      };
    }
    if (actionType === "DELETE_CLEANED_IMAGE") {
      const id = formData.get("id");
      const sneakerIndex = Number(formData.get("sneakerIndex"));
      const imageIndex = Number(formData.get("imageIndex"));

      if (!id || !Number.isInteger(sneakerIndex) || !Number.isInteger(imageIndex)) {
        return { success: false, actionType, message: "Booking, sneaker, and image selection are required." };
      }

      const booking = await BookingModel.findById(id);

      if (!booking) {
        return { success: false, actionType, message: "Booking not found." };
      }

      const sneakers = [...(booking.sneakers || [])];
      const sneaker = sneakers[sneakerIndex];

      if (!sneaker) {
        return { success: false, actionType, message: "Sneaker not found." };
      }

      const cleanedImages = Array.isArray(sneaker.cleanedImages) ? [...sneaker.cleanedImages] : [];

      if (imageIndex < 0 || imageIndex >= cleanedImages.length) {
        return { success: false, actionType, message: "Cleaned image not found." };
      }

      const imageToDelete = cleanedImages[imageIndex];

      if (typeof imageToDelete === "string" && imageToDelete.startsWith("gid://shopify/")) {
        try {
          const response = await admin.graphql(FILE_DELETE_MUTATION, {
            variables: {
              fileIds: [imageToDelete],
            },
          });

          const data = await response.json();

          if (data?.data?.fileDelete?.userErrors?.length) {
            console.error(
              "Shopify file delete errors:",
              data.data.fileDelete.userErrors,
            );
          }
        } catch (error) {
          console.error("Error deleting cleaned image from Shopify:", error);
        }
      }

      cleanedImages.splice(imageIndex, 1);

      sneakers[sneakerIndex] = {
        ...sneaker,
        cleanedImages,
      };

      booking.sneakers = sneakers;
      if (!Array.isArray(sneaker.cleanedImages) || sneaker.cleanedImages.length <= 1) {
        // If this was the last cleaned image, clear the approval status
        sneakers[sneakerIndex] = {
          ...sneakers[sneakerIndex],
          cleanedImagesApprovalStatus: null,
          cleanedImagesApprovalNote: null,
        };
      }
      await booking.save();

      return {
        success: true,
        actionType,
        message: "Cleaned sneaker image deleted successfully.",
        booking: await getNormalizedBooking(admin, booking),
      };
    }
    if (actionType === "SEND_CLEANED_EMAIL") {
      const id = formData.get("id");
      const sneakerIndex = formData.get("sneakerIndex");
      const booking = await BookingModel.findById(id);

      if (!booking) {
        return { success: false, actionType, message: "Booking not found." };
      }

      const recipientEmail = getBookingRecipientEmail(booking);

      if (!recipientEmail) {
        return { success: false, actionType, message: "Customer email is missing for this booking." };
      }

      const sneakerIndexToInclude = sneakerIndex !== null && sneakerIndex !== undefined && sneakerIndex !== "" 
        ? Number(sneakerIndex) 
        : null;

      let cleanedSneakersToNotify = (booking.sneakers || []).filter(
        (sneaker) => Array.isArray(sneaker.cleanedImages) && sneaker.cleanedImages.length > 0,
      );

      if (Number.isInteger(sneakerIndexToInclude)) {
        cleanedSneakersToNotify = cleanedSneakersToNotify.filter((_, idx) => idx === sneakerIndexToInclude);
      }

      if (!cleanedSneakersToNotify.length) {
        return { success: false, actionType, message: "No cleaned sneaker images available to send." };
      }

      await sendEmail(
        recipientEmail,
        `Your sneakers are cleaned: booking ${booking._id.toString()}`,
        buildCleanedSneakersEmail(booking, sneakerIndexToInclude),
      );
      return {
        success: true,
        actionType,
        message: "Customer email sent successfully.",
        booking: await getNormalizedBooking(admin, booking),
      };
    }
    if (actionType === "UPDATE_SNEAKER_STATUS") {
      const bookingId = formData.get("bookingId");
      const sneakerIndex = Number(formData.get("sneakerIndex"));
      const status = formData.get("status");

      if (!bookingId || !Number.isInteger(sneakerIndex) || !["Pending", "In Cleaning", "Cleaning Complete"].includes(status)) {
        return { success: false, actionType, message: "Valid booking, sneaker index, and status are required." };
      }

      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        return { success: false, actionType, message: "Booking not found." };
      }

      const sneakers = [...(booking.sneakers || [])];
      const sneaker = sneakers[sneakerIndex];

      if (!sneaker) {
        return { success: false, actionType, message: "Sneaker not found." };
      }

      sneakers[sneakerIndex] = {
        ...sneaker,
        status,
      };

      booking.sneakers = sneakers;
      await booking.save();

      return {
        success: true,
        actionType,
        message: "Sneaker status updated successfully.",
        booking: await getNormalizedBooking(admin, booking),
      };
    }
    if (actionType === "UPDATE_CLEANING_APPROVAL") {
      const id = formData.get("id");
      const sneakerIndex = Number(formData.get("sneakerIndex"));
      const approvalStatus = formData.get("approvalStatus");
      const approvalNote = formData.get("approvalNote")?.toString().trim();

      if (!id || !Number.isInteger(sneakerIndex) || !["approved", "rejected"].includes(approvalStatus)) {
        return { success: false, actionType, message: "A valid booking, sneaker, and approval status are required." };
      }

      const booking = await BookingModel.findById(id);

      if (!booking) {
        return { success: false, actionType, message: "Booking not found." };
      }

      const sneakers = [...(booking.sneakers || [])];
      const sneaker = sneakers[sneakerIndex];

      if (!sneaker) {
        return { success: false, actionType, message: "Sneaker not found." };
      }

      if (!Array.isArray(sneaker.cleanedImages) || sneaker.cleanedImages.length === 0) {
        return { success: false, actionType, message: "No cleaned images available for this sneaker." };
      }

      if (approvalStatus === "rejected" && !approvalNote) {
        return { success: false, actionType, message: "Add a note before marking the cleaned images as rejected." };
      }

      sneakers[sneakerIndex] = {
        ...sneaker,
        cleanedImagesApprovalStatus: approvalStatus,
        cleanedImagesApprovalNote: approvalStatus === "rejected" ? approvalNote : null,
      };

      booking.sneakers = sneakers;
      await booking.save();

      return {
        success: true,
        actionType,
        message: `Sneaker cleaned images marked as ${approvalStatus}.`,
        booking: await getNormalizedBooking(admin, booking),
      };
    }
  } catch (error) {
    return { success: false, actionType, message: error.message };
  }
  return { success: false, actionType, message: "Invalid action" };
};

export default function BookingsRoute() {
  return <BookingsIndex />;
}
