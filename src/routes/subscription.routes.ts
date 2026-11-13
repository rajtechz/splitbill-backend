import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  cancelSubscription,
  getStatus,
  getCheckoutPage,
  getSuccessPage,
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

// Browser Success Callback page
router.get('/razorpay/success', getSuccessPage);

export default router;

