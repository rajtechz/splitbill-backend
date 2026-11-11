/**
 * SplitMate Flexible Notification Service Provider
 * Supports:
 *  - Mock In-App & Terminal Push Provider (Default - fast, zero external cost, saves to db)
 *  - Firebase Cloud Messaging (FCM) Stub (Plug & play for native push tokens)
 *  - Expo Push Stub (Plug & play for mobile notifications)
 */

import { AppNotification } from '../../types/index.js';
import { store } from '../../data/store.js';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import path from 'path';
import fs from 'fs';

let firebaseInitialized = false;

function initFirebaseAdmin(): boolean {
  if (firebaseInitialized) return true;
  try {
    const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      const sa = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      if (getApps().length === 0) {
        initializeApp({
          credential: cert(sa),
          projectId: sa.project_id || process.env.FIREBASE_PROJECT_ID,
        });
      }
      firebaseInitialized = true;
      console.log(`🔥 [FIREBASE ADMIN] Connected successfully to project: ${sa.project_id}`);
      return true;
    }
  } catch (err: any) {
    console.warn('⚠️ [FIREBASE ADMIN INIT WARN]', err.message);
  }
  return false;
}

export interface PushPayload {
  userId: string;
  type: AppNotification['type'];
  title: string;
  body: string;
  actionData?: Record<string, string>;
}

export interface INotificationProvider {
  sendPush(payload: PushPayload): Promise<{ success: boolean; id: string }>;
  sendBatchPush(payloads: PushPayload[]): Promise<{ success: boolean; count: number }>;
  sendSms(phone: string, message: string): Promise<boolean>;
}

/**
 * Mock Push Notification Provider
 * Saves notification to persistent store and logs to terminal
 */
export class MockNotificationProvider implements INotificationProvider {
  async sendPush(payload: PushPayload): Promise<{ success: boolean; id: string }> {
    const notif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: payload.type,
      recipientId: payload.userId,
      title: payload.title,
      body: payload.body,
      message: payload.body,
      timestamp: new Date().toISOString(),
      read: false,
      actionData: payload.actionData,
    };

    store.createNotification(notif);

    console.log('\n------------------------------------------------------');
    console.log(`🔔 [PUSH NOTIFICATION] Sent to User: ${payload.userId}`);
    console.log(`📌 Title: ${payload.title}`);
    console.log(`💬 Body:  ${payload.body}`);
    console.log('------------------------------------------------------\n');

    return { success: true, id: notif.id };
  }

  async sendBatchPush(payloads: PushPayload[]): Promise<{ success: boolean; count: number }> {
    for (const p of payloads) {
      await this.sendPush(p);
    }
    return { success: true, count: payloads.length };
  }

  async sendSms(phone: string, message: string): Promise<boolean> {
    console.log(`📱 [SMS SERVICE - MOCK] Sent to ${phone}: "${message}"`);
    return true;
  }
}

/**
 * FCM Push Notification Provider with Firebase Admin SDK
 */
export class FcmNotificationProvider implements INotificationProvider {
  private fallback = new MockNotificationProvider();

  constructor() {
    initFirebaseAdmin();
  }

  async sendPush(payload: PushPayload): Promise<{ success: boolean; id: string }> {
    // 1. Save notification in database for the in-app notification center
    const result = await this.fallback.sendPush(payload);

    // 2. If Firebase Admin is initialized, send native push notification
    if (initFirebaseAdmin()) {
      try {
        const topic = `user_${payload.userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        await getMessaging().send({
          topic,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.actionData || {},
        });
        console.log(`🚀 [FCM PUSH DISPATCHED] Sent to topic: ${topic}`);
      } catch (err: any) {
        console.warn('ℹ️ [FCM PUSH NOTICE]', err.message);
      }
    }

    return result;
  }

  async sendBatchPush(payloads: PushPayload[]): Promise<{ success: boolean; count: number }> {
    for (const p of payloads) {
      await this.sendPush(p);
    }
    return { success: true, count: payloads.length };
  }

  async sendSms(phone: string, message: string): Promise<boolean> {
    return this.fallback.sendSms(phone, message);
  }
}

export const getNotificationProvider = (): INotificationProvider => {
  const provider = (process.env.PUSH_PROVIDER || 'fcm').toLowerCase();
  switch (provider) {
    case 'mock':
      return new MockNotificationProvider();
    case 'fcm':
    default:
      return new FcmNotificationProvider();
  }
};

export const notificationProvider: INotificationProvider = getNotificationProvider();

