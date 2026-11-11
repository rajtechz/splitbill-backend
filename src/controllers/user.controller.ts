import { Response } from 'express';
import { AuthenticatedRequest, PhoneContactInput } from '../types/index.js';
import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { storageProvider, currencyService } from '../services/providers/index.js';

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || 'usr_me';
  const user = store.findUserById(currentUserId) || req.user;
  if (!user) {
    return sendError(res, 'User session not found', 404, 'NOT_FOUND');
  }
  const { passwordHash: _, mPin: __, ...safeUser } = user;
  return sendSuccess(res, safeUser);
};

export const updateMe = async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || 'usr_me';
  const { name, phoneNumber, upiId, avatarUrl, defaultCurrency, country } = req.body;

  const updated = store.updateUser(currentUserId, {
    ...(name ? { name } : {}),
    ...(phoneNumber !== undefined ? { phoneNumber } : {}),
    ...(upiId !== undefined ? { upiId } : {}),
    ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    ...(defaultCurrency ? { defaultCurrency } : {}),
    ...(country ? { country } : {}),
  });

  if (!updated) {
    return sendError(res, 'Failed to update user', 404, 'NOT_FOUND');
  }

  const { passwordHash: _, mPin: __, ...safeUser } = updated;
  return sendSuccess(res, safeUser, 'Profile updated successfully');
};

export const uploadAvatar = async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || 'usr_me';
  const { base64, mimeType } = req.body;

  if (!base64) {
    return sendError(res, 'Base64 image data is required', 400, 'VALIDATION_ERROR');
  }

  const avatarUrl = await storageProvider.uploadBase64(base64, `avatar_${currentUserId}`, { mimeType });
  const updated = store.updateUser(currentUserId, { avatarUrl });

  return sendSuccess(res, { avatarUrl, user: updated }, 'Avatar uploaded successfully');
};

export const syncContacts = async (req: AuthenticatedRequest, res: Response) => {
  const { contacts } = req.body as { contacts: PhoneContactInput[] };

  if (!Array.isArray(contacts)) {
    return sendError(res, 'Contacts array is required', 400, 'VALIDATION_ERROR');
  }

  const matches = store.matchContacts(contacts);
  const registeredCount = matches.filter(m => m.isRegistered).length;

  return sendSuccess(res, {
    contacts: matches,
    total: matches.length,
    registeredCount,
  }, `Synced ${matches.length} contacts (${registeredCount} registered on SplitMate)`);
};

export const updateLocationCurrency = async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || 'usr_me';
  const { countryCode } = req.body;

  if (!countryCode) {
    return sendError(res, 'Country code is required (e.g. IN, US, GB)', 400, 'VALIDATION_ERROR');
  }

  const currencyDetail = currencyService.getCurrencyForCountry(countryCode);
  const updated = store.updateUser(currentUserId, {
    country: countryCode.toUpperCase(),
    defaultCurrency: currencyDetail.code,
  });

  return sendSuccess(res, {
    country: countryCode.toUpperCase(),
    currency: currencyDetail,
    user: updated,
  }, `Default currency set to ${currencyDetail.code} (${currencyDetail.symbol}) based on location`);
};

export const getUserById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = store.findUserById(id);

  if (!user) {
    return sendError(res, 'User not found', 404, 'NOT_FOUND');
  }

  const { passwordHash: _, mPin: __, ...safeUser } = user;
  return sendSuccess(res, safeUser);
};
