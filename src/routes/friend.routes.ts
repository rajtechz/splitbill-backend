import { Router } from 'express';
import { getFriends, addFriend, removeFriend } from '../controllers/friend.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getFriends);
router.post('/', addFriend);
router.delete('/:id', removeFriend);

export default router;

