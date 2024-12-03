import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser"; // kabhi hamko cookie mese bhi data lena hoga to thats why we have used it

const app = express();

app.use(cors({
    // ye jo use method he vo sare ke sare middlewares or baki saab ko configure karne me use me ata he 
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // if ye extended na likhe to bhi chalega its ye jo
// he url encoded vo ham use isliye kar rahe jaab aap url se data lehge uske liye use kar rahe ham 

app.use(express.static("public")); // ye static kuch nai karta like kahi baar hami files , pdf vo saab ai , images ai vo saab me mere hi server me store karna chahta hu to ek public assests he like koi bhi aye usko access kar sakta he
// ye public isliye kyuki hamne public folder banay he

// now about cookies parser
// now iska kam sirf itna sa he ki me mere server se user ka jo browser he na uske andar ki cookies
// ko access kar pau or uske andar ki cookies ko set bhi kar pau to means uski cookies me basically me crud operation perform kar pau

app.use(cookieParser());

import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter);

export default app;