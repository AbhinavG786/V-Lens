import * as express from "express";

// Only augment the Request interface, do not replace it
// This preserves all standard Express typings

declare module "express" {
  interface Request {
    user?: admin.auth.DecodedIdToken;
    admin?: {
      uid: string;
      email: string;
      fullName: string;
      isAdmin: boolean;
    };
  }
}
