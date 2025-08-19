import mongoose, { isValidObjectId } from "mongoose";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js";


// const toggleSubscription = asyncHandler(async (req,res) => {
//     const {channelId} = req.params
//     // Check whether subscribed or not
//     if(!isValidObjectId(channelId)){
//       throw new ApiError(400, "The channel does not exist!")
//     }

//     const isSubscribed = await Subscription.findOne({
//       subscriber: req.user?._id,
//       channel: channelId,
//     })

//     if(isSubscribed){
//       await Subscription.findByIdAndDelete(isSubscribed?._id)

//       return res.status(200)
//       .json(
//         new ApiResponse(200, {subscribed: false}, "Unsubscribed Successfully!")
//       )
//     }

//     await Subscription.create({
//       subscriber: req.user?._id,
//       channel: channelId,
//     })

//     return res.status(200)
//     .json(
//       new ApiResponse(200, {subscriber: true}, "Subscribed Successfully!")
//     )
// })
// Instead of thius toggleSubscription method , IT IS NOT RESTful , I will opt for subscribe and unsubscribe method

const subscribeChannel = asyncHandler(async (req,res) => {
  const {channelId} = req.params;

    if(!isValidObjectId(channelId)){
      throw new ApiError(400 , "Channel not found") 
    }

    const isSubscribed = await Subscription.findOne({
      subscriber: req.user?._id,
      channel: channelId
    })

    if(isSubscribed){
      return res.status(200)
            .json(
              new ApiResponse(200, isSubscribed, "Already a subscriber!")
            )
    }

    const addSubscriber = await Subscription.create({
      subscriber: req.user?._id,
      channel: channelId,
    })

  
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { subscribed: true },
          "Subscription Added Successfully!"
        )
      );

    
})



const unsubscribeChannel = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Channel not found");
  }

  const isSubscribed = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (!isSubscribed) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          { subscribed: false },
          "You are not subscribed to this channel"
        )
      );
  }

  await Subscription.findByIdAndDelete(isSubscribed._id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully")
    );
});





// controller to return subscriber list of a channel
// For each subscriber , include:
// The user details
// Check if the channel has subscribed them or not (Mutual Subscription)
// Subscriber count
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  let { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  channelId = new mongoose.Types.ObjectId(channelId);

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: channelId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscriberSubscription", // To check for mutual subscription
            },
          },
          {
            $addFields: {
              subscriberSubscription: {
                $cond: {
                  if: {
                    $in: [channelId, "$subscriberSubscription.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
              subscribersCount: {
                $size: "$subscriberSubscription",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        _id: 0,
        subscriber: {
          _id: 1,
          username: 1,
          fullName: 1,
          "avatar.url": 1,
          subscriberSubscription: 1,
          subscribersCount: 1,
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  let { subscriberId } = req.params;

  subscriberId =  new mongoose.Types.ObjectId(subscriberId)

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriberId");
  }


  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: subscriberId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannel",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscribedChannel",
    },
    {
      $project: {
        _id: 0,
        subscribedChannel: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed Channels fetched successfully!"
      )
    );
});


export { subscribeChannel, unsubscribeChannel, getUserChannelSubscribers, getSubscribedChannels };
