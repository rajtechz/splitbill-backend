import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { store } from '../data/store.js';
import { sendSuccess } from '../utils/response.js';

export const search = async (req: AuthenticatedRequest, res: Response) => {
  const query = ((req.query.q as string) || '').trim().toLowerCase();

  if (!query) {
    return sendSuccess(res, { groups: [], friends: [], expenses: [] });
  }

  const groups = store
    .getGroups()
    .filter(g => g.name.toLowerCase().includes(query) || g.category.toLowerCase().includes(query));

  const friends = store
    .getFriends()
    .filter(f => f.name.toLowerCase().includes(query) || f.email.toLowerCase().includes(query));

  const expenses = store
    .getExpenses()
    .filter(
      e =>
        e.title.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query) ||
        (e.notes && e.notes.toLowerCase().includes(query))
    );

  return sendSuccess(res, {
    groups,
    friends,
    expenses,
  });
};

