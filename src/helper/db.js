import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const connectDB = async () => {
    try {
        await mongoose.connect(
            process.env.DATABASE_URL,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        )
        console.log("Connected to MongoDB...");
        return true;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        return false
    }
};

export default connectDB;
