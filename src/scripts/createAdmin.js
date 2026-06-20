const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model - need to compile TypeScript first or use a different approach
// For now, let's create the user directly with mongoose
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  studentId: { type: String, default: '' },
  yearLevel: { type: String, default: '' },
  department: { type: String, default: '' },
  program: { type: String, default: '' },
  branch: { type: String, default: '' },
  role: { type: String, enum: ['user', 'moderator', 'admin', 'superadmin'], default: 'user' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barkadia');
    console.log('Connected to MongoDB');

    // Remove existing admin users
    const deletedAdmins = await User.deleteMany({ role: 'admin' });
    console.log(`Removed ${deletedAdmins.deletedCount} existing admin users`);

    // Remove existing user with this email
    const deletedUser = await User.deleteOne({ email: 'javuhmonster@gmail.com' });
    console.log(`Removed ${deletedUser.deletedCount} existing user with email javuhmonster@gmail.com`);

    // Create super admin account (only role that can assign admins)
    const adminUser = new User({
      username: 'superadmin',
      email: 'javuhmonster@gmail.com',
      password: 'admin123',
      firstName: 'Super',
      lastName: 'Admin',
      studentId: '2022-104800',
      yearLevel: '4th Year',
      department: 'College of Computing & Information Technologies',
      program: 'BS Information Technology',
      branch: 'Manila',
      role: 'superadmin',
      avatar: '',
      bio: 'Barkadia super administrator.',
      isVerified: true
    });

    await adminUser.save();
    console.log('Super admin created successfully!');
    console.log('Email:', adminUser.email);
    console.log('Username:', adminUser.username);
    console.log('Password: admin123');
    console.log('Role:', adminUser.role);
    console.log('Student ID:', adminUser.studentId);
    console.log('Year Level:', adminUser.yearLevel);
    console.log('Program:', adminUser.program);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createAdminUser();
