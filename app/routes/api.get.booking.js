import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";
import {
  collectBookingImageIds,
  getImageUrls,
  normalizeBookingImages,
} from "../utils/shopifyImages.server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.public.appProxy(request);
    const body = await request.json();

    const bookingID = body.bookingID?.trim();
    const email = body.email?.trim().toLowerCase();
    const accessToken = body.accessToken?.trim();
    const actionType = body.actionType?.trim();
    const sneakerIndex = Number(body.sneakerIndex);
    const approvalStatus = body.approvalStatus?.trim();
    const approvalNote = body.approvalNote?.trim();

    if (!bookingID) {
      return new Response(
        JSON.stringify({ success: false, message: "Booking ID is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(bookingID)) {
      return new Response(
        JSON.stringify({ success: false, message: "Enter a valid booking ID." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let booking = null;

    if (accessToken) {
      const accessTokenHash = createHash("sha256").update(accessToken).digest("hex");
      booking = await BookingModel.findOne({
        _id: bookingID,
        accessTokenHash,
      });
    } else {
      if (!email) {
        return new Response(
          JSON.stringify({ success: false, message: "Email is required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!EMAIL_REGEX.test(email)) {
        return new Response(
          JSON.stringify({ success: false, message: "Enter a valid email address." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const escapedEmail = escapeRegex(email);

      booking = await BookingModel.findOne({
        _id: bookingID,
        $or: [
          { "guestInfo.email": { $regex: `^${escapedEmail}$`, $options: "i" } },
          { email: { $regex: `^${escapedEmail}$`, $options: "i" } },
        ],
      });
    }

    if (!booking) {
      return new Response(
        JSON.stringify({
          success: false,
          message: accessToken
            ? "No booking was found for that secure booking link."
            : "No booking was found for that booking ID and email address.",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (actionType === "UPDATE_CLEANING_APPROVAL") {
      if (!Number.isInteger(sneakerIndex) || !["approved", "rejected"].includes(approvalStatus)) {
        return new Response(
          JSON.stringify({ success: false, message: "Choose a sneaker and approve or reject." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const sneakers = [...(booking.sneakers || [])];
      const sneaker = sneakers[sneakerIndex];

      if (!sneaker) {
        return new Response(
          JSON.stringify({ success: false, message: "Sneaker not found." }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!Array.isArray(sneaker.cleanedImages) || sneaker.cleanedImages.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: "No cleaned images are available for approval yet." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (approvalStatus === "rejected" && !approvalNote) {
        return new Response(
          JSON.stringify({ success: false, message: "Please add a note before rejecting the cleaned images." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      sneakers[sneakerIndex] = {
        ...sneaker,
        cleanedImagesApprovalStatus: approvalStatus,
        cleanedImagesApprovalNote: approvalStatus === "rejected" ? approvalNote : null,
      };

      booking.sneakers = sneakers;
      await booking.save();
    }

    const imageMap = await getImageUrls(admin, collectBookingImageIds(booking));

    return new Response(
      JSON.stringify({
        success: true,
        message: actionType === "UPDATE_CLEANING_APPROVAL"
          ? `Cleaned images ${approvalStatus} successfully.`
          : undefined,
        booking: normalizeBookingImages(booking, imageMap),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in api.get.booking:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "An unexpected error occurred while looking up your booking.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
