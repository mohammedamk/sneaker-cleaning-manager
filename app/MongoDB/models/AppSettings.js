import mongoose from "mongoose";

const appSettingsSchema = mongoose.Schema({
    key: { type: String, required: true, unique: true },
    returnShippingBufferPercentage: { type: Number, default: 0 },
});

const AppSettingsModel = mongoose.models.AppSettings || mongoose.model("AppSettings", appSettingsSchema);

export default AppSettingsModel;
