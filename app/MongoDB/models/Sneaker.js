import mongoose from "mongoose";

const sneakerSchema = mongoose.Schema({
    customerID: { type: String, required: true },
    bookingID: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    nickname: String,
    brand: String,
    model: String,
    colorway: String,
    size: String,
    sizeUnit: String,
    history: {
        professionallyCleaned: String,
        alterations: [String]
    },
    notes: String,
    services: mongoose.Schema.Types.Mixed,
    images: [String],
    cleanedImages: [String],
    cleanedImageProcessing: { type: Boolean, default: false },
    cleanedImagesApprovalStatus: {
        type: String,
        enum: ['approved', 'rejected'],
        default: null
    },
    cleanedImagesApprovalNote: {
        type: String,
        default: null,
        trim: true
    },
    status: {
        type: String,
        enum: [
            'Pending',
            'In Cleaning',
            'Cleaning Complete'
        ],
        default: 'Pending'
    },
    submittedAt: { type: Date, default: Date.now }
});

const SneakerModel = mongoose.models.Sneaker || mongoose.model("Sneaker", sneakerSchema);

export default SneakerModel;
