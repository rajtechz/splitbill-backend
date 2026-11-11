import { connectMongoDB } from './mongo.js';
import {
  UserModel,
  GroupModel,
  FriendModel,
  ExpenseModel,
  SettlementModel,
  ActivityModel,
  NotificationModel,
} from '../models/index.js';
import mongoose from 'mongoose';

const checkMongoStatus = async () => {
  console.log('🍃 Connecting to MongoDB Compass at 127.0.0.1:27017/splitmate...');
  const ok = await connectMongoDB();
  if (!ok) {
    console.error('❌ Failed to connect to MongoDB');
    process.exit(1);
  }

  console.log('\n📊 SplitMate Direct MongoDB Collections Status:');
  console.log(`📍 URI:        mongodb://127.0.0.1:27017/splitmate`);
  console.log(`📦 Database:   splitmate`);
  console.log('------------------------------------------------------');
  console.log(`👥 users:         ${await UserModel.countDocuments()}`);
  console.log(`📂 groups:        ${await GroupModel.countDocuments()}`);
  console.log(`🤝 friends:       ${await FriendModel.countDocuments()}`);
  console.log(`💳 expenses:      ${await ExpenseModel.countDocuments()}`);
  console.log(`⚖️  settlements:   ${await SettlementModel.countDocuments()}`);
  console.log(`⚡ activities:    ${await ActivityModel.countDocuments()}`);
  console.log(`🔔 notifications: ${await NotificationModel.countDocuments()}`);
  console.log('------------------------------------------------------');
  console.log('🎉 100% Direct MongoDB engine active (Zero db.json file storage).\n');

  await mongoose.disconnect();
  process.exit(0);
};

checkMongoStatus().catch(err => {
  console.error(err);
  process.exit(1);
});
