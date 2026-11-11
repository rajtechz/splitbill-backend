import mongoose from 'mongoose';
import { config } from '../config/index.js';
import {
  UserModel,
  GroupModel,
  FriendModel,
  ExpenseModel,
  SettlementModel,
  ActivityModel,
  NotificationModel,
} from '../models/index.js';

let isConnected = false;

export const connectMongoDB = async (): Promise<boolean> => {
  try {
    const mongoUri = config.mongoUri;
    console.log(`\n======================================================`);
    console.log(`🍃 [MONGODB] Connecting to MongoDB Compass at:`);
    console.log(`📍 URI: ${mongoUri}`);
    console.log(`======================================================\n`);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`✅ [MONGODB] Connection Established Successfully!`);
    console.log(`📦 Database: splitmate`);

    console.log('\n======================================================');
    console.log('🎉 [MONGODB] SplitMate Direct MongoDB Collections:');
    console.log(`👥 Users:         ${await UserModel.countDocuments()}`);
    console.log(`📂 Groups:        ${await GroupModel.countDocuments()}`);
    console.log(`🤝 Friends:       ${await FriendModel.countDocuments()}`);
    console.log(`💳 Expenses:      ${await ExpenseModel.countDocuments()}`);
    console.log(`⚖️  Settlements:   ${await SettlementModel.countDocuments()}`);
    console.log(`⚡ Activities:    ${await ActivityModel.countDocuments()}`);
    console.log(`🔔 Notifications: ${await NotificationModel.countDocuments()}`);
    console.log('======================================================\n');

    return true;
  } catch (error: any) {
    console.warn(`⚠️ [MONGODB CONNECTION WARNING] Could not connect to MongoDB: ${error.message}`);
    console.warn(`💡 [MONGODB] Ensure MongoDB is running locally on 127.0.0.1:27017 or check MongoDB Compass.`);
    isConnected = false;
    return false;
  }
};

export const isMongoConnected = (): boolean => isConnected;
