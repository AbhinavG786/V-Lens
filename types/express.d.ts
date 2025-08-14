import express from "express";

declare global {
  namespace Express {
    // interface User {
    //   id: string;
    // }

    interface Request {
      // user?: User;
       user?: admin.auth.DecodedIdToken;
       admin?: {
         uid: string;
         email: string;
         fullName: string;
         isAdmin: boolean;
       };
        agent?: {
          uid: string;
          email: string;
          fullName: string;
          isAgent: boolean;
        };
        warehouseManager?: {
          uid: string;
          email: string;
          fullName: string;
          isWarehouseManager: boolean;
        };
    }
  }
}
