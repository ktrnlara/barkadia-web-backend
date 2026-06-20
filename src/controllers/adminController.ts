import { Request, Response } from 'express';
import User from '../models/User';
import Post from '../models/Post';
import Message from '../models/Message';

export const getStats = async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, newUsersToday, totalPosts, totalMessages, usersByRole, deptAgg] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      Post.countDocuments({ isActive: true }),
      Message.countDocuments(),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      User.aggregate([
        { $match: { department: { $exists: true, $ne: '' } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    const roleCounts = { user: 0, moderator: 0, admin: 0, superadmin: 0 };
    usersByRole.forEach((r: { _id: string; count: number }) => {
      if (r._id in roleCounts) roleCounts[r._id as keyof typeof roleCounts] = r.count;
    });

    const usersByDepartment: Record<string, number> = {};
    deptAgg.forEach((d: { _id: string; count: number }) => {
      usersByDepartment[d._id] = d.count;
    });

    res.json({
      stats: {
        totalUsers,
        activeUsers: totalUsers,
        newUsersToday,
        totalPosts,
        totalMessages,
        usersByRole: roleCounts,
        usersByDepartment
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: Record<string, unknown> = {};
    if (role && role !== 'all') query.role = role;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      users: users.map((u) => ({
        id: u._id,
        username: u.username,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        department: u.department,
        program: u.program,
        branch: u.branch,
        isVerified: u.isVerified,
        createdAt: u.createdAt
      })),
      pagination: { total, pages: Math.ceil(total / Number(limit)), current: Number(page) }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { role, isVerified } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (role && ['user', 'moderator', 'admin'].includes(role)) {
      const requesterRole = (req.user as any)?.role;
      if ((role === 'admin' || role === 'moderator') && requesterRole !== 'superadmin') {
        return res.status(403).json({ message: 'Only super admin can assign admin or moderator roles.' });
      }
      user.role = role;
    }
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();

    res.json({
      message: 'User updated',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user._id!.toString() === (req.user as any)?._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};
