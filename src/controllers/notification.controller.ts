import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { notificationProvider } from '../services/providers/index.js';

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || 'usr_me';
  const notifications = store.getNotifications(currentUserId);
  return sendSuccess(res, notifications);
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = store.markNotificationAsRead(id);

  if (!success) {
    return sendError(res, `Notification ${id} not found`, 404, 'NOT_FOUND');
  }

  return sendSuccess(res, { read: true }, 'Notification marked as read');
};

export const markAllAsRead = async (_req: AuthenticatedRequest, res: Response) => {
  store.markAllNotificationsAsRead();
  return sendSuccess(res, { readAll: true }, 'All notifications marked as read');
};

export const sendTestNotification = async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || 'usr_me';
  const { title, body } = req.body;

  const result = await notificationProvider.sendPush({
    userId: currentUserId,
    type: 'payment_reminder',
    title: title || 'SplitMate Balance Reminder',
    body: body || 'You have pending balances in your group expenses.',
  });

  return sendSuccess(res, result, 'Test notification dispatched');
};
