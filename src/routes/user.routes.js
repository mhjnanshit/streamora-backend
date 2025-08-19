import { Router } from "express";
import { registerUser,loginUser,logoutUser, renewTokens, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import errorHandler from "../middlewares/error.middleware.js";


const router = Router()

router.route("/auth/register").post(
  // I will handle only POST requests with /register
  upload.fields([    // db mein upload hone se just pehle hum yeh middleware call krenge (jaate jaate humse milke jana logic) which will upload media to Multer
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
  ]),
  registerUser
); 

router.route("/auth/login").post(loginUser);

// Secure Routes

router.route("/auth/logout").post(verifyJWT, logoutUser);

router.route("/auth/renew-token").post(renewTokens);

router.route("/users/me/password").post(verifyJWT, changeCurrentPassword);

router.route("/users/me").get(verifyJWT, getCurrentUser);

router.route("/users/me").patch(verifyJWT, updateAccountDetails);  // Updating details is a patch request

router.route("/users/me/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);

router.route("/users/me/coverImage").patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

router.route("/users/:username").get(verifyJWT, getUserChannelProfile);

router.route("/users/me/history").get(verifyJWT, getWatchHistory);



export default router