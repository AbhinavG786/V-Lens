import admin from "../firebase/firebaseInit";
import { Request, Response, NextFunction } from "express";

class FirebaseAuthMiddleware {
  verifySessionCookie = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const sessionCookie = req.cookies?.session || "";

    try {
      const decodedClaims = await admin
        .auth()
        .verifySessionCookie(sessionCookie, true);
      req.user = decodedClaims;
     next();
    } catch (error) {
      console.error("Invalid session cookie", error);
       res.status(401).json({ error: "Unauthorized" });
    }
  };
}

export default new FirebaseAuthMiddleware();
