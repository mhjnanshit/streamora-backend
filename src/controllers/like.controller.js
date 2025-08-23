import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video does not exist");
  }

  const isLikedAlready = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (!isLikedAlready) {
    await Like.create({
      video: videoId,
      likedBy: req.user?._id,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { isLiked: true }, "Liked successfully!"));
  }

  await Like.findByIdAndDelete(isLikedAlready?._id);
  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: false }, "Unliked successfully!"));
});
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "Comment does not exist");
  }

  const isLikedAlready = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (!isLikedAlready) {
    await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { isLiked: true }, "Liked successfully!"));
  }

  await Like.findByIdAndDelete(isLikedAlready?._id);
  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: false }, "Unliked successfully!"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
        pipeline: [
          { $match: { isPublished: true } }, // only published videos
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
            },
          },
          { $unwind: "$ownerDetails" },
          {
            $project: {
              _id: 1,
              "videoFile.url": 1,
              "thumbnail.url": 1,
              title: 1,
              description: 1,
              views: 1,
              duration: 1,
              createdAt: 1,
              isPublished: 1,
              ownerDetails: {
                username: 1,
                fullName: 1,
                "avatar.url": 1,
              },
            },
          },
          { $sort: { createdAt: -1 } }, // sort inside pipeline
        ],
      },
    },
    {
      $unwind: "$likedVideos", // one document per liked video
    },
    {
      $replaceRoot: { newRoot: "$likedVideos" }, // make the video the top-level object
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked Videos fetched successfully!")
    );
});

export { toggleCommentLike, toggleVideoLike, getLikedVideos };
