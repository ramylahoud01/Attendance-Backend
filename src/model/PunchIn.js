import mongoose from "mongoose";
const Schema = mongoose.Schema

const PunchInSchema = new Schema({
    AttendanceID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendance',
    },
    StartingDate: {
        type: Date,
        required: true
    }
}, { timestamps: true });

export default mongoose.model('PunchIn', PunchInSchema)