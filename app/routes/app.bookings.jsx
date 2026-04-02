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

function buildCleanedSneakersEmail(booking) {
  const customerName = booking?.name || booking?.guestInfo?.name || "there";
  const accessUrl = booking?.secureAccessUrl;
  const cleanedSneakers = (booking?.sneakers || []).filter(
    (sneaker) => Array.isArray(sneaker.cleanedImages) && sneaker.cleanedImages.length > 0,
  );

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
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:680px;margin:0 auto;">
      <h2 style="margin-bottom:8px;">Your Sneakers Are Cleaned</h2>
      <p>Hello ${customerName},</p>
      <p>Your cleaned sneaker photos are now ready to view.</p>
      <p><strong>Booking ID:</strong> ${booking?._id?.toString() || "N/A"}</p>

      ${cleanedSneakers.length ? `
        <div style="margin:20px 0;padding:18px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;">
          <p style="margin-top:0;"><strong>Updated sneakers</strong></p>
          <ul style="padding-left:20px;margin-bottom:0;">
            ${sneakerList}
          </ul>
        </div>
      ` : ""}

      ${accessUrl ? `
        <div style="margin:24px 0;">
          <a href="${accessUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">
            View Cleaned Sneaker Images
          </a>
        </div>
        <p>If the button does not open, use this secure link:</p>
        <p><a href="${accessUrl}" style="color:#2563eb;word-break:break-all;">${accessUrl}</a></p>
      ` : `
        <p>Please open your booking details page and use your booking ID to view the cleaned images.</p>
      `}
    </div>
  `;
}

async function getNormalizedBooking(admin, booking) {
  const imageMap = await getImageUrls(admin, collectBookingImageIds(booking));
  return normalizeBookingImages(booking, imageMap);
}

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  try {
    if (actionType === "UPDATE_STATUS") {
      const id = formData.get("id");
      const status = formData.get("status");

      await BookingModel.findByIdAndUpdate(id, { status }, { new: true });
      return { success: true, actionType, message: "Status updated successfully" };
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
        };
      }

      booking.sneakers = sneakers;
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
      const booking = await BookingModel.findById(id);

      if (!booking) {
        return { success: false, actionType, message: "Booking not found." };
      }

      const recipientEmail = booking.email || booking.guestInfo?.email;

      if (!recipientEmail) {
        return { success: false, actionType, message: "Customer email is missing for this booking." };
      }

      const hasCleanedImages = (booking.sneakers || []).some(
        (sneaker) => Array.isArray(sneaker.cleanedImages) && sneaker.cleanedImages.length > 0,
      );

      if (!hasCleanedImages) {
        return { success: false, actionType, message: "Upload cleaned sneaker images before sending the email." };
      }

      await sendEmail(
        recipientEmail,
        `Your sneakers are cleaned: booking ${booking._id.toString()}`,
        buildCleanedSneakersEmail(booking),
      );
      return {
        success: true,
        actionType,
        message: "Customer email sent successfully.",
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
