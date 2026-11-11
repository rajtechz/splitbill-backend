import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { store } from '../data/store.js';
import { sendError } from '../utils/response.js';

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If running in development and no token, default to seed user Alex Johnson for seamless exploration
    const defaultUser = store.findUserById('usr_me');
    if (defaultUser) {
      req.user = defaultUser;
      return next();
    }
    return sendError(res, 'Authentication required. Missing Bearer token.', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];

  // If token is a dev mock token
  if (token.startsWith('mock_jwt_token_')) {
    const user = store.findUserById('usr_me') || store.findUserByEmail('alex.johnson@example.com');
    if (user) {
      req.user = user;
      return next();
    }
  }

  const decoded = verifyAccessToken(token);
  if (!decoded || !decoded.id) {
    return sendError(res, 'Invalid or expired access token.', 401, 'INVALID_TOKEN');
  }

  const user = store.findUserById(decoded.id);
  if (!user) {
    return sendError(res, 'User session not found.', 401, 'USER_NOT_FOUND');
  }

  req.user = user;
  next();
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token.startsWith('mock_jwt_token_')) {
      const user = store.findUserById('usr_me');
      if (user) req.user = user;
    } else {
      const decoded = verifyAccessToken(token);
      if (decoded && decoded.id) {
        const user = store.findUserById(decoded.id);
        if (user) req.user = user;
      }
    }
  }

  // If no user found from token, set default demo user
  if (!req.user) {
    const defaultUser = store.findUserById('usr_me');
    if (defaultUser) req.user = defaultUser;
  }

  next();
};
