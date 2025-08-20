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

    if (!playlist.owner.equals(req.user._id)) {
      throw new ApiError(400, "You are not authorized to delete this playlist");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res.status(200)
    .json(new ApiResponse(200,{},"Playlist deleted successfully!"))
})

export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist
}



