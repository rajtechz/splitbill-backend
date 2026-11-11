import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { store } from '../data/store.js';
import { sendSuccess } from '../utils/response.js';

export const getActivities = async (_req: AuthenticatedRequest, res: Response) => {
  const activities = store.getActivities();
  return sendSuccess(res, activities);
};

