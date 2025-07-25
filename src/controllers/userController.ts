import { User } from "../models/userModel";
import express from "express";
import { uploadBufferToCloudinary } from "../utils/cloudinary";
import cloudinary from "../utils/cloudinary";

class UserController {
  getUserProfile = async (req: express.Request, res: express.Response) => {
    const firebaseUID = req.user?.uid; 
    if (!firebaseUID) {
      res.status(400).json({ message: "Firebase ID is required" });
      return;
    }
    try {
   const user = await User.findOne({ firebaseUID });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user", error });
    }
  };

  updateUser = async (req: express.Request, res: express.Response) => {
    const { fullName, gender,phone,folder="user" } = req.body;
    const folderType = req.body.folder || req.query.folder || "others";
    const firebaseUID=req.user?.uid;
    if (!firebaseUID) {
      res.status(400).json({ message: "Firebase ID is required" });
      return;
    }
    try {
      const user = await User.findOne({ firebaseUID });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
        const updatedData: any = {};
        if (fullName) updatedData.fullName = fullName;
        if (phone) updatedData.phone = phone;
        
        if (gender) {
          const allowedGenders = (User.schema.path('gender') as any).enumValues;
          if (allowedGenders.includes(gender)) {
            updatedData.gender = gender;
          } else {
            res.status(400).json({ message: `Invalid gender value.` });
            return;
          }
        }
        if(req.file){
          if(user.imagePublicId){
            await cloudinary.uploader.destroy(user.imagePublicId);
          } 
          try{
          const uploadedResult = await uploadBufferToCloudinary(req.file.buffer,req.file.originalname, folderType);
          if(!uploadedResult){
            res.status(500).json({ message: "Error uploading image" });
            return;
          }
          updatedData.imageUrl = uploadedResult.secure_url;
          updatedData.imagePublicId = uploadedResult.public_id;
        }
        catch (error) {
          res.status(500).json({ message: "Error uploading image", error });
          return;
        }
        }
        Object.assign(user, updatedData);
      const updatedUser = await user.save();
      if (!updatedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Error updating user", error });
    }
  };

  deleteUser=async(req: express.Request, res: express.Response) => {
   const firebaseUID = req.user?.uid;
    if (!firebaseUID) {
      res.status(400).json({ message: "Firebase ID is required" });
      return;
    }
    try {
      const deletedUser = await User.findOneAndDelete({firebaseUID});
      if (!deletedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting user", error });
    }
  }
}

export default new UserController();
