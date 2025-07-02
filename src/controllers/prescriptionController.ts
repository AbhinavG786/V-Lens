import { Request, Response } from "express";
import Tesseract from "tesseract.js";
import { Prescription } from "../models/prescriptionModel";
import cloudinary from "../utils/cloudinary";

class PrescriptionController {
  extractPrescriptionText = async (req: Request, res: Response) => {
    const { folder = "prescription" } = req.body;
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const imageUrl = file.path;
    const imagePublicId = file.filename;

    try {
      const result = await Tesseract.recognize(imageUrl, "eng");
      const extractedText = result.data.text;

      const newDoc = await Prescription.create({
        imageUrl,
        imagePublicId,
        extractedText,
      });

      res.json({ text: extractedText, id: newDoc._id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "OCR Failed" });
    }
  };

  deletePrescription = async (req: Request, res: Response) => {
    const { prescriptionId } = req.params;
    try {
      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription) {
         res.status(404).json({ message: "Prescription not found" });
         return
      }
      if (prescription.imagePublicId) {
        await cloudinary.uploader.destroy(prescription.imagePublicId);
      }
      await prescription.deleteOne();
      res.status(204).json({ message: "Prescription deleted successfully" });
  }
  catch (error) {
      console.error("Error deleting prescription:", error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
}
}

export default new PrescriptionController();
