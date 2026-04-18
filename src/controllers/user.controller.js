import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { upoladOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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

    const avatarLocalPath = req.files?.avatar[0]?.path
    // HW console.log(req.files)
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await upoladOnCloudinary(avatarLocalPath)
    const coverImage = await upoladOnCloudinary(coverImageLocalPath)

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

export { registerUser }

