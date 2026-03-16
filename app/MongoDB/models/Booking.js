import mongoose from "mongoose";

const bookingSchema = mongoose.Schema({
    customerID: { type: String, required: false },
    guestInfo: {
        name: String,
        email: String,
        phone: String
    },
    handoffMethod: String,
    status: {
        type: String,
        enum: [
            'Received',
            'Under Inspection',
            'In Cleaning',
            'Awaiting Customer Approval',
            'Cleaning Complete',
            'Ready for Pickup / Shipment',
            'Completed',
            'Canceled'
        ],
        default: 'Received'
    },
    sneakers: [mongoose.Schema.Types.Mixed],
    fullPayload: mongoose.Schema.Types.Mixed,
    submittedAt: { type: Date, default: Date.now }
});

const BookingModel = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

export default BookingModel;
