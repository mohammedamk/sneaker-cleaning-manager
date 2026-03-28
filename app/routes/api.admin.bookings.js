import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";

export const action = async ({ request }) => {
    try {
        await authenticate.admin(request);
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

        return new Response(JSON.stringify({
            success: true,
            data: JSON.parse(JSON.stringify(bookings)),
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
