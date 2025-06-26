import express from 'express';
import multer from 'multer';
import { extractPrescriptionText } from '../controllers/prescription.controller';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/', upload.single('image'), (req, res, next) => {
  extractPrescriptionText(req, res).catch(next);
});

export default router;
