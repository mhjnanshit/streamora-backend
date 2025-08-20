import { Router } from "express";
import {
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    getPlaylistById,
} from '../controllers/playlist.controller.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = new Router()

router.route("/").post(verifyJWT,createPlaylist)

router.route("/:playlistId").patch(verifyJWT,updatePlaylist)

router.route("/:playlistId").delete(verifyJWT,deletePlaylist)

router.route("/:playlistId").get(verifyJWT,getPlaylistById)

router.route("/add/:playlistId/:videoId").patch(verifyJWT,addVideoToPlaylist)

router.route("/remove/:playlistId/:videoId").patch(verifyJWT,removeVideoFromPlaylist)

export default router
