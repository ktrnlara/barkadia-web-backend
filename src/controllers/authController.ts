import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { generateToken } from '../utils/generateToken';

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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
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

    // Update fields
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
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
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

    // Only superadmin can assign admin or moderator roles
    if ((assignedRole === 'admin' || assignedRole === 'moderator') && requesterRole !== 'superadmin') {
      return res.status(403).json({ message: 'Only super admin can assign admin or moderator roles.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Create new user with specified role
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
      isVerified: true // Admin-created users are automatically verified
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
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Admin user creation error:', error);
    res.status(500).json({ message: 'Server error during admin user creation' });
  }
};
