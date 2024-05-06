import mongoose from "mongoose";
import timeZone from "mongoose-timezone";
const Schema = mongoose.Schema
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const getTimezone = () => process.env.tz || "UTC";

const BreakOutSchema = new Schema({
    AttendanceID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendance',
    },
    EndDate: {
        type: Date,
        required: true,
        timezone: getTimezone
    }
}, { timestamps: true });

BreakOutSchema.plugin(timeZone);
export default mongoose.model('BreakOut', BreakOutSchema)