import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import groupRoutes from './group.routes.js';
import friendRoutes from './friend.routes.js';
import expenseRoutes from './expense.routes.js';
import settlementRoutes from './settlement.routes.js';
import activityRoutes from './activity.routes.js';
import notificationRoutes from './notification.routes.js';
import searchRoutes from './search.routes.js';
import configRoutes from './config.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import { logout } from '../controllers/auth.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.post('/logout', optionalAuth, logout);
apiRouter.get('/logout', optionalAuth, logout);
apiRouter.use('/users', userRoutes);
apiRouter.use('/subscriptions', subscriptionRoutes);
apiRouter.use('/groups', groupRoutes);
apiRouter.use('/friends', friendRoutes);
apiRouter.use('/expenses', expenseRoutes);
apiRouter.use('/settlements', settlementRoutes);
apiRouter.use('/activities', activityRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/config', configRoutes);

export default apiRouter;
