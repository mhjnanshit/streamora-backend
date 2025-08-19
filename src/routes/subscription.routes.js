import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    subscribeChannel,
    unsubscribeChannel,
    getSubscribedChannels,
    getUserChannelSubscribers
} from "../controllers/subscription.controller.js"


const router = new Router()

router.route("/:channelId").post(verifyJWT,subscribeChannel)

router.route("/:channelId").delete(verifyJWT,unsubscribeChannel)

router.route("/:channelId/subscribers").get(verifyJWT,getUserChannelSubscribers)

router.route("/:subscriberId/subscriptions").get(verifyJWT,getSubscribedChannels)

export default router;


