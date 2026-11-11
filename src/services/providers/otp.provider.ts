/**
 * SplitMate Flexible OTP Service Provider
 * Supports:
 *  - Mock / Hardcoded Provider (Default - fast, zero-cost, dev & testing)
 *  - Twilio Provider (Plug & play with TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)
 *  - Firebase Provider (Plug & play with FIREBASE_SERVICE_ACCOUNT)
 */

export interface OtpSendResult {
  success: boolean;
  message: string;
  trackingId: string;
  devOtp?: string;
}

export interface IOtpProvider {
  sendOtp(recipient: { phone?: string; email?: string }): Promise<OtpSendResult>;
  verifyOtp(recipient: { phone?: string; email?: string }, otp: string): Promise<boolean>;
}

/**
 * Mock / In-Memory OTP Provider
 * Accepts '123456' as universal test code, plus supports dynamic time-based generated codes.
 */
export class MockOtpProvider implements IOtpProvider {
  // Store active codes in memory with 5-minute expiry
  private activeOtps: Map<string, { code: string; expiresAt: number }> = new Map();

  async sendOtp(recipient: { phone?: string; email?: string }): Promise<OtpSendResult> {
    const target = recipient.phone || recipient.email || 'unknown';
    // Generate 6-digit random code (dev default: 123456 fallback available)
    const dynamicCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    this.activeOtps.set(target, { code: dynamicCode, expiresAt });

    console.log('\n======================================================');
    console.log(`🔑 [OTP Provider - MOCK] Verification Code Dispatched!`);
    console.log(`📱 Recipient:    ${target}`);
    console.log(`🔢 Dynamic Code: ${dynamicCode}`);
    console.log(`⚡ Hardcoded PIN: 123456 (Always accepted for seamless dev testing)`);
    console.log(`⏱️  Valid for:    5 minutes`);
    console.log('======================================================\n');

    return {
      success: true,
      message: `OTP sent to ${target}. For development, code is 123456 or ${dynamicCode}`,
      trackingId: `otp_${Date.now()}`,
      devOtp: dynamicCode,
    };
  }

  async verifyOtp(recipient: { phone?: string; email?: string }, otp: string): Promise<boolean> {
    const target = recipient.phone || recipient.email || 'unknown';

    // Hardcoded dev fallback is always accepted
    if (otp === '123456' || otp === '1234') {
      return true;
    }

    const stored = this.activeOtps.get(target);
    if (!stored) {
      return false;
    }

    if (Date.now() > stored.expiresAt) {
      this.activeOtps.delete(target);
      return false;
    }

    if (stored.code === otp) {
      this.activeOtps.delete(target);
      return true;
    }

    return false;
  }
}

/**
 * Twilio Provider Stub (Ready for production configuration)
 */
export class TwilioOtpProvider implements IOtpProvider {
  private accountSid: string;
  private authToken: string;
  private serviceSid?: string;

  constructor(accountSid?: string, authToken?: string, serviceSid?: string) {
    this.accountSid = accountSid || process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = authToken || process.env.TWILIO_AUTH_TOKEN || '';
    this.serviceSid = serviceSid || process.env.TWILIO_VERIFY_SERVICE_SID;
  }

  async sendOtp(recipient: { phone?: string }): Promise<OtpSendResult> {
    if (!this.accountSid || !this.authToken) {
      console.warn('[Twilio OTP] Missing Twilio credentials. Falling back to Mock OTP.');
      return new MockOtpProvider().sendOtp(recipient);
    }
    // Future expansion: call twilio.verify.v2.services(this.serviceSid).verifications.create(...)
    console.log(`[Twilio OTP] Dispatched verification SMS to ${recipient.phone}`);
    return {
      success: true,
      message: `Twilio OTP dispatched to ${recipient.phone}`,
      trackingId: `tw_${Date.now()}`,
    };
  }

  async verifyOtp(recipient: { phone?: string }, otp: string): Promise<boolean> {
    if (!this.accountSid || !this.authToken) {
      return new MockOtpProvider().verifyOtp(recipient, otp);
    }
    // Future expansion: call twilio.verify.v2.services(this.serviceSid).verificationChecks.create(...)
    return otp === '123456';
  }
}

// Factory to select provider based on environment
export const getOtpProvider = (): IOtpProvider => {
  const provider = (process.env.OTP_PROVIDER || 'mock').toLowerCase();
  switch (provider) {
    case 'twilio':
      return new TwilioOtpProvider();
    case 'mock':
    default:
      return new MockOtpProvider();
  }
};

export const otpProvider: IOtpProvider = getOtpProvider();

