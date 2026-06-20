import { Request, Response } from 'express';
import Post, { IPost } from '../models/Post';
import Comment from '../models/Comment';
import { createNotification } from '../utils/createNotification';

export const createPost = async (req: Request, res: Response) => {
  try {
    const { title, content, type, tags, price, location, eventDate, images } = req.body;

    const post = new Post({
      title,
      content,
      author: req.user?._id,
      type: type || 'general',
      tags: tags || [],
      price,
      location,
      eventDate,
      images: Array.isArray(images) ? images.slice(0, 4) : [],
    });

    await post.save();
    await post.populate('author', 'username firstName lastName avatar');

    const io = req.app.get('io');
    if (io) {
      io.emit('post:new', { post });
    }

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error creating post' });
  }
};

export const getPosts = async (req: Request, res: Response) => {
  try {
    const { type, page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query: any = { isActive: true };

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }

    const posts = await Post.find(query)
      .populate('author', 'username firstName lastName avatar')
      .populate('comments')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error fetching posts' });
  }
};

export const getPost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username firstName lastName avatar bio')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username firstName lastName avatar'
        }
      });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error fetching post' });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    const { title, content, tags, price, location, eventDate } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== (req.user as any)?._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    // Update fields
    if (title) post.title = title;
    if (content) post.content = content;
    if (tags) post.tags = tags;
    if (price !== undefined) post.price = price;
    if (location) post.location = location;
    if (eventDate) post.eventDate = eventDate;

    await post.save();
    await post.populate('author', 'username firstName lastName avatar');

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error updating post' });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== (req.user as any)?._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Soft delete
    post.isActive = false;
    await post.save();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error deleting post' });
  }
};

export const likePost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = (req.user as any)?._id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();

    if (!isLiked && post.author.toString() !== userId.toString()) {
      await createNotification(
        post.author,
        'like',
        'New like on your post',
        `${(req.user as any)?.firstName} liked your post "${post.title}"`,
        post._id as any
      );
    }

    res.json({
      message: isLiked ? 'Post unliked' : 'Post liked',
      likesCount: post.likes.length,
      isLiked: !isLiked
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTrendingTags = async (_req: Request, res: Response) => {
  try {
    const tags = await Post.aggregate([
      { $match: { isActive: true, tags: { $exists: true, $ne: [] } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      tags: tags.map((t) => ({ tag: t._id, count: t.count }))
    });
  } catch (error) {
    console.error('Get trending tags error:', error);
    res.status(500).json({ message: 'Server error fetching tags' });
  }
};
