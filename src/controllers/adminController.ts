import { User } from "../models/userModel";
import express from "express";
import admin from "../firebase/firebaseInit";

class AdminController {
  getAllUsers = async (req: express.Request, res: express.Response) => {
    const { skip, take } = req.pagination!;
    try {
      const users = await User.find().skip(Number(skip)).limit(Number(take));
      const total = await User.countDocuments();
      res
        .status(200)
        .json({
          data: users,
          total,
          skip: Number(skip),
          take: Number(take),
          totalPages: Math.ceil(total / Number(take)),
        });
    } catch (error) {
      res.status(500).json({ message: "Error fetching users", error });
    }
  };

  getUserById = async (req: express.Request, res: express.Response) => {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    try {
      const user = await User.findById(userId);
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
    const { userId } = req.params;
    const { fullName, email, gender } = req.body;
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    try {
      const updatedData: any = {};
      if (fullName) updatedData.fullName = fullName;
      if (email) updatedData.email = email;

      if (gender) {
        const allowedGenders = (User.schema.path("gender") as any).enumValues;
        if (allowedGenders.includes(gender)) {
          updatedData.gender = gender;
        } else {
          res.status(400).json({ message: `Invalid gender value.` });
          return;
        }
      }
      const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
        new: true,
      });
      if (!updatedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Error updating user", error });
    }
  };

  deleteUser = async (req: express.Request, res: express.Response) => {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    try {
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      const firebaseUID = user?.firebaseUID;
      if (!firebaseUID) {
        res.status(404).json({ message: "FirebaseUID not found" });
        return;
      }
      await admin.auth().deleteUser(firebaseUID);
      await user.deleteOne();
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting user", error });
    }
  };

  getAllAdmins=async(req:express.Request,res:express.Response)=>{
    const {skip,take}=req.pagination!;
    try{
        const admins=await User.find({isAdmin:true}).skip(Number(skip)).limit(Number(take));
        const total=await User.countDocuments({isAdmin:true});
        res.status(200).json({
          data: admins,
          total,
          skip: Number(skip),
          take: Number(take),
          totalPages: Math.ceil(total / Number(take)),
        });
    }
    catch(error){
      res.status(500).json({ message: "Error fetching admins", error });
    }
  }

}

export default new AdminController();