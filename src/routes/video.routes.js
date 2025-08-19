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

router.route("/").post(
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

router.route("/:videoId").get(verifyJWT, getVideoById);

router.route("/:videoId").delete(verifyJWT, deleteVideo);

router.route("/:videoId").patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/:videoId/publish").patch(verifyJWT, togglePublishStatus);

export default router;
