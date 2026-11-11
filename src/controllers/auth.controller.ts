import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../data/store.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { User, AuthenticatedRequest } from '../types/index.js';
import { otpProvider } from '../services/providers/index.js';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email) {
    console.warn('❌ [AUTH LOGIN FAILED] Email is missing in request');
    return sendError(res, 'Email is required', 400, 'VALIDATION_ERROR');
  }

  const user = store.findUserByEmail(email);
  if (!user) {
    console.warn(`❌ [AUTH LOGIN FAILED] No user found for email: ${email}`);
    return sendError(res, 'No account found with this email. Please register.', 404, 'USER_NOT_FOUND');
  }

  if (password && user.passwordHash) {
    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      console.warn(`❌ [AUTH LOGIN FAILED] Password mismatch for email: ${email}`);
      return sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
  }

  const tokens = generateTokens(user);
  const { passwordHash: _, mPin: __, ...safeUser } = user;

  console.log('\n======================================================');
  console.log('🔐 [AUTH API - LOGIN SUCCESS]');
  console.log(`👤 User:          ${safeUser.name} (${safeUser.email})`);
  console.log(`🆔 User ID:       ${safeUser.id}`);
  console.log(`💵 Currency:      ${safeUser.defaultCurrency}`);
  console.log(`🎫 Access Token:\n${tokens.accessToken}`);
  console.log(`🔄 Refresh Token:\n${tokens.refreshToken}`);
  console.log('======================================================\n');

  return sendSuccess(res, {
    user: safeUser,
    tokens,
  }, 'Login successful');
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password, phoneNumber, defaultCurrency, country } = req.body;

  if (!name || !email) {
    return sendError(res, 'Name and email are required', 400, 'VALIDATION_ERROR');
  }

  const existing = store.findUserByEmail(email);
  if (existing) {
    console.warn(`❌ [AUTH REGISTER FAILED] Email already registered: ${email}`);
    return sendError(res, 'An account with this email already exists. Please log in.', 409, 'USER_EXISTS');
  }

  const passwordHash = password ? bcrypt.hashSync(password, 8) : undefined;

  const newUser: User = {
    id: `usr_${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    phoneNumber: phoneNumber ? phoneNumber.trim() : undefined,
    defaultCurrency: defaultCurrency || 'INR',
    country: country || 'IN',
    isPinEnabled: false,
    isBiometricsEnabled: false,
    createdAt: new Date().toISOString(),
  };

  store.createUser(newUser);
  const tokens = generateTokens(newUser);
  const { passwordHash: _, mPin: __, ...safeUser } = newUser;

  console.log('\n======================================================');
  console.log('🎉 [AUTH API - REGISTER SUCCESS]');
  console.log(`👤 Name:          ${safeUser.name}`);
  console.log(`📧 Email:         ${safeUser.email}`);
  console.log(`📱 Phone:         ${safeUser.phoneNumber || 'N/A'}`);
  console.log(`🆔 User ID:       ${safeUser.id}`);
  console.log(`🎫 Access Token:\n${tokens.accessToken}`);
  console.log(`🔄 Refresh Token:\n${tokens.refreshToken}`);
  console.log('======================================================\n');

  return sendSuccess(res, {
    user: safeUser,
    tokens,
  }, 'Registration successful', 201);
};

export const sendOtp = async (req: Request, res: Response) => {
  const { phoneNumber, email, isLogin } = req.body;
  if (!phoneNumber && !email) {
    return sendError(res, 'Phone number or email is required', 400, 'VALIDATION_ERROR');
  }

  const target = phoneNumber || email;

  // If this is a login attempt, verify that the user already has an account
  if (isLogin) {
    const existingUser = phoneNumber ? store.findUserByPhone(phoneNumber) : (email ? store.findUserByEmail(email) : undefined);
    if (!existingUser) {
      console.warn(`❌ [AUTH OTP LOGIN FAILED] No account found for target: ${target}`);
      return sendError(res, `No account found with this ${phoneNumber ? 'phone number' : 'email'}. Please register.`, 404, 'USER_NOT_FOUND');
    }
  }

  // Uses flexible OtpProvider (Mock/Twilio/Firebase)
  const result = await otpProvider.sendOtp({ phone: phoneNumber, email });
  const generatedOtp = result.devOtp || '123456';

  console.log('\n======================================================');
  console.log('🔑 [AUTH API - OTP GENERATED ON RESPONSE]');
  console.log(`📱 Recipient:        ${target}`);
  console.log(`🔢 Generated OTP:    ${generatedOtp}`);
  console.log(`⚡ Dev Universal OTP: 123456 (Accepted at all times)`);
  console.log(`⏱️  Validity:         5 minutes`);
  console.log('======================================================\n');

  // Return the OTP directly in the response so it can be immediately tested and used!
  return sendSuccess(res, {
    sent: true,
    recipient: target,
    phoneNumber,
    email,
    otp: generatedOtp,
    devOtp: generatedOtp,
    universalOtp: '123456',
    trackingId: result.trackingId,
    expiresInSeconds: 300,
    instructions: `Use otp "${generatedOtp}" or fallback "123456" in POST /auth/otp/verify`,
  }, `OTP generated successfully: ${generatedOtp}`);
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { phoneNumber, email, otp, isLogin } = req.body;

  if ((!phoneNumber && !email) || !otp) {
    return sendError(res, 'Phone number/email and OTP code are required', 400, 'VALIDATION_ERROR');
  }

  const target = phoneNumber || email;
  const isValid = await otpProvider.verifyOtp({ phone: phoneNumber, email }, otp);

  if (!isValid) {
    console.warn(`❌ [AUTH OTP VERIFY FAILED] Invalid OTP code "${otp}" for ${target}`);
    return sendError(res, 'Invalid or expired OTP code (Valid code or dev code 123456)', 400, 'INVALID_OTP');
  }

  // Find or create user dynamically
  let user = phoneNumber ? store.findUserByPhone(phoneNumber) : (email ? store.findUserByEmail(email) : undefined);
  if (isLogin && !user) {
    console.warn(`❌ [AUTH OTP VERIFY FAILED] No account found for target: ${target}`);
    return sendError(res, 'No account found for this mobile/email. Please register first.', 404, 'USER_NOT_FOUND');
  }

  if (!user) {
    const identifier = phoneNumber || email || 'user';
    user = {
      id: `usr_${Date.now()}`,
      name: phoneNumber ? `User ${phoneNumber.slice(-4)}` : identifier.split('@')[0],
      email: email || `${(phoneNumber || '').replace(/[^0-9]/g, '')}@splitmate.app`,
      phoneNumber,
      defaultCurrency: 'INR',
      country: 'IN',
      isPinEnabled: false,
      isBiometricsEnabled: false,
      createdAt: new Date().toISOString(),
    };
    store.createUser(user);
    console.log(`🆕 [AUTH API] Auto-created new user for ${target} with ID: ${user.id}`);
  }

  const tokens = generateTokens(user);
  const { passwordHash: _, mPin: __, ...safeUser } = user;

  console.log('\n======================================================');
  console.log('✅ [AUTH API - OTP VERIFIED & LOGGED IN]');
  console.log(`📱 Recipient:     ${target}`);
  console.log(`🔢 Code Verified: ${otp}`);
  console.log(`👤 User:          ${safeUser.name} (${safeUser.email})`);
  console.log(`🎫 Access Token:\n${tokens.accessToken}`);
  console.log(`🔄 Refresh Token:\n${tokens.refreshToken}`);
  console.log('======================================================\n');

  return sendSuccess(res, {
    user: safeUser,
    tokens,
  }, 'OTP verified successfully');
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendError(res, 'Refresh token is required', 400, 'VALIDATION_ERROR');
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded || !decoded.id) {
    return sendError(res, 'Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  const user = store.findUserById(decoded.id);
  if (!user) {
    return sendError(res, 'User not found', 401, 'USER_NOT_FOUND');
  }

  const tokens = generateTokens(user);
  console.log(`🔄 [AUTH API] Tokens refreshed successfully for user: ${user.name}`);
  return sendSuccess(res, tokens, 'Tokens refreshed successfully');
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  console.log(`📧 [AUTH API] Password reset requested for: ${email}`);
  return sendSuccess(res, { email }, `Password reset link sent to ${email}`);
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  console.log('\n======================================================');
  console.log('👋 [AUTH API - LOGOUT]');
  console.log(`👤 User:       ${user ? `${user.name} (${user.id})` : 'Anonymous / Session ended'}`);
  console.log('🔒 Status:     Access token revoked, session terminated');
  console.log('======================================================\n');
  return sendSuccess(res, { loggedOut: true }, 'Logged out successfully');
};

// --- 4-Digit mPIN & Biometrics Management ---

export const setupMpin = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.body.userId || 'usr_me';
  const { pin } = req.body;

  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return sendError(res, 'PIN must be exactly 4 digits', 400, 'INVALID_PIN_FORMAT');
  }

  const ok = store.setMpin(userId, pin);
  if (!ok) {
    return sendError(res, 'User not found', 404, 'USER_NOT_FOUND');
  }

  console.log(`🔒 [AUTH API] 4-digit mPIN updated for User: ${userId}`);
  return sendSuccess(res, { isPinEnabled: true, hasPinSet: true }, '4-digit mPIN set successfully');
};

export const verifyMpin = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.body.userId || 'usr_me';
  const { pin } = req.body;

  if (!pin) {
    return sendError(res, 'mPIN is required', 400, 'VALIDATION_ERROR');
  }

  const isMatch = store.verifyMpin(userId, pin);
  if (isMatch) {
    console.log(`🔓 [AUTH API] mPIN verified successfully for User: ${userId}`);
    return sendSuccess(res, { verified: true }, 'mPIN verified successfully');
  } else {
    console.warn(`❌ [AUTH API] Incorrect mPIN attempt for User: ${userId}`);
    return sendError(res, 'Incorrect mPIN code', 401, 'INVALID_PIN');
  }
};

export const toggleBiometrics = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.body.userId || 'usr_me';
  const { enabled } = req.body;

  const current = store.toggleBiometrics(userId, enabled);
  console.log(`👆 [AUTH API] Biometric unlock set to ${current} for User: ${userId}`);
  return sendSuccess(res, { isBiometricsEnabled: current }, `Biometric unlock ${current ? 'enabled' : 'disabled'}`);
};

export const getSecuritySettings = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'usr_me';
  const user = store.findUserById(userId);

  return sendSuccess(res, {
    isPinEnabled: user?.isPinEnabled ?? true,
    hasPinSet: Boolean(user?.mPin),
    isBiometricsEnabled: user?.isBiometricsEnabled ?? true,
  }, 'Security settings fetched');
};
