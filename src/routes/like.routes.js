import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleCommentLike,
    toggleVideoLike,
    getLikedVideos
} from "../controllers/like.controller.js"


const router = new Router()

router.route("/").get(verifyJWT,getLikedVideos)
router.route("/videos/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/comments/:videoId").post(verifyJWT, toggleCommentLike);

export default router