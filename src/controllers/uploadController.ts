import { Request, Response } from 'express';
import User from '../models/User';
import { getUploadedPublicPath } from '../middleware/upload';

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const url = getUploadedPublicPath(req.file, 'avatars');
    user.avatar = url;
    await user.save();

    res.json({
      message: 'Avatar uploaded successfully',
      url,
      user: {
        id: user._id,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Server error uploading avatar' });
  }
};

export const uploadPostImagesHandler = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) {
      return res.status(400).json({ message: 'No image files provided' });
    }

    const urls = files.map((file) => getUploadedPublicPath(file, 'posts'));

    res.json({
      message: 'Images uploaded successfully',
      urls,
    });
  } catch (error) {
    console.error('Upload post images error:', error);
    res.status(500).json({ message: 'Server error uploading images' });
  }
};
