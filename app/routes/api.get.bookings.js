import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";
import {
    collectBookingImageIds,
    getImageUrls,
    normalizeBookingImages,
} from "../utils/shopifyImages.server";

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

        const uniqueIds = [...new Set(bookings.flatMap((booking) => collectBookingImageIds(booking)))];

        // fetching images urls

        const imageMap = await getImageUrls(admin, uniqueIds);

        // mapping ids to urls

        const bookingsWithUrls = bookings.map((booking) => normalizeBookingImages(booking, imageMap));


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
