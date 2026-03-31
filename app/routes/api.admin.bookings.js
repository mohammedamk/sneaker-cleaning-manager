import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";

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
        console.error("Error fetching booking image URLs:", error);
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

export const action = async ({ request }) => {
    try {
        const { admin } = await authenticate.admin(request);
        const body = await request.json();
        const page = parseInt(body.page || "1");
        const limit = parseInt(body.limit || "10");
        const search = body.search || "";

        const skip = (page - 1) * limit;

        let filter = {};
        if (search) {
            const searchRegex = new RegExp(search, "i");
            filter = {
                $or: [
                    { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : undefined },
                    { "guestInfo.name": searchRegex },
                    { "guestInfo.email": searchRegex },
                    { name: searchRegex },
                    { email: searchRegex },
                    { status: searchRegex },
                    { handoffMethod: searchRegex }
                ].filter(Boolean)
            };
        }

        const [bookings, total] = await Promise.all([
            BookingModel.find(filter)
                .sort({ submittedAt: -1 })
                .skip(skip)
                .limit(limit),
            BookingModel.countDocuments(filter)
        ]);

        const imageIds = [];

        bookings.forEach((booking) => {
            (booking.sneakers || []).forEach((sneaker) => {
                (sneaker.images || []).forEach((id) => {
                    if (typeof id === "string" && id.startsWith("gid://shopify/")) {
                        imageIds.push(id);
                    }
                });
            });
        });

        const imageMap = await getImageUrls(admin, [...new Set(imageIds)]);
        const normalizedBookings = bookings.map((booking) => normalizeBookingImages(booking, imageMap));

        return new Response(JSON.stringify({
            success: true,
            data: normalizedBookings,
            total,
            page,
            limit
        }), { status: 200 });
    } catch (error) {
        console.log("error occured on api/admin/bookings.js", error)
        return new Response(JSON.stringify({
            success: false,
            message: error
        }), { status: 500 });
    }
};
