import { Request, Response } from "express";
import Tesseract from "tesseract.js";
import { Prescription } from "../models/prescriptionModel";

class PrescriptionController {
  extractPrescriptionText = async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const imageUrl = file.path;

    try {
      const result = await Tesseract.recognize(imageUrl, "eng");
      const extractedText = result.data.text;

      const newDoc = await Prescription.create({
        imageUrl,
        extractedText,
      });

      res.json({ text: extractedText, id: newDoc._id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "OCR Failed" });
    }
  };
}

export default new PrescriptionController();
