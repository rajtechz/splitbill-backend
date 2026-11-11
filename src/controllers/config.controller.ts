import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response.js';
import {
  currencyService,
  EXPENSE_CATEGORIES,
  GROUP_CATEGORIES,
} from '../services/providers/currency.provider.js';

export const getCurrencies = (_req: Request, res: Response) => {
  const currencies = currencyService.getAllCurrencies();
  return sendSuccess(res, currencies, 'Supported currencies list');
};

export const getCurrencyByCountry = (req: Request, res: Response) => {
  const { code } = req.params;
  const currency = currencyService.getCurrencyForCountry(code || 'IN');
  return sendSuccess(res, currency, `Currency for country ${code}`);
};

export const getCategories = (_req: Request, res: Response) => {
  return sendSuccess(res, {
    expenses: EXPENSE_CATEGORIES,
    groups: GROUP_CATEGORIES,
  }, 'Expense and group categories');
};

export const getFeatureFlags = (_req: Request, res: Response) => {
  return sendSuccess(res, {
    otpProvider: process.env.OTP_PROVIDER || 'mock',
    pushProvider: process.env.PUSH_PROVIDER || 'mock',
    storageProvider: process.env.STORAGE_PROVIDER || 'local',
    biometricsSupported: true,
    mPinEnabled: true,
    debtSimplificationEnabled: true,
    version: '1.0.0',
  }, 'System configuration and feature flags');
};

