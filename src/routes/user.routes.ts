import { Router } from 'express';
import {
  getMe,
  updateMe,
  uploadAvatar,
  syncContacts,
  updateLocationCurrency,
  getUserById,
} from '../controllers/user.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, updateMe);
router.post('/me/avatar', optionalAuth, uploadAvatar);
router.post('/sync-contacts', optionalAuth, syncContacts);
router.post('/me/location-currency', optionalAuth, updateLocationCurrency);
router.get('/:id', optionalAuth, getUserById);

export default router;
