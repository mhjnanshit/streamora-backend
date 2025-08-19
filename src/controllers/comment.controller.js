import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js"
import { Comment } from "../models/comment.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  let { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const video = await Video.findById(videoId);

  videoId = mongoose.Types.ObjectId(videoId);

  if (!video) {
    throw new ApiError(400, "Video does not exist!");
  }

  let comments = Comment.aggregate([
    {
      $match: {
        video: videoId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        owner: {
          username: 1,
          fullName: 1,
          "avatar.url": 1,
        },
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  comments = await Comment.aggregatePaginate(comments,options)

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));

});


const addComment = asyncHandler(async (req,res) => {
    const {videoId} = req.params
    const {content} = req.body
    
    if(!content || !content.trim()){
        throw new ApiError(400, "Add content for comment!")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video does not exist!")
    }


    const comment = await Comment.create({
        content: content,
        video: videoId,
        owner: req.user?._id
    })

    if(!comment){
        throw new ApiError(500, "Failed to add comment, Try again!")
    }

    return res.status(200)
    .json(new ApiResponse(200,comment,"Comment added successfully!"))

})

const updateComment = asyncHandler(async (req,res) => {
    const {content} = req.body
    const {commentId} = req.params

    if (!content || !content.trim()) {
      throw new ApiError(400, "Add content for updating your comment!");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(400, "Comment does not exist!");
    }

    if (!comment.owner.equals(req.user._id)) {
      throw new ApiError(400, "You are not authorised to remove this comment");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content,
            }
        },
        {
            new: true
        }
    )

    if(!updatedComment){
        throw new ApiError(500, "Could not update comment. Try again!")
    }

    return res.status(200)
    .json(new ApiResponse(200,updatedComment,"Comment updated successfully!"))

})

const deleteComment = asyncHandler(async (req,res) => {
    const {commentId} = req.params

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(400, "Comment does not exist")
    }

    if (!comment.owner.equals(req.user._id)) {
      throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await Comment.findByIdAndDelete(commentId);

    await Like.deleteMany({
        comment: commentId
    })

    return res.status(200)
    .json(new ApiResponse(200,{},"Comment deleted successfully!"))
})



export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}