import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/register").post(
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


export default router