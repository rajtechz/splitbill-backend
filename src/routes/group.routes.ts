import { Router } from 'express';
import {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
} from '../controllers/group.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getGroups);
router.post('/', createGroup);
router.get('/:id', getGroupById);
router.patch('/:id', updateGroup);
router.delete('/:id', deleteGroup);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

export default router;

