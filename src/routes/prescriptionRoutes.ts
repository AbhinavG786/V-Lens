import express from 'express';
import multer from 'multer';
import prescription from '../controllers/prescriptionController';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/', upload.single('image'), (req, res, next) => {
  prescription.extractPrescriptionText(req, res).catch(next);
});

export default router;
