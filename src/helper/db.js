import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const connectDB = async () => {
    try {
        console.log(process.env.MONGODB_URI)
        const conncected = await mongoose.connect(process.env.MONGODB_URI,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        )
        if (conncected) {
            console.log("Connected to MongoDB...");
            return true;
        } else {
            console.log("Not Connected to MongoDB...");
        }
        return true;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
};

export default connectDB;
