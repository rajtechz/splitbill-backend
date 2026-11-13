import mongoose, { Schema } from 'mongoose';
import {
  User,
  Group,
  Friend,
  Expense,
  Settlement,
  Activity,
  AppNotification,
} from '../types/index.js';

// 1. User Schema
const UserSchema = new Schema<User>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String },
    phoneNumber: { type: String, index: true },
    upiId: { type: String },
    avatarUrl: { type: String },
    defaultCurrency: { type: String, default: 'INR' },
    country: { type: String, default: 'IN' },
    mPin: { type: String, default: '1234' },
    isPinEnabled: { type: Boolean, default: false },
    isBiometricsEnabled: { type: Boolean, default: false },
    subscriptionTier: { type: String, enum: ['free', 'pro'], default: 'free' },
    subscriptionExpiresAt: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
  },
  { timestamps: false, versionKey: false }
);

// 2. Group Schema
const GroupSchema = new Schema<Group>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, default: 'Other' },
    currency: { type: String, default: 'INR' },
    avatarUrl: { type: String },
    membersCount: { type: Number, default: 0 },
    totalSpending: { type: Number, default: 0 },
    userBalance: { type: Number, default: 0 },
    members: [
      {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        avatarUrl: { type: String },
        role: { type: String, default: 'member' },
        joinedAt: { type: String, required: true },
        netBalance: { type: Number, default: 0 },
      },
    ],
    createdBy: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
    archived: { type: Boolean, default: false },
  },
  { timestamps: false, versionKey: false }
);

// 3. Friend Schema
const FriendSchema = new Schema<Friend>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String },
    upiId: { type: String },
    avatarUrl: { type: String },
    netBalance: { type: Number, default: 0 },
    createdAt: { type: String, required: true },
  },
  { timestamps: false, versionKey: false }
);

// 4. Expense Schema
const ExpenseSchema = new Schema<Expense>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    date: { type: String, required: true },
    category: { type: String, default: 'Other' },
    groupId: { type: String, default: null, index: true },
    groupName: { type: String },
    notes: { type: String },
    receiptUri: { type: String },
    createdBy: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
    splitMethod: { type: String, default: 'EQUAL' },
    participants: [
      {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        paidAmount: { type: Number, default: 0 },
        shareAmount: { type: Number, default: 0 },
        netBalance: { type: Number, default: 0 },
        percentage: { type: Number },
        shares: { type: Number },
        exactAmount: { type: Number },
      },
    ],
    commentsCount: { type: Number, default: 0 },
    comments: [
      {
        id: { type: String },
        expenseId: { type: String },
        userId: { type: String },
        userName: { type: String },
        userAvatar: { type: String },
        text: { type: String },
        createdAt: { type: String },
      },
    ],
  },
  { timestamps: false, versionKey: false }
);

// 5. Settlement Schema
const SettlementSchema = new Schema<Settlement>(
  {
    id: { type: String, required: true, unique: true, index: true },
    groupId: { type: String, default: null, index: true },
    groupName: { type: String },
    payerId: { type: String, required: true },
    payerName: { type: String, required: true },
    receiverId: { type: String, required: true },
    receiverName: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    date: { type: String, required: true },
    paymentMethod: { type: String, default: 'UPI' },
    status: { type: String, default: 'CONFIRMED' },
    referenceNumber: { type: String },
    notes: { type: String },
    receiptUri: { type: String },
    createdAt: { type: String, required: true },
  },
  { timestamps: false, versionKey: false }
);

// 6. Activity Schema
const ActivitySchema = new Schema<Activity>(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    actorId: { type: String, required: true },
    actorName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    timestamp: { type: String, required: true },
    amount: { type: Number },
    currency: { type: String },
    groupId: { type: String },
    expenseId: { type: String },
  },
  { timestamps: false, versionKey: false }
);

// 7. Notification Schema
const NotificationSchema = new Schema<AppNotification>(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    recipientId: { type: String, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    message: { type: String },
    timestamp: { type: String, required: true },
    read: { type: Boolean, default: false },
    actionData: { type: Schema.Types.Mixed },
  },
  { timestamps: false, versionKey: false }
);

export const UserModel = mongoose.models.User || mongoose.model<User>('User', UserSchema, 'users');
export const GroupModel = mongoose.models.Group || mongoose.model<Group>('Group', GroupSchema, 'groups');
export const FriendModel = mongoose.models.Friend || mongoose.model<Friend>('Friend', FriendSchema, 'friends');
export const ExpenseModel = mongoose.models.Expense || mongoose.model<Expense>('Expense', ExpenseSchema, 'expenses');
export const SettlementModel = mongoose.models.Settlement || mongoose.model<Settlement>('Settlement', SettlementSchema, 'settlements');
export const ActivityModel = mongoose.models.Activity || mongoose.model<Activity>('Activity', ActivitySchema, 'activities');
export const NotificationModel = mongoose.models.Notification || mongoose.model<AppNotification>('Notification', NotificationSchema, 'notifications');
