import { Request, Response } from 'express';
import Tesseract from 'tesseract.js';
import { Prescription } from '../models/Prescription';

export const extractPrescriptionText = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const imagePath = file.path;

  try {
    const result = await Tesseract.recognize(imagePath, 'eng');
    const extractedText = result.data.text;

    const newDoc = await Prescription.create({
      imageUrl: imagePath,
      extractedText
    });

    res.json({ text: extractedText, id: newDoc._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OCR Failed' });
  }
};
