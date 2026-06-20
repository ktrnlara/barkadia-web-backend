import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { generateToken } from '../utils/generateToken';
import { buildLoginQuery, normalizeLoginIdentifier } from '../utils/loginIdentifier';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, firstName, lastName, studentId, yearLevel, department, program, branch } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Public signup always creates a regular user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      studentId,
      yearLevel,
      department,
      program,
      branch,
      role: 'user'
    });

    await user.save();

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
        yearLevel: user.yearLevel,
        department: user.department,
        program: user.program,
        branch: user.branch,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        isVerified: user.isVerified
      }
    });
  } catch (error: unknown) {
    console.error('Registration error:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationError = error as Error & { errors?: Record<string, { message: string }> };
      const messages = Object.values(validationError.errors || {}).map((e) => e.message);
      return res.status(400).json({
        message: messages.join('. ') || 'Validation failed',
        errors: messages,
      });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, email, username, password } = req.body;
    const loginId = normalizeLoginIdentifier(identifier ?? email ?? username);

    if (!loginId || !password) {
      return res.status(400).json({ message: 'Email/username and password are required' });
    }

    const query = buildLoginQuery(loginId);
    if (!query) {
      return res.status(400).json({ message: 'Email/username and password are required' });
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
        yearLevel: user.yearLevel,
        department: user.department,
        program: user.program,
        branch: user.branch,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, bio, yearLevel, department, program, branch } = req.body;

    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (yearLevel) user.yearLevel = yearLevel;
    if (department) user.department = department;
    if (program) user.program = program;
    if (branch) user.branch = branch;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
        yearLevel: user.yearLevel,
        department: user.department,
        program: user.program,
        branch: user.branch,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error updating password' });
  }
};

// Create user with elevated role (admin panel — superadmin assigns admin/moderator)
export const createAdminUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, firstName, lastName, studentId, yearLevel, department, program, branch, role } = req.body;
    const requesterRole = (req.user as IUser)?.role;
    const assignedRole = role || 'user';

    if (!['user', 'moderator', 'admin'].includes(assignedRole)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    if ((assignedRole === 'admin' || assignedRole === 'moderator') && requesterRole !== 'superadmin') {
      return res.status(403).json({ message: 'Only super admin can assign admin or moderator roles.' });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken',
      });
    }

    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      studentId,
      yearLevel,
      department,
      program,
      branch,
      role: assignedRole,
      isVerified: true,
    });

    await user.save();

    res.status(201).json({
      message: `${assignedRole} user created successfully`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
        yearLevel: user.yearLevel,
        department: user.department,
        program: user.program,
        branch: user.branch,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Admin user creation error:', error);
    res.status(500).json({ message: 'Server error during admin user creation' });
  }
};
