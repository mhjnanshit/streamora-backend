import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
    deleteVideo,
    getVideoById,
    updateVideo,
    publishAVideo,
    togglePublishStatus
} from "../controllers/video.controller.js"


const router = Router()

router.route("/videos").post(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);

router.route("/videos/:videoId").get(verifyJWT, getVideoById);

router.route("/videos/:videoId").delete(verifyJWT, deleteVideo);

router.route("/videos/:videoId").patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/videos/:videoId/togglePublish").patch(verifyJWT, togglePublishStatus);

export default router;
