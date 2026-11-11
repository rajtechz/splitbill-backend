import { Response } from 'express';
import { AuthenticatedRequest, Expense, ExpenseComment } from '../types/index.js';
import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { recalculateBalances } from '../services/balance.service.js';
import { notificationProvider } from '../services/providers/index.js';

export const getExpenses = async (req: AuthenticatedRequest, res: Response) => {
  const { groupId } = req.query;
  const expenses = store.getExpenses(groupId as string | undefined);
  return sendSuccess(res, expenses);
};

export const getExpenseById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const expense = store.findExpenseById(id);

  if (!expense) {
    return sendError(res, `Expense ${id} not found`, 404, 'EXPENSE_NOT_FOUND');
  }

  return sendSuccess(res, expense);
};

export const createExpense = async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || 'usr_me';
  const data = req.body;

  if (!data.title || !data.totalAmount) {
    return sendError(res, 'Expense title and total amount are required', 400, 'VALIDATION_ERROR');
  }

  const group = data.groupId ? store.findGroupById(data.groupId) : undefined;

  const newExpense: Expense = {
    id: `exp_${Date.now()}`,
    title: data.title.trim(),
    totalAmount: Number(data.totalAmount),
    currency: data.currency || group?.currency || req.user?.defaultCurrency || 'INR',
    date: data.date || new Date().toISOString(),
    category: data.category || 'Other',
    groupId: data.groupId || null,
    groupName: data.groupName || group?.name,
    notes: data.notes,
    receiptUri: data.receiptUri,
    createdBy: currentUserId,
    createdAt: new Date().toISOString(),
    splitMethod: data.splitMethod || 'EQUAL',
    participants: data.participants || [],
    commentsCount: 0,
    comments: [],
  };

  store.createExpense(newExpense);

  // Recalculate group and friend balances
  recalculateBalances(currentUserId);

  // Send push notification to other participants dynamically (never to the creator)
  const creatorName = (req.user?.name || '').toLowerCase().trim();
  for (const p of newExpense.participants) {
    const isCreator =
      p.userId === currentUserId ||
      (creatorName && (p.name || '').toLowerCase().trim() === creatorName);

    if (!isCreator && p.shareAmount > 0) {
      notificationProvider.sendPush({
        userId: p.userId,
        type: 'expense_added',
        title: `New Expense: ${newExpense.title}`,
        body: `${req.user?.name || 'A group member'} added "${newExpense.title}". Your share is ${newExpense.currency} ${p.shareAmount.toLocaleString()}`,
        actionData: { expenseId: newExpense.id, groupId: newExpense.groupId || '' },
      });
    }
  }

  // Log activity
  store.createActivity({
    id: `act_${Date.now()}`,
    type: 'expense_created',
    actorId: currentUserId,
    actorName: req.user?.name || 'Alex Johnson',
    title: `Added "${newExpense.title}"`,
    description: `Total: ${newExpense.currency} ${newExpense.totalAmount.toLocaleString()}`,
    timestamp: new Date().toISOString(),
    amount: newExpense.totalAmount,
    currency: newExpense.currency,
    groupId: newExpense.groupId || undefined,
    expenseId: newExpense.id,
  });

  return sendSuccess(res, newExpense, 'Expense created successfully', 201);
};

const canModifyExpense = (
  expense: Expense,
  user?: { id: string; name?: string; email?: string }
): boolean => {
  if (!user) return false;
  const currentUserId = user.id;
  const currentUserName = (user.name || '').toLowerCase().trim();

  // 1. Creator of the expense
  if (expense.createdBy === currentUserId) return true;
  if (currentUserName && (expense.createdBy || '').toLowerCase().trim() === currentUserName) return true;

  // 2. Main payer of the expense (the person who paid money up front)
  const isPayer = expense.participants.some(p => {
    if (p.paidAmount > 0) {
      if (p.userId === currentUserId) return true;
      if (currentUserName && (p.name || '').toLowerCase().trim() === currentUserName) return true;
    }
    return false;
  });

  return isPayer;
};

export const updateExpense = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const existing = store.findExpenseById(id);
  if (!existing) {
    return sendError(res, `Expense ${id} not found`, 404, 'EXPENSE_NOT_FOUND');
  }

  // Security check: Only creator or payer can edit
  if (!canModifyExpense(existing, req.user)) {
    return sendError(
      res,
      'Access Denied: You do not have permission to modify this expense. Only the member who created or paid for this expense can edit it.',
      403,
      'FORBIDDEN'
    );
  }

  const updated = store.updateExpense(id, updates);
  if (!updated) {
    return sendError(res, `Expense ${id} not found`, 404, 'EXPENSE_NOT_FOUND');
  }

  recalculateBalances(req.user?.id || 'usr_me');

  // Log activity
  store.createActivity({
    id: `act_${Date.now()}`,
    type: 'expense_updated',
    actorId: req.user?.id || 'usr_me',
    actorName: req.user?.name || 'Alex Johnson',
    title: `Updated "${updated.title}"`,
    description: `Total: ${updated.currency} ${updated.totalAmount.toLocaleString()}`,
    timestamp: new Date().toISOString(),
    amount: updated.totalAmount,
    currency: updated.currency,
    groupId: updated.groupId || undefined,
    expenseId: id,
  });

  return sendSuccess(res, updated, 'Expense updated successfully');
};

export const deleteExpense = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const target = store.findExpenseById(id);

  if (!target) {
    return sendError(res, `Expense ${id} not found`, 404, 'EXPENSE_NOT_FOUND');
  }

  // Security check: Only creator or payer can delete
  if (!canModifyExpense(target, req.user)) {
    return sendError(
      res,
      'Access Denied: You do not have permission to delete this expense. Only the member who created or paid for this expense can delete it.',
      403,
      'FORBIDDEN'
    );
  }

  store.deleteExpense(id);
  recalculateBalances(req.user?.id || 'usr_me');

  // Log activity
  store.createActivity({
    id: `act_${Date.now()}`,
    type: 'expense_deleted',
    actorId: req.user?.id || 'usr_me',
    actorName: req.user?.name || 'Alex Johnson',
    title: `Deleted "${target.title}"`,
    description: 'Expense was removed',
    timestamp: new Date().toISOString(),
  });

  return sendSuccess(res, { deleted: true }, 'Expense deleted successfully');
};

export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    return sendError(res, 'Comment text is required', 400, 'VALIDATION_ERROR');
  }

  const comment: ExpenseComment = {
    id: `c_${Date.now()}`,
    expenseId: id,
    userId: req.user?.id || 'usr_me',
    userName: req.user?.name || 'Alex Johnson',
    userAvatar: req.user?.avatarUrl,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };

  const updated = store.addCommentToExpense(id, comment);
  if (!updated) {
    return sendError(res, `Expense ${id} not found`, 404, 'EXPENSE_NOT_FOUND');
  }

  return sendSuccess(res, updated, 'Comment added successfully');
};

