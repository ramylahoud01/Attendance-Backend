import mongoose from "mongoose";
import timeZone from "mongoose-timezone"
const Schema = mongoose.Schema
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const getTimezone = () => process.env.tz || "UTC";


const PunchInSchema = new Schema({
    ScheduleID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Schedule',
    },
    StartingDate: {
        type: Date,
        required: true,
        timezone: getTimezone
    }
}, { timestamps: true });

PunchInSchema.plugin(timeZone);
export default mongoose.model('PunchIn', PunchInSchema)