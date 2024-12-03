import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js"
import uploadOnCloudinary from "../utils/cloudinary.js";
import { User } from "../models/user.model.js"; // Ensure you import the User model
import jwt from "jsonwebtoken"

// This function handles user registration
// Steps:
// 1. Get user details from frontend
// 2. Validate the input fields
// 3. Check if the user already exists
// 4. Check for images and validate avatar
// 5. Upload images to Cloudinary
// 6. Create a user object and save it to the database
// 7. Remove sensitive fields from the response
// 8. Send the response back to the user


const generateAcessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken =  user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false });
        
        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
}
const registerUser = asyncHandler(async (req, res) => {
    // 1. Get user details from frontend
    const { username, fullname, email, password } = req.body;
    console.log("email", email);

    // 2. Validate the input fields
    if ([fullname, email, username, password].some(field => !field)) {
        throw new ApiError(400, "All fields are required");
    }

    // 3. Check if the user already exists
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existingUser) {
        throw new ApiError(400, "User already exists with this username or email");
    }

    // 4. Check for images and validate avatar
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    console.log("avatarLocalPath", avatarLocalPath);
    console.log("coverImageLocalPath", coverImageLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    // 5. Upload images to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : { url: "" };

    console.log("avatar", avatar);
    console.log("coverImage", coverImage);

    // 6. Create a user object and save it to the database
    const newUser = await new User({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage.url,
        email,
        password,
        username: username.toLowerCase()
    }).save();


    console.log("newUser", newUser);

    // 7. Remove sensitive fields from the response
    const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

    // 8. Send the response back to the user
    return res.status(201).json({ createdUser });
});

const loginUser = asyncHandler(async (req, res) => {
    // req body se data leke au
    // username or email
    // find the user
    // password check 
    // access and refresh token generation
    // send cookies 
    
    const { email, username, password } = req.body;
    if (!username || !email) {
        throw new ApiError(400, "username or email is required");
    }

    const data = await User.findOne({
        $or : [{username}, {email}]
    }) 
    
    if (!data) {
        throw new ApiError(404,"user does not exist")
    }

    const isPasswordValid = await data.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Inavlid credentials");
    }

    const { accessToken, refreshToken } = await generateAcessAndRefreshToken(data._id);

    // aab ham token usko ccokies ke  form me denge 
    const options = {
        httpOnly: true,
        secure:true
    }
    // see ye above options se hoga kya ki by default apki cookies koi bhi
    // modify kar sakta he frontend me so jaab ham httpOnly and secure ko true kar dete he
    // to iska matlab ye he ki ye sirf sever se hi modify hongi

    return res.status(200).cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {
            user: loginUser, accessToken,
            refreshToken
        }, 'Usser loged in auccessfully'))


});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken:undefined
            }
        },
        {
            new : true // return me apko jo response milega usme upko new updated value mil jaygi
        }
    )
    const options = {
        httpOnly: true,
        secure:true
    }

    return res.status(200).clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{} ,"User logged out "))
    
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unathorized request")
    }

   try {
     const decodedToken = jwt.verify(incomingRefreshToken, process.env.ACCESS_TOKEN_SECRET)
     
     const user = await User.findById(decodedToken?._id)
     if (!user) {
         throw new ApiError(401, "Inavlid refresh token")
     }
 
     if (incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401, " request token is expire or used")
     }
 
     const option = {
         httpOnly: true,
         secure:true
     }
 
     const {accessToken,newrefreshToken }  = await generateAcessAndRefreshToken(user._id)
 
     return res.status(200).cookie("accessToken", accessToken, option)
         .cookie("refreshToken", newrefreshToken, option)
         .json(
         new ApiResponse(200,{accessToken,newrefreshToken})
     )
   } catch (error) {
      throw new ApiError(401, error?.message || "invalid refresh token ")
   }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    
    if (!isPasswordCorrect) {
        throw new ApiError(400,"Invalidpassword")
    }

    user.password = password
    await user.save({ validateBeforeSave: false })
    
    return res.status(200).json(new ApiResponse(200,{},"password change successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(200,req.user,"Cuurent user fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body
    
    if (!fullname || !email) {
        throw new ApiError(400,"All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { fullname, email }
        }, { new: true }
    ).select("-password")

    return res.status(200).json(new ApiResponse(200, user,"Account detail updated successfully"),)


})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    
    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatart file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400,"Error while updating it ")
    }

    const user = await User.findById(
        req.user?._id,
        {$set:{avatar:avatar.url}}, { new: true }
    ).select("password")

    return res.status(200).json(new ApiResponse(200,user,"Avatar image updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    
    if (!coverImageLocalPath) {
        throw new ApiError(400,"Cover file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400,"Error while updating it ")
    }

    const user = await User.findById(
        req.user?._id,
        {$set:{coverImage:coverImage.url}}, { new: true }
    ).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"Cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username:username?.toLowerCase()
            },
        
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as:"subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount :{
                    $size : "$subscribers" // ye size basically hame count deta he 
                },
                channelSubscribedToCount: {
                    $size : "subscribedTo"
                },
                isSubscribed: {
                    $condition: {
                        // condition me apke 2 paramters hote he ek to
                        // if jaha aap condition likhte ho then and else if true he to then 
                        // and if galat he to false
                        if: {
                        
                            $in: [req.user?._id, "subscribers.subscriber"],
                            then: true,
                            else: false
                        }
                    }
                }
            }
        },
// aab ham use karege project like me sari chizein usko nai dunga like me usko selected chizein dunga
    {
        $project: {
            fullname:1,
            username: 1,
            subscribersCount: 1,
            channelSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email:1
        }
    },
    ])

if (!channel?.length) {
        throw new ApiError(404,"channel does not exist")
}
    
return res.status(200).json(new ApiResponse(200,channel[0],"user channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})


export { registerUser,loginUser,logoutUser,refreshAccessToken, changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage };