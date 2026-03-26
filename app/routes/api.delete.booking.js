import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";
import SneakerModel from "../MongoDB/models/Sneaker";

export const action = async ({ request }) => {
    try {
        const { admin } = await authenticate.public.appProxy(request);
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return new Response(
                JSON.stringify({ success: false, message: "Booking ID is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const booking = await BookingModel.findById(id);
        if (!booking) {
            return new Response(
                JSON.stringify({ success: false, message: "Booking not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // optionally removing bookingID from associated sneakers
        await SneakerModel.updateMany({ bookingID: id }, { $unset: { bookingID: "" } });

        await BookingModel.findByIdAndDelete(id);

        return new Response(
            JSON.stringify({ success: true, message: "Booking deleted successfully" }),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error in api.delete.booking:", error);
        return new Response(
            JSON.stringify({ success: false, message: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
