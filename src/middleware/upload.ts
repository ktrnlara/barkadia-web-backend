import multer from 'multer';
import path from 'path';
import {
  AVATAR_DIR,
  MAX_FILE_SIZE,
  MAX_POST_IMAGES,
  POST_IMAGE_DIR,
  isAllowedImageMime,
  uniqueFilename,
} from '../config/uploadPaths';

const imageFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (isAllowedImageMime(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
};

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (_req, file, cb) => cb(null, uniqueFilename(file.originalname)),
});

const postImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, POST_IMAGE_DIR),
  filename: (_req, file, cb) => cb(null, uniqueFilename(file.originalname)),
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: imageFilter,
}).single('avatar');

export const uploadPostImages = multer({
  storage: postImageStorage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_POST_IMAGES },
  fileFilter: imageFilter,
}).array('images', MAX_POST_IMAGES);

export function getUploadedPublicPath(file: Express.Multer.File, folder: 'avatars' | 'posts'): string {
  return `/uploads/${folder}/${path.basename(file.filename)}`;
}
