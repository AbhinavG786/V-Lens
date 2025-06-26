import { Schema, model } from 'mongoose';

const PrescriptionSchema = new Schema({
  imageUrl: String,
  extractedText: String,
  createdAt: { type: Date, default: Date.now }
});

export const Prescription = model('Prescription', PrescriptionSchema);
