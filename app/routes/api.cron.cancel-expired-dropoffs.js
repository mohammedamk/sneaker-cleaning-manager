import BookingModel from "../MongoDB/models/Booking";
import SneakerModel from "../MongoDB/models/Sneaker";

/**
 * cron API to cancel expired drop-off bookings.
 * frequency: Every hour.
 */
export const loader = async ({ request }) => {

    try {
        // 48 hours window as per policy
        const EXPIRATION_HOURS = 48;
        const now = new Date();
        const expirationDate = new Date(now.getTime() - EXPIRATION_HOURS * 60 * 60 * 1000);

        const expiredBookings = await BookingModel.find({
            status: "Pending",
            handoffMethod: "dropoff",
            submittedAt: { $lt: expirationDate }
        });

        if (expiredBookings.length === 0) {
            return json({
                success: true,
                message: "No expired drop-off bookings found."
            });
        }

        const expiredIds = expiredBookings.map(b => b._id);

        const bookingUpdate = await BookingModel.updateMany(
            { _id: { $in: expiredIds } },
            { $set: { status: "Canceled" } }
        );
        const sneakerUpdate = await SneakerModel.updateMany(
            { bookingID: { $in: expiredIds } },
            { $set: { status: "Canceled" } }
        );

        console.log(`[Cron] Canceled ${expiredIds.length} bookings due to drop-off window expiration.`);

        return new Response(JSON.stringify({
            success: true,
            message: `Successfully canceled ${expiredIds.length} expired drop-off bookings.`,
            details: {
                bookingsModified: bookingUpdate.modifiedCount,
                sneakersModified: sneakerUpdate.modifiedCount
            }
        }), { status: 200 });

    } catch (error) {
        console.error("[Cron Error] of cancel expired dropoffs", error);
        return new Response(JSON.stringify({
            success: false,
            message: "Error occurred during cron job execution",
            error: error.message
        }), { status: 500 });
    }
};
