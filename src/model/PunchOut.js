import mongoose from "mongoose";
const Schema = mongoose.Schema

const PunchOutSchema = new Schema({
    AttendanceID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendance',
    },
    EndDate: {
        type: Date,
        required: true
    }
}, { timestamps: true });

export default mongoose.model('PunchOut', PunchOutSchema)