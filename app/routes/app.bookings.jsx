import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";
import BookingsIndex from "../component/bookings/BookingsIndex";
import bookingsStyles from "../component/bookings/bookings.css?url";

export const links = () => [
  { rel: "stylesheet", href: bookingsStyles },
];

export const action = async ({ request }) => {
    await authenticate.admin(request);
    const formData = await request.formData();
    const actionType = formData.get("actionType");
    try {
        if (actionType === "UPDATE_STATUS") {
            const id = formData.get("id");
            const status = formData.get("status");

            await BookingModel.findByIdAndUpdate(id, { status }, { new: true });

            return { success: true, message: "Status updated successfully" };
        }
        if (actionType === "DELETE") {
            const id = formData.get("id");
            await BookingModel.findByIdAndDelete(id);
            return { success: true, message: "Booking deleted successfully" };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: "Invalid action" };
};

export default function BookingsRoute() {
    return <BookingsIndex />;
}