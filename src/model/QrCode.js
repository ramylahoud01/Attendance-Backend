import mongoose from "mongoose";
const Schema = mongoose.Schema

const QrCodeSchema = new Schema({
    Content: {
        type: String,
        required: true
    },
}, { timestamps: true });

export default mongoose.model('QrCode', QrCodeSchema)