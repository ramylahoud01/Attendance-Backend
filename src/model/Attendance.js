import mongoose from "mongoose";
const Schema = mongoose.Schema

const AttendanceSchema = new Schema({
    PunchInID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PunchIn',
    },
    PunchOutID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PunchOut',
    },
    BreakInID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BreakIn',
    },
    BreakOutID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BreakOut',
    },
    EmployeeID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
    },
    ScheduleID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Schedule',
    },
    Date: {
        type: Date,
    }
}, { timestamps: true });

export default mongoose.model('Attendance', AttendanceSchema)