import { Router } from 'express';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  addComment,
} from '../controllers/expense.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getExpenses);
router.post('/', createExpense);
router.get('/:id', getExpenseById);
router.patch('/:id', updateExpense);
router.delete('/:id', deleteExpense);
router.post('/:id/comments', addComment);

export default router;

