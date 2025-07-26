import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/fileupload.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req,res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: email or username
    // check for images, check for avatar (compulsory ones)
    // upload them on cloudinary
    // create user object - create entry in db
    // remove password and refresh token field from response 
    // check for user creation response , return it

    const {fullName, email, username, password} = req.body
    //console.log("email: ", email)

    // if(fullName == ""){
    //     throw new ApiError(400, "fullname is required")
    // }

    // better way to validate all fields

    if(
        [fullname, email, username, password].some((field)=> field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existeduser = User.findOne({
        $or: [{username},{email}]
    }) // Return if any given username OR email already exists in the db

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path      // We get the file path uploaded By Multer
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    // Now , we can upload to the cloudinary

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

    // MongoDB add an _id with its every entry
    // To check if the db has made an entry of user or not
    // Also, In response we have to remove password and refreshToken , chain with .select method , select those which are not required ( Weird Syntax too!!)

    const UserCreatedorNot = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!UserCreatedorNot){
        throw new ApiError(500, "Error in Registering the user")
    }

    // Now , user is creater and now send the response

    return res.status(201).json(
        new ApiResponse(200, UserCreatedorNot, "User Registered Successfully!!!")
    )

} )


export {registerUser}