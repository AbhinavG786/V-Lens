import express from "express";
import admin from "../firebase/firebaseInit";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel";
import sendMailer from "../utils/sendMailer";
import redisClient from "../utils/redis";

class FirebaseAuthController {
  login = async (req: express.Request, res: express.Response) => {
    // dont keep isAgent and isAdmin true together, only one should be true at a time, also give currentLoad and maxLoad values only during agent signup
    // if isAdmin is true, then currentLoad and maxLoad should not be given,
    //for warehouse sign in send isWarehouseManager as true while keep isAgent and isAdmin false
    const {
      fullName,
      idToken,
      phone,
      isAdmin = false,
      isAgent = false,
      isWarehouseManager = false,
      currentLoad = 0,
      maxLoad = 3,
    } = req.body;
    if (!idToken) {
      res.status(400).json({ error: "ID token required" });
      return;
    }

    try {
      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

      const decoded = await admin.auth().verifyIdToken(idToken, true);

      // if (!decoded.email_verified) {
      //   res.status(401).json({ error: "Please verify your email first." });
      //   return;
      // }

      const sessionCookie = await admin
        .auth()
        .createSessionCookie(idToken, { expiresIn });

      const provider = decoded.firebase?.sign_in_provider; // "google.com" or "password"

      let user = await User.findOne({ firebaseUID: decoded.uid });
      if (!user) {
        const Name = decoded.name || fullName;
        if (!Name) {
          res
            .status(400)
            .json({ error: "Full name is required for new user." });
          return;
        }
        if (!phone) {
          res
            .status(400)
            .json({ error: "Phone number is required for new user." });
          return;
        }
        const globalPhoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!globalPhoneRegex.test(phone)) {
          res.status(400).json({
            error: "Invalid phone number. Use E.164 format, e.g., +14155552671",
          });
          return;
        }
        user = await User.create({
          firebaseUID: decoded.uid,
          email: decoded.email,
          fullName: Name,
          loginMethod: provider === "google.com" ? "google" : "email",
          phone: phone,
          isAdmin: isAdmin,
          isAgent: isAgent,
          isWarehouseManager: isWarehouseManager,
          currentLoad: currentLoad,
          maxLoad: maxLoad,
          addresses: [],
          wishlist: [],
          prescriptions: [],
        });
      }

      res.cookie("session", sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: true,
        sameSite: "none",
        domain: "v-lens.onrender.com", 
        path: "/", 
      });
      res.cookie("session_exists", "true", { secure: true, sameSite: "none", domain: "v-lens.onrender.com", path: "/" });

      res.status(200).json({ message: "User login successful", user });
    } catch (error) {
      console.error("User login failed:", error);
      res.status(401).json({ error: "Failed to login user" });
    }
  };

  logout = async (req: express.Request, res: express.Response) => {
    try {
      res.clearCookie("session", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        domain: "v-lens.onrender.com", 
        path: "/", 
      });
      res.clearCookie("session_exists", { secure: true, sameSite: "none", domain: "v-lens.onrender.com", path: "/" });

      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout failed:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  };

  requestPasswordReset = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { email } = req.body;
    try {
      const user = await User.findOne({
        email: email,
      });
      if (!user) {
        res.status(400).json({ message: "User not found" });
        return;
      }
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_ACCESS_SECRET as string
      );
      await redisClient.set(`password-reset:${user._id}`, token, {
        EX: 5 * 60,
      });
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${user._id}/${token}`;

      await sendMailer.sendPasswordResetMail(email, { resetUrl: resetLink });
      res.status(200).json({ message: "Password reset link sent to email" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error requesting password reset", error });
    }
  };

  verifyPasswordResetToken = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { token, userId } = req.params;

    try {
      const user = await User.findById(userId);
      if (!user) {
        res.status(400).json({ message: "User not found" });
        return;
      }
      const storedToken = await redisClient.get(`password-reset:${user._id}`);
      if (!storedToken || storedToken !== token) {
        res.status(400).json({ message: "Token expired or invalid" });
        return;
      }
      jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET as string,
        async (err: any) => {
          if (err) {
            res.status(400).json({ message: "Invalid token" });
            return;
          } else {
            res.status(200).json({ message: "Token verified successfully" });
            await redisClient.del(`password-reset:${user._id}`);
          }
        }
      );
    } catch (error) {
      res.status(500).json({ message: "Error verifying token", error });
    }
  };

  resetPassword = async (req: express.Request, res: express.Response) => {
    const { newPassword } = req.body;
    const { userId } = req.params;

    try {
      const user = await User.findById(userId);
      if (!user || !user.firebaseUID) {
        res.status(400).json({ message: "User not found" });
        return;
      } else {
        await admin.auth().updateUser(user.firebaseUID, {
          password: newPassword,
        });
        res.status(200).json({ message: "Password reset successfully" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error resetting password", error });
    }
  };
}

export default new FirebaseAuthController();
