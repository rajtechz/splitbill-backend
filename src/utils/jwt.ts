import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthTokens, User } from '../types/index.js';

export const generateTokens = (user: User): AuthTokens => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  const accessOptions: SignOptions = {
    expiresIn: config.jwtExpiresIn as any,
  };

  const refreshOptions: SignOptions = {
    expiresIn: config.jwtRefreshExpiresIn as any,
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, accessOptions);
  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, refreshOptions);

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600,
  };
};

export const verifyAccessToken = (token: string): any => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, config.jwtRefreshSecret);
  } catch {
    return null;
  }
};

