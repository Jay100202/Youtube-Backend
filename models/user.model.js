import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index:true // ye zyada searching ke liye use hota he 
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index:true // ye zyada searching ke liye use hota he 
        },
        avatar: {
            type: String, // cloudinary url 
            required:true  
        },
        coverImage: {
            type: String,
            
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password: {
            type: String,
            required:[true,"password is required"]
        },
        refreshToken: {
            type:String
        }

    },
    { timestamps: true }
)

// ye pre hook kya karta he basicall yjab bhi aap apne code me data ko save karoge usase just pehle ye run hoga 

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next()
    }
    this.password = await bcrypt.hash(this.password, 10);
    next()
})

UserSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

// jwt kya he kjwt jo he vo hamar bearer token he like jo mujhe ye token bhejega me usko vo data de dunga
UserSchema.methods.generateAccessToken =  function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname:this.fullname
    },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOEKN_EXPIRY }
    )
}

UserSchema.methods.generateRefreshToken = async function () {
    return jwt.sign({
        _id: this._id,
        
    },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )
}

// module.exports = mongoose.model("User",UserSchema)
export const User = mongoose.model("User", UserSchema)


// NOW why we have takenm two token like refresh token and access token
// so access token short lived he jaldi expire hojaygu and refresh  token lon lived he time lagega usko expire hone me

// means maanlo hamne user ko access token expire kar diya 10 min me to usko vapis login karna padega
// this means usko vapis password dalna padega , to ham usko ye bolege ki if apke paas
// refreshtoken he to aapko me ek end point dunga if apka refresh token or database ka refresh token match karega to apko me naya access token dunga