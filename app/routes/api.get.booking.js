import mongoose from "mongoose";
import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function getImageUrls(admin, fileIds = []) {
  try {
    if (!fileIds.length) return {};

    const query = `
      query getFiles($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on MediaImage {
            id
            image {
              url
            }
          }
        }
      }
    `;

    const res = await admin.graphql(query, {
      variables: { ids: fileIds },
    });

    const data = await res.json();
    const map = {};

    if (data?.data?.nodes) {
      data.data.nodes.forEach((node) => {
        if (node?.id && node?.image?.url) {
          map[node.id] = node.image.url;
        }
      });
    }

    return map;
  } catch (error) {
    console.error("Error fetching image URLs:", error);
    return {};
  }
}

function normalizeBookingImages(booking, imageMap) {
  const updatedSneakers = (booking.sneakers || []).map((sneaker) => {
    const updatedImages = (sneaker.images || []).map((id) => {
      if (typeof id === "string" && id.startsWith("http")) {
        return id;
      }

      if (typeof id === "string" && id.startsWith("gid://shopify/")) {
        return imageMap[id] || null;
      }

      return null;
    });

    return {
      ...sneaker,
      images: updatedImages.filter(Boolean),
    };
  });

  return {
    ...booking.toObject(),
    sneakers: updatedSneakers,
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.public.appProxy(request);
    const body = await request.json();

    const bookingID = body.bookingID?.trim();
    const email = body.email?.trim().toLowerCase();
    console.log("bookingID", bookingID);
    console.log("email", email);

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

    const booking = await BookingModel.findOne({
      _id: bookingID,
      // customerID: null,
      $or: [
        { "guestInfo.email": { $regex: `^${escapedEmail}$`, $options: "i" } },
        { email: { $regex: `^${escapedEmail}$`, $options: "i" } },
      ],
    });

    if (!booking) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No booking was found for that booking ID and email address.",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const imageIds = [];
    (booking.sneakers || []).forEach((sneaker) => {
      (sneaker.images || []).forEach((id) => {
        if (typeof id === "string" && id.startsWith("gid://shopify/")) {
          imageIds.push(id);
        }
      });
    });

    const imageMap = await getImageUrls(admin, [...new Set(imageIds)]);

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
