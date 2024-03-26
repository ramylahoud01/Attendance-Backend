import mongoose from "mongoose";
const Schema = mongoose.Schema

const ScheduleSchema = new Schema({
    EmployeeID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    AttendanceID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendance'
    },
    FromToHours: {
        type: String,
        required: true
    },
    Date: {
        type: Date,
        required: true
    }
}, { timestamps: true });

export default mongoose.model('Schedule', ScheduleSchema)