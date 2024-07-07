import mongoose from "mongoose";
const Schema = mongoose.Schema

const faceSchema = new Schema({
    EmployeeID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
    },
    descriptor: { type: [Number], required: true },
}, { timestamps: true });

export default mongoose.model('Face', faceSchema)