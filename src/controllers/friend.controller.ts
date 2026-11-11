import { Response } from 'express';
import { AuthenticatedRequest, Friend } from '../types/index.js';
import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { recalculateBalances } from '../services/balance.service.js';

export const getFriends = async (req: AuthenticatedRequest, res: Response) => {
  recalculateBalances(req.user?.id || 'usr_me');
  const friends = store.getFriends();
  return sendSuccess(res, friends);
};

export const addFriend = async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, phoneNumber, upiId, avatarUrl } = req.body;

  if (!name || (!email && !phoneNumber)) {
    return sendError(res, 'Name and either email or phone are required', 400, 'VALIDATION_ERROR');
  }

  const newFriend: Friend = {
    id: `f_${Date.now()}`,
    userId: `usr_${Date.now()}`,
    name: name.trim(),
    email: (email || `${Date.now()}@splitmate.app`).trim().toLowerCase(),
    phoneNumber,
    upiId,
    avatarUrl,
    netBalance: 0,
    createdAt: new Date().toISOString(),
  };

  store.createFriend(newFriend);

  return sendSuccess(res, newFriend, 'Friend added successfully', 201);
};

export const removeFriend = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = store.deleteFriend(id);

  if (!success) {
    return sendError(res, `Friend ${id} not found`, 404, 'FRIEND_NOT_FOUND');
  }

  return sendSuccess(res, { deleted: true }, 'Friend removed successfully');
};

