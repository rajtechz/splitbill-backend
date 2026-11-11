import { CurrencyCode, CurrencyDetail } from '../../types/index.js';

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyDetail> = {
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRateToUSD: 0.012 },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRateToUSD: 1.0 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', exchangeRateToUSD: 1.08 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRateToUSD: 1.28 },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', exchangeRateToUSD: 0.65 },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', exchangeRateToUSD: 0.73 },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', exchangeRateToUSD: 0.76 },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', exchangeRateToUSD: 0.27 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', exchangeRateToUSD: 0.0068 },
};

// ISO 3166-1 alpha-2 country codes mapped to default local currency
const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
  UK: 'GBP',
  AE: 'AED',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  CA: 'CAD',
  AU: 'AUD',
  SG: 'SGD',
  JP: 'JPY',
};

export const EXPENSE_CATEGORIES = [
  { id: 'Food', label: 'Food & Dining', icon: 'food', color: '#F97316' },
  { id: 'Groceries', label: 'Groceries', icon: 'shopping', color: '#10B981' },
  { id: 'Transport', label: 'Transport & Fuel', icon: 'travel', color: '#3B82F6' },
  { id: 'Rent', label: 'House Rent', icon: 'home-cat', color: '#8B5CF6' },
  { id: 'Utilities', label: 'Electricity & Wifi', icon: 'utilities', color: '#EAB308' },
  { id: 'Shopping', label: 'Shopping', icon: 'shopping', color: '#EC4899' },
  { id: 'Entertainment', label: 'Entertainment & Movies', icon: 'entertainment', color: '#6366F1' },
  { id: 'Travel', label: 'Travel & Trips', icon: 'travel', color: '#06B6D4' },
  { id: 'Medical', label: 'Medical & Healthcare', icon: 'medical', color: '#EF4444' },
  { id: 'Other', label: 'General / Other', icon: 'wallet', color: '#64748B' },
];

export const GROUP_CATEGORIES = [
  { id: 'Trip', label: 'Trip / Vacation', icon: 'travel', color: '#06B6D4' },
  { id: 'Home', label: 'Home / Flatmates', icon: 'home-cat', color: '#10B981' },
  { id: 'Couple', label: 'Couple / Partner', icon: 'users', color: '#EC4899' },
  { id: 'Family', label: 'Family', icon: 'users', color: '#8B5CF6' },
  { id: 'Friends', label: 'Friends Squad', icon: 'users', color: '#3B82F6' },
  { id: 'Office', label: 'Office / Colleagues', icon: 'groups', color: '#F97316' },
  { id: 'Other', label: 'Other', icon: 'wallet', color: '#64748B' },
];

export class CurrencyService {
  getAllCurrencies(): CurrencyDetail[] {
    return Object.values(SUPPORTED_CURRENCIES);
  }

  getCurrency(code: string): CurrencyDetail {
    const upper = code.toUpperCase() as CurrencyCode;
    return SUPPORTED_CURRENCIES[upper] || SUPPORTED_CURRENCIES.INR;
  }

  getCurrencyForCountry(countryCode: string): CurrencyDetail {
    const upper = countryCode.trim().toUpperCase();
    const currencyCode = COUNTRY_TO_CURRENCY[upper] || 'INR';
    return this.getCurrency(currencyCode);
  }

  convert(amount: number, from: CurrencyCode, to: CurrencyCode): number {
    if (from === to) return amount;
    const fromRate = SUPPORTED_CURRENCIES[from]?.exchangeRateToUSD || 1;
    const toRate = SUPPORTED_CURRENCIES[to]?.exchangeRateToUSD || 1;
    // Amount in USD = amount * fromRate
    // Amount in Target = (amount * fromRate) / toRate
    const inUSD = amount * fromRate;
    return parseFloat((inUSD / toRate).toFixed(2));
  }
}

export const currencyService = new CurrencyService();

