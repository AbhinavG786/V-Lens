import { Request, Response } from "express";
import { ARTryOnLog } from "../models/arTryOnLogModel";

class ARTryOnLogController {
  logTryOn = async (req: Request, res: Response) => {
    try {
      const log = await ARTryOnLog.create(req.body);
      res.status(201).json(log);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

export default new ARTryOnLogController(); 