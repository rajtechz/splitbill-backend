import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectMongoDB, isMongoConnected } from './database/mongo.js';
import { store } from './data/store.js';

const startServer = async () => {
  // 1. Connect to MongoDB Compass (splitmate database)
  const connected = await connectMongoDB();
  if (connected) {
    await store.reloadFromMongo();
  }

  // 2. Initialize Express application
  const app = createApp();

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log('\n======================================================');
    console.log('🚀 SplitMate REST API Server is Live!');
    console.log(`📡 Local Server URL:       http://localhost:${config.port}`);
    console.log(`🤖 Android Emulator URL:   http://10.0.2.2:${config.port}/api/v1`);
    console.log(`🍏 iOS Simulator URL:      http://localhost:${config.port}/api/v1`);
    console.log(`❤️  Health Check:           http://localhost:${config.port}/health`);
    console.log(`🌐 Base API Endpoint:      http://localhost:${config.port}/api/v1`);
    console.log(`🍃 MongoDB Compass URI:    ${config.mongoUri}`);
    console.log(`💾 Storage Mode:           MongoDB (Direct Database Engine - Zero Local JSON Files)`);
    console.log('======================================================\n');
  });

  // Handle graceful shutdown
  const shutdown = () => {
    console.log('\n[SplitMate API] Shutting down server gracefully...');
    server.close(() => {
      console.log('[SplitMate API] Server closed successfully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
