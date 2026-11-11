import { Router } from 'express';
import {
  login,
  register,
  sendOtp,
  verifyOtp,
  refreshToken,
  forgotPassword,
  logout,
  setupMpin,
  verifyMpin,
  toggleBiometrics,
  getSecuritySettings,
} from '../controllers/auth.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/logout', optionalAuth, logout);
router.get('/logout', optionalAuth, logout);

// 4-Digit mPIN & Biometrics
router.post('/mpin/setup', optionalAuth, setupMpin);
router.post('/mpin/verify', optionalAuth, verifyMpin);
router.post('/mpin/toggle-biometrics', optionalAuth, toggleBiometrics);
router.get('/security', optionalAuth, getSecuritySettings);

export default router;
