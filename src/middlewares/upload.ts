import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinary';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folderType = req.query.folder || req.body.folder || 'others';
    return {
      folder: folderType.toString(), // e.g., 'prescriptions', 'lenses', 'frames'
      allowed_formats: ['jpg', 'png', 'jpeg'],
      public_id: `${Date.now()}-${file.originalname}`, 
    };
  },
  // params: async (req, file) => ({
  //   folder: 'prescriptions',
  //   // format: ['jpg', 'png', 'jpeg', 'pdf'], // 'format' instead of 'allowed_formats'
  // }),
});

// const upload = multer({ storage });

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Invalid file type. Only JPEG and PNG files are allowed.');
      cb(error as any, false);
    }}})

export default upload;