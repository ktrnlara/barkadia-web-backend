import { Request, Response } from 'express';
import User from '../models/User';
import Post from '../models/Post';
import Comment from '../models/Comment';

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [postCount, commentCount, totalLikes] = await Promise.all([
      Post.countDocuments({ author: user._id, isActive: true }),
      Comment.countDocuments({ author: user._id, isActive: true }),
      Post.aggregate([
        { $match: { author: user._id, isActive: true } },
        { $project: { likeCount: { $size: '$likes' } } },
        { $group: { _id: null, total: { $sum: '$likeCount' } } }
      ])
    ]);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        program: user.program,
        branch: user.branch,
        yearLevel: user.yearLevel,
        studentId: user.studentId,
        bio: user.bio,
        avatar: user.avatar,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        stats: {
          posts: postCount,
          comments: commentCount,
          likes: totalLikes[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
};

export const getUserPosts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const posts = await Post.find({ author: req.params.id, isActive: true })
      .populate('author', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Post.countDocuments({ author: req.params.id, isActive: true });

    res.json({
      posts,
      pagination: { total, pages: Math.ceil(total / Number(limit)), current: Number(page) }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error fetching user posts' });
  }
};

export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    const [recentPosts, recentComments] = await Promise.all([
      Post.find({ author: userId, isActive: true })
        .select('title createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      Comment.find({ author: userId, isActive: true })
        .select('content createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const activity = [
      ...recentPosts.map((p) => ({
        id: p._id,
        type: 'post' as const,
        content: `Posted: ${p.title}`,
        timestamp: p.createdAt
      })),
      ...recentComments.map((c) => ({
        id: c._id,
        type: 'comment' as const,
        content: `Commented: ${c.content.slice(0, 80)}${c.content.length > 80 ? '...' : ''}`,
        timestamp: c.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    res.json({ activity });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ message: 'Server error fetching activity' });
  }
};
