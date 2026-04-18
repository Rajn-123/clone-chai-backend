import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import cookieParser from "cookie-parser"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()

        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}


const registerUser = asyncHandler( async (req, res) => {

    // 1. req.body se data lenge
    // 1.(a) thoda validation bhi kar lenge - not empty
    // 2. and db me se find karenge user ko on the basis of email and username
    // 2.(a) check for images, check for avatar
    // 2.(b) upload them to Cloudinary, avatar
    // 2.(c) Cloudinary response me url bhejega us url ko kisi variable me hold kr us url ko db me save karenge
    // 3. agar existing user mil jata h db me to return response ki aap direct login karo ya user with this email is already exist
    // 4. yadi nahi h existing user to user model me ye sabhi data fill karenge and password ko hash karenge, fill karne ke liye user obj banayenge and db.create se save kr denge
    // 5. return response user registered successfull 
    // 5.(a) but remember to remove password and refresh Token while sending response to frontend.
    
    const {username, fullname, email, password } = req.body
    console.log("Email", email);

    // if(fullname === ""){
    //     throw new ApiError(400, "Fullname is required")
    // }
    if(
        [fullname,email,username,password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    console.log(existedUser);
    
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }
    console.log(req.files);
    
    const avatarLocalPath = req.files?.avatar[0]?.path
    // HW console.log(req.files)
    // const coverImageLocalPath = req.files?.coverImage[0]?.path 

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname, 
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )


})

const loginUser = asyncHandler( async (req,res) => {
    // TODO
    // 1. Get user data from req.body
    // 2. Validate the data field that field data is missing or not
    // 3. Check in db that this filed i.e. email is present in db or not
    // 4. If no user with this email is exists in db return response that no email found or first register yourself 
    // 5. If user found with email in db then check for password 
    // 5.(a) If password is incorrect return response that password is not correct please enter valid password 
    // 5.(b) If password is correct then generate accessTokeen and refreshToken
    // 6. Save refreshToken in db
    // 7. Return res that logIn successfull and send accessTokeen and refreshToken in cookies
    const {email, username, password } = req.body

    if(!username || !email){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User doesn't exists")
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                user: loggedInUser, 
                accessToken,
                refreshToken
                },
                "User logged in successfully"
            )
        )
})

const logoutUser = asyncHandler( async (req, res) => {
    // TODO
    // 1. Find User in db and clear their refreshToken but how to find user like which basis (email, username, userId) but we can't say user to fill email or username or userId to logOut yourself but there is a catch that is when user press logOut button on frontend we can catch thier accessTokeen or refreshToken and based on that we can extract userId from these token and then we can find user in db.

    await User.findByIdAndUpdate(
        req.user._id, 
        {
        $set: {
            refreshToken: undefined
            },
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(
                new ApiResponse(200, {}, "User logged out successfully")
            )

})

export { registerUser, loginUser, logoutUser }

