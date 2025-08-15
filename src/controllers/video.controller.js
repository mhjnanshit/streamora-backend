import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/fileupload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose, { isValidObjectId } from "mongoose";


const publishAVideo = asyncHandler(async (req, res) => {

  // Take the details of the video from the user - Title and description are mandatory
  // Take video and thumbnail path via req.files.___.path
  // Check if they are there. If yes , upload them on cloudinary and get the object
  // Now , Video.create() 
  // Check if video is created and return a response
  // Also , the video and thumbnail would be on the server due to the multer middleware

  const { title, description } = req.body;

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "All fields are required");
  }

  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "videoFileLocalPath is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnailLocalPath is required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(400, "Video file not found");
  }

  if (!thumbnail) {
    throw new ApiError(400, "Thumbnail not found");
  }

  const video = await Video.create({
    title,
    description,
    duration: videoFile.duration,
    videoFile: {
      url: videoFile.url,
      public_id: videoFile.public_id,
    },
    thumbnail: {
      url: thumbnail.url,
      public_id: thumbnail.public_id,
    },
    owner: req.user?._id,
    isPublished: false,
  });

  if (!video) {
    throw new ApiError(500, "Video Upload failed. Please try again!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"));
});


const updateVideo = asyncHandler(async (req,res) => {

    // Check for the video via req.params if it exists 
    // If yes , Check for the owner if it matches and can update the video
    // Update the video

    const {title,description} = req.body
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
      throw new ApiError(400, "Video does not exist")
    }

    if(!title?.trim() || !description?.trim()){
      throw new ApiError(400, "Title and description are required")
    }

    const video = await Video.findById(videoId);

    if(!video){
      throw new ApiError(400, "Video not found")
    }

    if(video?.owner.toString() !== req.user?._id.toString()){
      throw new ApiError(400, "You are not authorized to update this video")
    }

    const thumbnailToDelete = video.thumbnail.public_id
    const thumbnailToUpdate = req.file?.path

    // if(!thumbnailToUpdate){
    //   throw new ApiError(400, "Thumbnail is required")
    // }
    // Thumbnail is optional

    let thumbnail;

    if(thumbnailToUpdate){
      thumbnail = await uploadOnCloudinary(thumbnailToUpdate);
     // gives the object of thumbnail which contains url

      if(!thumbnail){
      throw new ApiError(400, "Thumbnail not found")
      }
    }

    const updateData = {
      title,
      description,
    };

    if (thumbnail) {
      updateData.thumbnail = {
        public_id: thumbnail.public_id,
        url: thumbnail.url,
      };
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { $set: updateData },
      { new: true }
    );


    if(!updatedVideo) {
      throw new ApiError(400, "Video not updated, Try Again!")
    }

    if(thumbnail){
      await deleteOnCloudinary(thumbnailToDelete);
    }

    return res.status(200)
    .json(new ApiResponse(
      200, updatedVideo, "Video Updated Successfully"
    ))
})

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "No video found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You are not authorized to delete this video"
    );
  }

  const videoDeleted = await Video.findByIdAndDelete(video?._id);

  if (!videoDeleted) {
    throw new ApiError(400, "Failed to delete the video please try again");
  }

  await deleteOnCloudinary(video.thumbnail.public_id); // video model has thumbnail public_id stored in it->check videoModel
  await deleteOnCloudinary(video.videoFile.public_id, "video"); // specify video while deleting video

  // delete video likes
  await Like.deleteMany({
    video: videoId,
  });

  // delete video comments
  await Comment.deleteMany({
    video: videoId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});


const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't toogle publish status as you are not the owner"
    );
  }

  const toggledVideoPublish = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video?.isPublished,
      },
    },
    { new: true }
  );

  if (!toggledVideoPublish) {
    throw new ApiError(500, "Failed to toogle video publish status");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isPublished: toggledVideoPublish.isPublished },
        "Video publish toggled successfully"
      )
    );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  // let userId = req.body;

  // userId = new mongoose.Types.ObjectId(userId)
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  if (!isValidObjectId(req.user?._id)) {
    throw new ApiError(400, "Invalid userId");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [
                      mongoose.Types.ObjectId(req.user._id),
                      "$subscribers.subscriber",
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              "avatar.url": 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        "videoFile.url": 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!video || video.length === 0) {
    throw new ApiError(500, "failed to fetch video");
  }

  // increment views if video fetched successfully
  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });

  // add this video to user watch history
  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "video details fetched successfully"));
});


const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  console.log(userId);
  const pipeline = [];

  if (query) {
    pipeline.push({
      $search: {
        index: "search-videos",
        text: {
          query: query,
          path: ["title", "description"], //search only on title, desc
        },
      },
    });
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }

    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  // fetch videos only that are set isPublished as true
  pipeline.push({ $match: { isPublished: true } });

  //sortBy can be views, createdAt, duration
  //sortType can be ascending(-1) or descending(1)
  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$ownerDetails",
    }
  );

  const videoAggregate = Video.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const video = await Video.aggregatePaginate(videoAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Videos fetched successfully"));
});


export {
  publishAVideo,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getVideoById,
  getAllVideos
}