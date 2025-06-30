import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinary';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'prescriptions',
    format: ['jpg', 'png', 'jpeg', 'pdf'], // 'format' instead of 'allowed_formats'
  }),
});

const upload = multer({ storage });

export default upload;