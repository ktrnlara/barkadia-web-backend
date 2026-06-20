import jwt from 'jsonwebtoken';

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  
  return jwt.sign(
    { userId },
    secret,
    { expiresIn: '7d' }
  );
};
