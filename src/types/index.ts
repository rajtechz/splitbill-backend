import { Request } from 'express';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD' | 'SGD' | 'AED' | 'JPY';

export type GroupCategory =
  | 'Trip'
  | 'Home'
  | 'Couple'
  | 'Family'
  | 'Friends'
  | 'Office'
  | 'Other';

export type ExpenseCategory =
  | 'Food'
  | 'Groceries'
  | 'Transport'
  | 'Rent'
  | 'Utilities'
  | 'Shopping'
  | 'Entertainment'
  | 'Travel'
  | 'Medical'
  | 'Other';

export type SplitMethod =
  | 'EQUAL'
  | 'EXACT'
  | 'PERCENTAGE'
  | 'SHARES'
  | 'ADJUSTMENT';

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank transfer' | 'Other';

export type SettlementStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  phoneNumber?: string;
  upiId?: string;
  avatarUrl?: string;
  defaultCurrency: CurrencyCode;
  country?: string;
  mPin?: string;
  isPinEnabled?: boolean;
  isBiometricsEnabled?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PhoneContactInput {
  name: string;
  phoneNumber?: string;
  email?: string;
}

export interface MatchedContact {
  contactName: string;
  phoneNumber?: string;
  email?: string;
  isRegistered: boolean;
  user?: Omit<User, 'passwordHash' | 'mPin'>;
}

export interface CurrencyDetail {
  code: CurrencyCode;
  name: string;
  symbol: string;
  exchangeRateToUSD: number;
}

export interface GroupMember {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'member';
  joinedAt: string;
  netBalance?: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  category: GroupCategory;
  currency: CurrencyCode;
  avatarUrl?: string;
  membersCount: number;
  totalSpending: number;
  userBalance: number;
  members: GroupMember[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  archived?: boolean;
}

export interface Friend {
  id: string;
  userId: string;
  name: string;
  email: string;
  phoneNumber?: string;
  upiId?: string;
  avatarUrl?: string;
  netBalance: number;
  createdAt: string;
}

export interface ExpenseParticipant {
  userId: string;
  name: string;
  paidAmount: number;
  shareAmount: number;
  netBalance: number;
  percentage?: number;
  shares?: number;
  exactAmount?: number;
}

export interface ExpenseComment {
  id: string;
  expenseId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  totalAmount: number;
  currency: CurrencyCode;
  date: string;
  category: ExpenseCategory;
  groupId?: string | null;
  groupName?: string;
  notes?: string;
  receiptUri?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  splitMethod: SplitMethod;
  participants: ExpenseParticipant[];
  commentsCount?: number;
  comments?: ExpenseComment[];
}

export interface Settlement {
  id: string;
  groupId?: string | null;
  groupName?: string;
  payerId: string;
  payerName: string;
  receiverId: string;
  receiverName: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  paymentMethod: PaymentMethod;
  status: SettlementStatus;
  referenceNumber?: string;
  notes?: string;
  receiptUri?: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  type:
    | 'expense_created'
    | 'expense_updated'
    | 'expense_deleted'
    | 'settlement_recorded'
    | 'settlement_confirmed'
    | 'settlement_rejected'
    | 'member_added'
    | 'group_created';
  actorId: string;
  actorName: string;
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  currency?: CurrencyCode;
  groupId?: string;
  expenseId?: string;
}

export interface AppNotification {
  id: string;
  recipientId?: string;
  type:
    | 'expense_added'
    | 'expense_updated'
    | 'payment_received'
    | 'payment_reminder'
    | 'group_invite'
    | 'friend_invite';
  title: string;
  body: string;
  message?: string;
  timestamp: string;
  read: boolean;
  actionData?: Record<string, string>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  tokens: AuthTokens;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

