import { Response } from 'express';
import { AuthenticatedRequest, Settlement } from '../types/index.js';
import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { recalculateBalances } from '../services/balance.service.js';
import { notificationProvider } from '../services/providers/index.js';

export const getSettlements = async (req: AuthenticatedRequest, res: Response) => {
  const { groupId } = req.query;
  const settlements = store.getSettlements(groupId as string | undefined);
  return sendSuccess(res, settlements);
};

export const recordSettlement = async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || 'usr_me';
  const data = req.body;

  if (!data.payerId || !data.receiverId || !data.amount) {
    return sendError(res, 'Payer, receiver, and amount are required', 400, 'VALIDATION_ERROR');
  }

  const group = data.groupId ? store.findGroupById(data.groupId) : undefined;

  const newSettlement: Settlement = {
    id: `set_${Date.now()}`,
    groupId: data.groupId || null,
    groupName: data.groupName || group?.name,
    payerId: data.payerId,
    payerName: data.payerName,
    receiverId: data.receiverId,
    receiverName: data.receiverName,
    amount: Number(data.amount),
    currency: data.currency || group?.currency || req.user?.defaultCurrency || 'INR',
    date: data.date || new Date().toISOString(),
    paymentMethod: data.paymentMethod || 'UPI',
    status: data.status || 'CONFIRMED',
    referenceNumber: data.referenceNumber,
    notes: data.notes,
    receiptUri: data.receiptUri,
    createdAt: new Date().toISOString(),
  };

  store.createSettlement(newSettlement);
  recalculateBalances(currentUserId);

  // Send push notification ONLY to payment receiver (never to the payer themselves)
  const isPayerTheReceiver =
    newSettlement.receiverId === currentUserId ||
    (req.user?.name && newSettlement.receiverName.toLowerCase().trim() === req.user.name.toLowerCase().trim());

  if (!isPayerTheReceiver) {
    notificationProvider.sendPush({
      userId: newSettlement.receiverId,
      type: 'payment_received',
      title: 'Payment Received!',
      body: `${newSettlement.payerName} paid you ${newSettlement.currency} ${newSettlement.amount.toLocaleString()} via ${newSettlement.paymentMethod}`,
      actionData: { settlementId: newSettlement.id, groupId: newSettlement.groupId || '' },
    });
  }

  // Log activity
  store.createActivity({
    id: `act_${Date.now()}`,
    type: 'settlement_recorded',
    actorId: currentUserId,
    actorName: req.user?.name || 'Alex Johnson',
    title: 'Payment recorded',
    description: `${newSettlement.payerName} paid ${newSettlement.receiverName} ${newSettlement.currency} ${newSettlement.amount}`,
    timestamp: new Date().toISOString(),
    amount: newSettlement.amount,
    currency: newSettlement.currency,
    groupId: newSettlement.groupId || undefined,
  });

  return sendSuccess(res, newSettlement, 'Settlement recorded successfully', 201);
};

export const confirmSettlement = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = store.updateSettlementStatus(id, 'CONFIRMED');

  if (!updated) {
    return sendError(res, `Settlement ${id} not found`, 404, 'SETTLEMENT_NOT_FOUND');
  }

  recalculateBalances(req.user?.id || 'usr_me');

  // Log activity
  store.createActivity({
    id: `act_${Date.now()}`,
    type: 'settlement_confirmed',
    actorId: req.user?.id || 'usr_me',
    actorName: req.user?.name || 'Alex Johnson',
    title: 'Payment confirmed',
    description: `${updated.payerName} paid ${updated.receiverName} ${updated.currency} ${updated.amount}`,
    timestamp: new Date().toISOString(),
    amount: updated.amount,
    currency: updated.currency,
    groupId: updated.groupId || undefined,
  });

  return sendSuccess(res, updated, 'Settlement confirmed successfully');
};

export const rejectSettlement = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = store.updateSettlementStatus(id, 'REJECTED');

  if (!updated) {
    return sendError(res, `Settlement ${id} not found`, 404, 'SETTLEMENT_NOT_FOUND');
  }

  recalculateBalances(req.user?.id || 'usr_me');

  return sendSuccess(res, updated, 'Settlement rejected');
};

