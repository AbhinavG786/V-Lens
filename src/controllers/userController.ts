import { User } from "../models/userModel";
import express from "express";

class UserController {
    getAllUsers=async(req:express.Request, res:express.Response) => {
        try {
            const users = await User.find();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: "Error fetching users", error });
        }
    }
}

export default new UserController();