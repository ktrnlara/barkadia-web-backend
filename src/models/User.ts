import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  studentId?: string;
  yearLevel?: number;
  department?: string;
  program?: string;
  branch?: string;
  role: 'user' | 'moderator' | 'admin' | 'superadmin';
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  studentId: {
    type: String,
    trim: true,
    sparse: true // Allows multiple null values
  },
  yearLevel: {
    type: Number,
    min: 1,
    max: 5
  },
  department: {
    type: String,
    trim: true
  },
  program: {
    type: String,
    trim: true
  },
  branch: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin', 'superadmin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    const password = this.get('password') as string;
    const hashedPassword = await bcrypt.hash(password, salt);
    this.set('password', hashedPassword);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  const password = this.get('password') as string;
  return bcrypt.compare(candidatePassword, password);
};

export default mongoose.model<IUser>('User', UserSchema);
