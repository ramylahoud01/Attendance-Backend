import mongoose from "mongoose";
const Schema = mongoose.Schema
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });


const ScheduleSchema = new Schema({
    EmployeeID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    FromDate: {
        type: Date,
        // required: true,
    },
    ToDate: {
        type: Date,
        // required: true,
    },
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
    PunchStatus: {
        type: String,
        enum: ['late', 'LeavingEarly', 'onTime', 'lateAndLeavingEarly', 'OFF'],
        default: 'onTime'
    }
}, { timestamps: true });


export default mongoose.model('Schedule', ScheduleSchema)