// require("dotenv").config() // this will run perfectly
// // but there is one problem here like this is not following the code structure
// // like here it is require and down it is import stuff

import dotenv from "dotenv";
dotenv.config(); // Load environment variables

import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import express from "express";
import connectDB from "./db/db.js";
import app from "./app.js"; // Import the app from app.js

// Connect to the database and start the server
connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server running on port: ${process.env.PORT || 8000}`);
        });
    })
    .catch((err) => {
        console.log('Mongodb connection failed', err);
    });

// approach 1 
// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
//         app.on("error", () => {
//             console.log("error", error);
//             throw error;
//         });
//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on port ${process.env.PORT}`);
//         });
//     } catch (error) {
//         console.log("error", error);
//         throw error;
//     }
// })();