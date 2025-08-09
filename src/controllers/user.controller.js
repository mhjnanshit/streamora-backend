import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileupload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: email or username
  // check for images, check for avatar (compulsory ones)
  // upload them on cloudinary
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation response , return it

  const { fullname, email, username, password } = req.body;
  //console.log("email: ", email)

  // if(fullName == ""){
  //     throw new ApiError(400, "fullname is required")
  // }

  // better way to validate all fields

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  }); // Return if any given username OR email already exists in the db

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path; // We get the file path uploaded By Multer
  // const coverImageLocalPath = req.files?.coverImage[0]?.path (Would give error)

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // What if we dont send any coverImage to the db , as it is an optional field , To handle that

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // This is due to basically JS issue , since the earlier method also correctly checks if coverImage is there or not but it returns undefined which is also treated as a value
  // Here initially , the value is initially null and defined only when it passes all the checks!

  // Now , we can upload to the cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // MongoDB add an _id with its every entry
  // To check if the db has made an entry of user or not
  // Also, In response we have to remove password and refreshToken , chain with .select method , select those which are not required ( Weird Syntax too!!)

  const UserCreatedorNot = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!UserCreatedorNot) {
    throw new ApiError(500, "Error in Registering the user");
  }

  // Now , user is created and now send the response

  return res
    .status(201)
    .json(
      new ApiResponse(200, UserCreatedorNot, "User Registered Successfully!!!")
    );
});

const loginUser = asyncHandler(async (req, res) => {
  // fetch data from req body
  // username or email
  // find the user
  // password check
  // Generate access and refresh token
  // send these tokens in cookie

  const { email, username, password } = req.body; // Either credentials can be given

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    // Returns the first entry found in database
    $or: [{ username }, { email }], // Either matching username or email is found in the database
  });

  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password); // To validate the password , the password stored in databse will be accessed by this.password (encrypted by bcrypt)

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is Incorrect!");
  }

  // Now , we will generate tokens
  // We are gonna do this frequently , better make it a method
  const generateAccessAndRefreshTokens = async (user) => {
    try {
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new ApiError(
        500,
        "Something went wrong in generating access and refresh token"
      );
    }
  };

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user);

  //    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")  --> Less Efficient (DB Call)

  const userToSend = user.toObject();
  delete userToSend.password; // Making it an object as user is already up to date here itself , no need for a db call
  delete userToSend.refreshToken;

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: userToSend,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out!"));
});
// User loggedIn hai ya nhi iska use hume aur bhi jagah pdega that is why we made a middleware out of this.

const renewTokens = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  // We recieved an encrypted token

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedToken?._id);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (decodedToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or used");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  const { accessToken, newRefreshToken } =
    await generateAccessAndRefreshTokens(user);
  // We are also renewing the Refresh Token

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: newRefreshToken },
        "Access Token refreshed"
      )
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isOldPasswordCorrect) {
    throw new ApiError(400, "Incorrect Old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "Current User fetched Successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "Enter the required fields");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details Updated Successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage Updated Successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    // We get array as a result
    {
        $match: {
          username: username?.toLowerCase()
        }
    },
    {
        // Number of subscribers
        $lookup: {
          from: "subscriptions",   // MongoDB saves Subscription -> subscriptions
          localField: "_id",
          foreignField: "channel", // woh users jin ne user ke channel ko subscribe kiya hai
          as: "subscribers"
        }

        // Imagine like this , when a user subscribers a channel (user) , db mein uske channel field ke aage voh channel wala user aa jayega
        // And channel wale user ke subscriber field mein ye wala user aa jayega jisne subscribe kiya hai
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",  // Ek user kin kin ka subscriber hai
        as: "subscribedTo"
      }
    },
    {
        $addFields: {
          subscriberCount: {
            $size: "$subscribers"
          },
          subscribedTo: {
            $size: "$subscribedTo"
          },
          isSubscribedOrNot: {
            $cond:{
              if: {$in: [req.user?._id, "$subscribers.subscriber"]},
              then: true,
              else: false
            }
          }
        }
    },
    {
        $project: {
          fullname: 1,
          username: 1,
          subscriberCount: 1,
          subscribedTo: 1,
          isSubscribedOrNot: 1,
          avatar: 1,
          coverImage: 1,
          email: 1
        }
    }
  ]);

  if(!channel?.length){
    throw new ApiError(400,"Channel does not exist")
  }

  return res.status(200)
  .json(
    new ApiResponse(200, channel[0], "User channel fetched!!")
  )
    // Channel[0] beacuse channel is the array of objects , we are picking up the object and returning it
});

export {
  registerUser,
  loginUser,
  logoutUser,
  renewTokens,
  changeCurrentPassword,
  updateAccountDetails,
  getCurrentUser,
  updateAvatar,
  updateCoverImage,
};
