import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  sendTestNotification,
} from '../controllers/notification.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', optionalAuth, getNotifications);
router.patch('/read-all', optionalAuth, markAllAsRead);
router.patch('/:id/read', optionalAuth, markAsRead);
router.post('/test-push', optionalAuth, sendTestNotification);

export default router;
