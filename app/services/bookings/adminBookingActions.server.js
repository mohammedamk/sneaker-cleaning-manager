import BookingModel from "../../MongoDB/models/Booking";
import {
  collectBookingImageIds,
  getImageUrls,
  normalizeBookingImages,
  uploadImageToShopify,
} from "../../utils/shopifyImages.server";
import {
  getBookingRecipientEmail,
  sendBookingStatusEmail,
  sendCleanedSneakersEmail,
} from "./adminBookingEmails.server";

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

async function getNormalizedBooking(admin, booking) {
  const imageMap = await getImageUrls(admin, collectBookingImageIds(booking));
  return normalizeBookingImages(booking, imageMap);
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

async function updateBookingStatus(admin, formData, actionType) {
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

async function deleteBooking(formData, actionType) {
  const id = formData.get("id");
  await BookingModel.findByIdAndDelete(id);
  return { success: true, actionType, message: "Booking deleted successfully" };
}

async function uploadCleanedImages(admin, formData, actionType) {
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

async function deleteCleanedImage(admin, formData, actionType) {
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
        console.error("Shopify file delete errors:", data.data.fileDelete.userErrors);
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

  if (!Array.isArray(sneaker.cleanedImages) || sneaker.cleanedImages.length <= 1) {
    sneakers[sneakerIndex] = {
      ...sneakers[sneakerIndex],
      cleanedImagesApprovalStatus: null,
      cleanedImagesApprovalNote: null,
    };
  }

  booking.sneakers = sneakers;
  await booking.save();

  return {
    success: true,
    actionType,
    message: "Cleaned sneaker image deleted successfully.",
    booking: await getNormalizedBooking(admin, booking),
  };
}

async function sendCleanedEmail(admin, formData, actionType) {
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

  await sendCleanedSneakersEmail(booking, sneakerIndexToInclude);

  return {
    success: true,
    actionType,
    message: "Customer email sent successfully.",
    booking: await getNormalizedBooking(admin, booking),
  };
}

async function updateSneakerStatus(admin, formData, actionType) {
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

async function updateCleaningApproval(admin, formData, actionType) {
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

const ACTION_HANDLERS = {
  UPDATE_STATUS: updateBookingStatus,
  DELETE: deleteBooking,
  UPLOAD_CLEANED_IMAGES: uploadCleanedImages,
  DELETE_CLEANED_IMAGE: deleteCleanedImage,
  SEND_CLEANED_EMAIL: sendCleanedEmail,
  UPDATE_SNEAKER_STATUS: updateSneakerStatus,
  UPDATE_CLEANING_APPROVAL: updateCleaningApproval,
};

export async function executeAdminBookingAction(admin, formData) {
  const actionType = formData.get("actionType");
  const handler = ACTION_HANDLERS[actionType];

  if (!handler) {
    return { success: false, actionType, message: "Invalid action" };
  }

  try {
    return await handler(admin, formData, actionType);
  } catch (error) {
    return { success: false, actionType, message: error.message };
  }
}
