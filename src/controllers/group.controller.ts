import { Response } from 'express';
import { AuthenticatedRequest, Group, GroupMember } from '../types/index.js';
import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { recalculateBalances } from '../services/balance.service.js';

export const getGroups = async (req: AuthenticatedRequest, res: Response) => {
  recalculateBalances(req.user?.id || 'usr_me');
  const groups = store.getGroups();
  return sendSuccess(res, groups);
};

export const getGroupById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  recalculateBalances(req.user?.id || 'usr_me');
  const group = store.findGroupById(id);

  if (!group) {
    return sendError(res, `Group ${id} not found`, 404, 'GROUP_NOT_FOUND');
  }

  return sendSuccess(res, group);
};

export const createGroup = async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || 'usr_me';
  const { name, description, category, currency, members } = req.body;

  if (!name) {
    return sendError(res, 'Group name is required', 400, 'VALIDATION_ERROR');
  }

  const initialMembers: GroupMember[] = members && members.length > 0
    ? members.map((m: any) => ({
        userId: m.userId,
        name: m.name,
        email: m.email || '',
        avatarUrl: m.avatarUrl,
        role: m.role || 'member',
        joinedAt: m.joinedAt || new Date().toISOString(),
        netBalance: 0,
      }))
    : [
        {
          userId: currentUserId,
          name: req.user?.name || 'Alex Johnson',
          email: req.user?.email || 'alex@example.com',
          avatarUrl: req.user?.avatarUrl,
          role: 'admin',
          joinedAt: new Date().toISOString(),
          netBalance: 0,
        },
      ];

  const newGroup: Group = {
    id: `grp_${Date.now()}`,
    name: name.trim(),
    description: description ? description.trim() : undefined,
    category: category || 'Trip',
    currency: currency || req.user?.defaultCurrency || 'INR',
    createdBy: currentUserId,
    createdAt: new Date().toISOString(),
    membersCount: initialMembers.length,
    totalSpending: 0,
    userBalance: 0,
    members: initialMembers,
  };

  store.createGroup(newGroup);

  // Log activity
  store.createActivity({
    id: `act_${Date.now()}`,
    type: 'group_created',
    actorId: currentUserId,
    actorName: req.user?.name || 'Alex Johnson',
    title: `Created group "${newGroup.name}"`,
    description: `${initialMembers.length} members joined`,
    timestamp: new Date().toISOString(),
    groupId: newGroup.id,
  });

  return sendSuccess(res, newGroup, 'Group created successfully', 201);
};

export const updateGroup = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const updated = store.updateGroup(id, updates);
  if (!updated) {
    return sendError(res, `Group ${id} not found`, 404, 'GROUP_NOT_FOUND');
  }

  return sendSuccess(res, updated, 'Group updated successfully');
};

export const deleteGroup = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = store.deleteGroup(id);

  if (!success) {
    return sendError(res, `Group ${id} not found`, 404, 'GROUP_NOT_FOUND');
  }

  return sendSuccess(res, { deleted: true }, 'Group deleted successfully');
};

export const addMember = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const memberData = req.body;

  if (!memberData.userId || !memberData.name) {
    return sendError(res, 'Member userId and name are required', 400, 'VALIDATION_ERROR');
  }

  const member: GroupMember = {
    userId: memberData.userId,
    name: memberData.name,
    email: memberData.email || '',
    avatarUrl: memberData.avatarUrl,
    role: memberData.role || 'member',
    joinedAt: new Date().toISOString(),
    netBalance: 0,
  };

  const updated = store.addGroupMember(id, member);
  if (!updated) {
    return sendError(res, `Group ${id} not found`, 404, 'GROUP_NOT_FOUND');
  }

  // Log activity
  store.createActivity({
    id: `act_${Date.now()}`,
    type: 'member_added',
    actorId: req.user?.id || 'usr_me',
    actorName: req.user?.name || 'Alex Johnson',
    title: `Added ${member.name} to "${updated.name}"`,
    description: `New member joined`,
    timestamp: new Date().toISOString(),
    groupId: id,
  });

  return sendSuccess(res, updated, 'Member added successfully');
};

export const removeMember = async (req: AuthenticatedRequest, res: Response) => {
  const { id, userId } = req.params;

  const updated = store.removeGroupMember(id, userId);
  if (!updated) {
    return sendError(res, `Group ${id} not found`, 404, 'GROUP_NOT_FOUND');
  }

  return sendSuccess(res, updated, 'Member removed successfully');
};

