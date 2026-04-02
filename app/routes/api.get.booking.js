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

    const imageMap = await getImageUrls(admin, collectBookingImageIds(booking));

    return new Response(
      JSON.stringify({
        success: true,
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
