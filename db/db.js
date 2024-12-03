import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB host : ${connection.connection.host}`) // this is like hame pata rehta he ki ham konse host me connected he 
    } catch (error) {
        console.log("mongodb connection error", error)
        process.exit(1) // ye he nodejs jo he na ek process pe chalta he to jab error aye to uss process ko aap exit kardo to ham 1 se exit kar rahe he or methods bhi he dekhlo
    }
}

export default connectDB;