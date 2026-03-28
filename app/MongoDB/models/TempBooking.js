import mongoose from "mongoose";

const tempBookingSchema = mongoose.Schema({
    payload: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now, expires: 86400 }
});

const TempBookingModel = mongoose.models.TempBooking || mongoose.model("TempBooking", tempBookingSchema);

export default TempBookingModel;
