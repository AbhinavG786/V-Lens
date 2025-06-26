import express from "express";
import admin from "../firebase/firebaseInit";
import { User } from "../models/userModel";

class FirebaseAuthController {
  login = async (req: express.Request, res: express.Response) => {
    const { idToken } = req.body;
    if (!idToken) {
      res.status(400).json({ error: "ID token required" });
      return;
    }

    try {
      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

      const decoded = await admin.auth().verifyIdToken(idToken, true);

      if (!decoded.email_verified) {
        res.status(401).json({ error: "Please verify your email first." });
        return;
      }

      const sessionCookie = await admin
        .auth()
        .createSessionCookie(idToken, { expiresIn });

      const provider = decoded.firebase?.sign_in_provider; // "google.com" or "password"

      let user = await User.findOne({ firebaseUID: decoded.uid });
      if (!user) {
        user = await User.create({
          firebaseUID: decoded.uid,
          email: decoded.email,
          fullName: decoded.name,
          loginMethod: provider === "google.com" ? "google" : "email",
          addresses: [],
          wishlist: [],
          prescriptions: [],
        });
      }

      res.cookie("session", sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

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
        sameSite: "strict",
      });

      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout failed:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  };
}

export default new FirebaseAuthController();
