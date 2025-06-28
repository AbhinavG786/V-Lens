import { Request, Response } from 'express';

class UploadController {
uploadPrescription = async (req: Request, res: Response)=> {
  try {
    if (!req.file || !req.file.path) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    res.status(200).json({ url: req.file.path });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
}
export default new UploadController();