import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { Playlist } from "../models/playlist.model.js";

const createPlaylist = asyncHandler(async (req,res) => {
    const {name,description} = req.body

    if(!name || !name.trim()){
        throw new ApiError(400, "Name is required to create playlist!")
    }

    if(!description || !description.trim()){
        throw new ApiError(400, "Description is required to create playlist!");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id, 
    })

    if(!playlist){
        throw new ApiError(500, "Failed to create playlist, Try again!")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully!"))
            

})


const updatePlaylist = asyncHandler(async (req,res) => {
    const {name,description} = req.body
    const {playlistId} = req.params

    if (!name || !name.trim()) {
      throw new ApiError(400, "Name is required to update playlist!");
    }

    if (!description || !description.trim()) {
      throw new ApiError(400, "Description is required to update playlist!");
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "Playlist not found!")
    }

    if (!playlist.owner.equals(req.user._id)) {
      throw new ApiError(400, "You are not authorized to update this playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name: name,
            description: description,
        },
        {new : true},
    )

    if(!updatedPlaylist){
        throw new ApiError(400, "Failed to update the playlist, Try again!")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist Updated Successfully!"))

})



const deletePlaylist = asyncHandler(async (req,res) => {
    const { playlistId } = req.params;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      throw new ApiError(400, "Playlist not found!");
    }

    if (!playlist.owner.equals(req.user?._id)) {
      throw new ApiError(400, "You are not authorized to delete this playlist");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res.status(200)
    .json(new ApiResponse(200,{},"Playlist deleted successfully!"))
})


const addVideoToPlaylist = asyncHandler(async (req,res) => {
    const {playlistId,videoId} = req.params

    const video = await Video.findById(videoId)
    const playlist = await Playlist.findById(playlistId)

    if(!video){
        throw new ApiError(400, "Video does not exist")
    }

    if(!playlist){
        throw new ApiError(400, "Playlist does not exist");
    }

    if (!playlist.owner.equals(req.user?._id)) {
      throw new ApiError(400, "You are not authorized to add to this playlist");
    }


    const newPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        {
            new : true
        }
    )

    if(!newPlaylist){
        throw new ApiError(500 , "Failed to add video to the playlist, Try again!")
    }

    return res.status(200)
    .json(new ApiResponse(200, newPlaylist, "Video added to the playlist successfully!"))

})



const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const video = await Video.findById(videoId);
  const playlist = await Playlist.findById(playlistId);

  if (!video) {
    throw new ApiError(400, "Video does not exist");
  }

  if (!playlist) {
    throw new ApiError(400, "Playlist does not exist");
  }

  if (!playlist.owner.equals(req.user?._id)) {
    throw new ApiError(400, "You are not authorized to remove from this playlist");
  }

  const newPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!newPlaylist) {
    throw new ApiError(
      500,
      "Failed to removed video from the playlist, Try again!"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        newPlaylist,
        "Video removed from the playlist successfully!"
      )
    );
});


const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $match: {
        "videos.isPublished": true,
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
      $unwind: "$owner", 
    },
    {
      $addFields: {
        totalVideos: { $size: "$videos" },
        totalViews: { $sum: "$videos.views" },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        totalVideos: 1,
        totalViews: 1,
        videos: {
          _id: 1,
          "videoFile.url": 1,
          "thumbnail.url": 1,
          title: 1,
          description: 1,
          duration: 1,
          createdAt: 1,
          views: 1,
        },
        owner: {
          username: 1,
          fullName: 1,
          "avatar.url": 1,
        },
      },
    },
  ]);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"));
});


export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistById
}



