import { Router } from 'express';
import {
  getSettlements,
  recordSettlement,
  confirmSettlement,
  rejectSettlement,
} from '../controllers/settlement.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getSettlements);
router.post('/', recordSettlement);
router.post('/:id/confirm', confirmSettlement);
router.patch('/:id/confirm', confirmSettlement);
router.post('/:id/reject', rejectSettlement);
router.patch('/:id/reject', rejectSettlement);

export default router;

