import mongoose from "mongoose";

const bookingSchema = mongoose.Schema({
    customerID: { type: String, required: false },
    name: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    guestInfo: {
        name: String,
        email: String,
        phone: String
    },
    handoffMethod: String,
    status: {
        type: String,
        enum: [
            'Pending',
            'Received',
            'Under Inspection',
            'In Cleaning',
            'Awaiting Customer Approval',
            'Cleaning Complete',
            'Ready for Pickup / Shipment',
            'Completed',
            'Canceled'
        ],
        default: 'Pending'
    },
    sneakers: [mongoose.Schema.Types.Mixed],
    shipping: mongoose.Schema.Types.Mixed,
    fullPayload: mongoose.Schema.Types.Mixed,
    shopifyOrderID: { type: String, required: false },
    accessTokenHash: { type: String, default: null },
    secureAccessUrl: { type: String, default: null },
    qrCodeImageUrl: { type: String, default: null },
    refund: {
        status: { type: String, enum: ['pending', 'completed', 'failed'], default: null },
        amount: { type: Number, default: null },
        currencyCode: { type: String, default: null },
        refundId: { type: String, default: null },
        processedAt: { type: Date, default: null }
    },
    lastCleaning: { type: Date, default: null },
    submittedAt: { type: Date, default: Date.now }
});

bookingSchema.index({ shopifyOrderID: 1 }, { unique: true, sparse: true });

const BookingModel = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

export default BookingModel;
