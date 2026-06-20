import jwt, { SignOptions } from 'jsonwebtoken';
import { getJwtSecret } from './jwtSecret';

export const generateToken = (userId: string): string => {
  const expiresIn = (process.env.JWT_EXPIRE || '7d') as SignOptions['expiresIn'];
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn });
};
