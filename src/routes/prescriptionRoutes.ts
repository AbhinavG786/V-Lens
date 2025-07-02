import express from 'express';
import prescription from '../controllers/prescriptionController';
import upload from '../middlewares/upload';

const router = express.Router();

// router.post('/', upload.single('image'), (req, res, next) => {
//   prescription.extractPrescriptionText(req, res).catch(next);
// });

router.route('/').post(upload.single('file'), prescription.extractPrescriptionText);
router.route('/:prescriptionId').delete(prescription.deletePrescription);

export default router;
