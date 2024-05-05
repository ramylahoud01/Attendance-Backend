import mongoose from "mongoose";
const Schema = mongoose.Schema
import timeZone from "mongoose-timezone"
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const getTimezone = () => process.env.TZ || "UTC";

const PunchOutSchema = new Schema({
    ScheduleID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Schedule',
    },
    EndDate: {
        type: Date,
        required: true,
        timezone: getTimezone
    }
}, { timestamps: true });

PunchOutSchema.plugin(timeZone);
export default mongoose.model('PunchOut', PunchOutSchema)