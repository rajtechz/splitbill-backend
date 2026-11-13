import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  cancelSubscription,
  getStatus,
  getCheckoutPage,
} from '../controllers/subscription.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Create Razorpay Order
router.post('/razorpay/create-order', requireAuth, createOrder);

// Verify Razorpay Payment Signature & Activate Pro
router.post('/razorpay/verify-payment', requireAuth, verifyPayment);

// Cancel Pro subscription
router.post('/cancel', requireAuth, cancelSubscription);

// Get Pro subscription status
router.get('/status', requireAuth, getStatus);

// Browser / Webview Checkout page
router.get('/razorpay/checkout', getCheckoutPage);

export default router;
