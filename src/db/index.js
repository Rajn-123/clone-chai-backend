import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import "dotenv/config"

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log(`\n MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}/${DB_NAME}`);
        console.log(connectionInstance); // HW Read about this connectionInstance in details that when DB connect it returns an object so I have to read about that object.
        
    } catch (error) {
        console.log("MONGODB Connection Error", error);
        process.exit(1)
        
    }
}

export default connectDB;