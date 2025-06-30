import express from 'express';
import multer from 'multer';
import prescription from '../controllers/prescriptionController';
import upload from '../middlewares/upload';

const router = express.Router();

router.post('/', upload.single('image'), (req, res, next) => {
  prescription.extractPrescriptionText(req, res).catch(next);
});

export default router;
