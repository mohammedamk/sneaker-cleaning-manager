import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";

// fetching images

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
    } catch (err) {
        console.error("Error fetching image URLs:", err);
        return {};
    }
}



export const action = async ({ request }) => {
    try {
        const { admin } = await authenticate.public.appProxy(request);

        const body = await request.json();

        console.log("body get bookings", body);

        const customerID = body.customerID;
        const page = parseInt(body.page || "1");
        const limit = parseInt(body.limit || "10");

        if (!customerID) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Customer ID is required",
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const skip = (page - 1) * limit;

        const idsToSearch = [];
        if (!String(customerID).startsWith("gid://")) {
            idsToSearch.push(`gid://shopify/Customer/${customerID}`);
        }
        const query = { customerID: { $in: idsToSearch } };

        const [bookings, total] = await Promise.all([
            BookingModel.find(query)
                .sort({ submittedAt: -1 })
                .skip(skip)
                .limit(limit),

            BookingModel.countDocuments(query),
        ]);

        // collecting all image ids

        const allImageIds = [];

        bookings.forEach((booking) => {
            if (Array.isArray(booking.sneakers)) {
                booking.sneakers.forEach((snk) => {
                    if (Array.isArray(snk.images)) {
                        snk.images.forEach((id) => {
                            if (
                                typeof id === "string" &&
                                id.startsWith("gid://shopify/")
                            ) {
                                allImageIds.push(id);
                            }
                        });
                    }
                });
            }
        });

        const uniqueIds = [...new Set(allImageIds)];

        // fetching images urls

        const imageMap = await getImageUrls(admin, uniqueIds);

        // mapping ids to urls

        const bookingsWithUrls = bookings.map((booking) => {
            const updatedSneakers = (booking.sneakers || []).map((snk) => {
                const updatedImages = (snk.images || []).map((id) => {
                    if (typeof id === "string" && id.startsWith("http")) {
                        return id; // fallingback for old data
                    }

                    if (typeof id === "string" && id.startsWith("gid://shopify/")) {
                        return imageMap[id] || null;
                    }

                    return null;
                });

                return {
                    ...snk,
                    images: updatedImages.filter(Boolean),
                };
            });

            return {
                ...booking.toObject(),
                sneakers: updatedSneakers,
            };
        });


        return new Response(
            JSON.stringify({
                success: true,
                bookings: bookingsWithUrls,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page * limit < total,
                    hasPrevPage: page > 1,
                },
            }),
            {
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Error in api.get.bookings:", error);

        return new Response(
            JSON.stringify({
                success: false,
                message: error.message,
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
};