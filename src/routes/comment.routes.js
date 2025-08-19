import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments
} from "../controllers/comment.controller.js"

const router = new Router()

router.route("/:videoId").post(verifyJWT,addComment)
router.route("/:commentId").patch(verifyJWT,updateComment)
router.route("/:commentId").delete(verifyJWT,deleteComment)
router.route("/:videoId").get(verifyJWT,getVideoComments)

export default router