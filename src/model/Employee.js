import mongoose from "mongoose";
const Schema = mongoose.Schema

const EmployeeSchema = new Schema({
    FirstName: {
        type: String,
        required: true
    },
    LastName: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    Password: {
        type: String,
    },
    JobTitle: {
        type: String,
        required: true
    },
    Role: {
        type: String,
        enum: ["Admin", "Manager", "Staff"],
        default: "Staff",
        required: true,
    },
    SalaryHourly: {
        type: Number,
        required: true
    },
    HoursPerWeek: {
        type: Number,
        required: true
    },
    QRCodeID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QrCode'
    },
}, { timestamps: true });

export default mongoose.model('Employee', EmployeeSchema);
