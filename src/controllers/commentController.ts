import { Request, Response } from 'express';
import Comment from '../models/Comment';
import Post from '../models/Post';
import { createNotification } from '../utils/createNotification';

export const createComment = async (req: Request, res: Response) => {
  try {
    const { content, parentComment } = req.body;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post || !post.isActive) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = new Comment({
      content,
      author: req.user?._id,
      post: postId,
      parentComment: parentComment || null
    });

    await comment.save();
    post.comments.push(comment._id as any);
    await post.save();

    await comment.populate('author', 'username firstName lastName avatar');

    if (post.author.toString() !== (req.user as any)?._id.toString()) {
      await createNotification(
        post.author,
        'comment',
        'New comment on your post',
        `${(req.user as any)?.firstName} commented on "${post.title}"`,
        post._id as any
      );
    }

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Server error creating comment' });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const comments = await Comment.find({ post: req.params.id, isActive: true })
      .populate('author', 'username firstName lastName avatar')
      .sort({ createdAt: 1 });

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
};
