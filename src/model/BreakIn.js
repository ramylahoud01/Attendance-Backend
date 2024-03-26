import mongoose from "mongoose";
const Schema = mongoose.Schema

const BreakInSchema = new Schema({
    AttendanceID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendance',
    },
    StartDate: {
        type: Date,
        required: true
    }
}, { timestamps: true });

export default mongoose.model('BreakIn', BreakInSchema)