import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadAvatar, uploadPostImages } from '../middleware/upload';
import { uploadAvatar as uploadAvatarHandler, uploadPostImagesHandler } from '../controllers/uploadController';

const router = Router();

router.post('/avatar', authenticate, (req, res, next) => {
  uploadAvatar(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Upload failed' });
    }
    return uploadAvatarHandler(req, res);
  });
});

router.post('/post-images', authenticate, (req, res, next) => {
  uploadPostImages(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err instanceof Error ? err.message : 'Upload failed' });
    }
    return uploadPostImagesHandler(req, res);
  });
});

export default router;
