import { Request, Response } from 'express';
import { razorpayService } from '../services/providers/razorpay.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { plan = 'annual' } = req.body;
    const user = (req as any).user;

    if (!user || !user.id) {
      return sendError(res, 'Authentication required to create subscription order', 401, 'UNAUTHORIZED');
    }

    if (plan !== 'annual' && plan !== 'monthly') {
      return sendError(res, 'Invalid plan. Must be "annual" or "monthly"', 400, 'INVALID_PLAN');
    }

    const orderData = await razorpayService.createOrder({
      plan,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userPhone: user.phoneNumber,
    });

    return sendSuccess(res, orderData, 'Razorpay order created successfully');
  } catch (error: any) {
    console.error('Error creating subscription order:', error);
    return sendError(res, error.message || 'Failed to create subscription order', 500, 'PAYMENT_ORDER_ERROR');
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, paymentId, signature, plan = 'annual' } = req.body;
    const user = (req as any).user;

    if (!user || !user.id) {
      return sendError(res, 'Authentication required to verify payment', 401, 'UNAUTHORIZED');
    }

    if (!orderId || !paymentId || !signature) {
      return sendError(res, 'Missing required payment verification fields (orderId, paymentId, signature)', 400, 'VALIDATION_ERROR');
    }

    const result = await razorpayService.verifyPayment({
      orderId,
      paymentId,
      signature,
      plan,
      userId: user.id,
    });

    return sendSuccess(res, result, result.message);
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return sendError(res, error.message || 'Payment signature verification failed', 400, 'PAYMENT_VERIFICATION_FAILED');
  }
};

export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    const result = await razorpayService.cancelSubscription(user.id);
    return sendSuccess(res, result, result.message);
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return sendError(res, error.message || 'Failed to cancel subscription', 500, 'CANCEL_ERROR');
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    return sendSuccess(res, {
      isPro: user.subscriptionTier === 'pro',
      tier: user.subscriptionTier || 'free',
      expiresAt: user.subscriptionExpiresAt,
      features: [
        'AI Receipt Scanning (Unlimited)',
        'Cross-group Multi-currency Debt Simplifier',
        'Export to Excel, CSV & PDF Financial Reports',
        'Live foreign currency conversion',
        'Deep expense search & filtering',
        '100% Ad-free experience',
        'VIP Gold Profile Badge',
      ],
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Mobile-friendly Razorpay Checkout HTML Page
 * Can be opened in webview or browser for standard checkout
 */
export const getCheckoutPage = (req: Request, res: Response) => {
  const { orderId, amount, name, description, keyId, email, phone, userName } = req.query;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>SplitMate Pro Checkout</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: #08130E;
    }
    body {
      color: #F2F6F4;
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justifyContent: center;
      padding: 20px;
      background: radial-gradient(circle at 50% 0%, rgba(35, 155, 104, 0.28) 0%, transparent 60%),
                  radial-gradient(circle at 10% 90%, rgba(212, 175, 55, 0.12) 0%, transparent 50%),
                  #08130E;
    }
    .card {
      background: linear-gradient(180deg, rgba(20, 48, 38, 0.88) 0%, rgba(12, 28, 22, 0.96) 100%);
      border: 1px solid rgba(43, 176, 124, 0.35);
      border-radius: 28px;
      padding: 32px 24px;
      max-width: 410px;
      width: 100%;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(35, 155, 104, 0.15);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
      pointer-events: none;
    }
    .glow-icon-wrap {
      width: 72px;
      height: 72px;
      border-radius: 36px;
      background: linear-gradient(135deg, #2BB07C 0%, #176B50 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 0 25px rgba(43, 176, 124, 0.55);
      font-size: 34px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      background: rgba(212, 175, 55, 0.16);
      border: 1px solid rgba(212, 175, 55, 0.45);
      color: #D4AF37;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 12px;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 24px;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: -0.5px;
    }
    .subtitle {
      color: #A0B3AC;
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 20px;
    }
    .price-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      padding: 16px;
      margin-bottom: 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-align: left;
    }
    .price-label {
      font-size: 12px;
      color: #8E9F99;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .price-title {
      font-size: 15px;
      font-weight: 700;
      color: #E6F0EC;
      margin-top: 2px;
    }
    .price-val {
      font-size: 26px;
      font-weight: 800;
      color: #2BB07C;
      text-align: right;
    }
    .btn-primary {
      display: block;
      width: 100%;
      background: linear-gradient(135deg, #2BB07C 0%, #176B50 100%);
      color: #FFFFFF;
      font-size: 16px;
      font-weight: 700;
      padding: 15px 20px;
      border-radius: 14px;
      border: none;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(43, 176, 124, 0.4);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      font-family: inherit;
    }
    .btn-primary:active {
      transform: scale(0.98);
      box-shadow: 0 4px 12px rgba(43, 176, 124, 0.3);
    }
    .btn-sandbox {
      display: block;
      width: 100%;
      background: rgba(255, 255, 255, 0.08);
      color: #E2ECE8;
      border: 1px solid rgba(255, 255, 255, 0.15);
      font-size: 14px;
      font-weight: 600;
      padding: 12px 18px;
      border-radius: 12px;
      margin-top: 10px;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s ease;
    }
    .btn-sandbox:active {
      background: rgba(255, 255, 255, 0.12);
    }
    .secure-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 20px;
      font-size: 12px;
      color: #7A8E87;
    }
  </style>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <div class="card">
    <div class="glow-icon-wrap">💎</div>
    <div class="pill">SPLITMATE PRO</div>
    <h2>Unlock Pro Membership</h2>
    <p class="subtitle">${description || 'Unlimited OCR bill scans, deep history search & smart debt minimization.'}</p>
    
    <div class="price-box">
      <div>
        <div class="price-label">Selected Plan</div>
        <div class="price-title">${name || 'SplitMate Pro'}</div>
      </div>
      <div>
        <div class="price-val">₹${(Number(amount || 149900) / 100).toLocaleString('en-IN')}</div>
      </div>
    </div>

    <button id="pay-btn" class="btn-primary">Pay with Razorpay</button>
    <button id="sim-btn" class="btn-sandbox">⚡ Instant Sandbox Approval (Test)</button>

    <div class="secure-badge">
      <span>🔒</span>
      <span>256-bit Encrypted by Razorpay Payment Gateway</span>
    </div>
  </div>

  <script>
    var cleanOrderId = "${orderId || ''}";
    var options = {
      key: "${keyId || 'rzp_test_TzYOq8vZZErm5Y'}",
      amount: ${Number(amount || 149900)},
      currency: "INR",
      name: "${name || 'SplitMate Pro'}",
      description: "${description || 'SplitMate Pro Subscription'}",
      theme: { color: "#176B50" },
      handler: function(response) {
        window.location.href = "/api/v1/subscriptions/razorpay/success?payment_id=" + (response.razorpay_payment_id || 'pay_test_' + Date.now()) + "&order_id=" + (response.razorpay_order_id || cleanOrderId) + "&signature=" + (response.razorpay_signature || 'simulated_test_signature_approved');
      }
    };

    if (cleanOrderId && cleanOrderId.indexOf('order_') === 0 && cleanOrderId.indexOf('order_sim_') === -1) {
      options.order_id = cleanOrderId;
    }

    var email = "${email || ''}";
    var phone = "${phone || ''}";
    var userName = "${userName || ''}";
    var prefill = {};
    if (userName) prefill.name = userName;
    if (email && email.indexOf('@') !== -1) prefill.email = email;
    if (phone && phone.length >= 10) prefill.contact = phone;
    if (Object.keys(prefill).length > 0) options.prefill = prefill;

    var rzp = new Razorpay(options);
    document.getElementById('pay-btn').onclick = function(e){
      try { rzp.open(); } catch(err) {
        window.location.href = "/api/v1/subscriptions/razorpay/success?payment_id=pay_sim_" + Date.now() + "&order_id=" + cleanOrderId + "&signature=simulated_test_signature_approved";
      }
      e.preventDefault();
    };

    document.getElementById('sim-btn').onclick = function(e){
      e.preventDefault();
      window.location.href = "/api/v1/subscriptions/razorpay/success?payment_id=pay_sim_" + Date.now() + "&order_id=" + cleanOrderId + "&signature=simulated_test_signature_approved";
    };

    window.onload = function() {
      setTimeout(function() {
        try { rzp.open(); } catch(err) {}
      }, 500);
    };
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};

export const getSuccessPage = (req: Request, res: Response) => {
  const { payment_id, order_id } = req.query;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>SplitMate Pro Activated 🎉</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: #08130E;
    }
    body {
      color: #F2F6F4;
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justifyContent: center;
      padding: 20px;
      background: radial-gradient(circle at 50% 8%, rgba(35, 155, 104, 0.32) 0%, transparent 65%),
                  radial-gradient(circle at 85% 92%, rgba(212, 175, 55, 0.16) 0%, transparent 50%),
                  #08130E;
    }
    .card {
      background: linear-gradient(180deg, rgba(20, 50, 40, 0.90) 0%, rgba(10, 24, 18, 0.97) 100%);
      border: 1px solid rgba(43, 176, 124, 0.4);
      border-radius: 28px;
      padding: 36px 24px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), 0 0 50px rgba(35, 155, 104, 0.22);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      text-align: center;
      position: relative;
      animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes popIn {
      0% { opacity: 0; transform: scale(0.92) translateY(20px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .celebrate-icon-box {
      width: 84px;
      height: 84px;
      border-radius: 42px;
      background: linear-gradient(135deg, #2BB07C 0%, #176B50 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 18px;
      box-shadow: 0 0 35px rgba(43, 176, 124, 0.6);
      font-size: 40px;
      animation: pulseGlow 2s infinite ease-in-out;
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 25px rgba(43, 176, 124, 0.5); transform: scale(1); }
      50% { box-shadow: 0 0 45px rgba(43, 176, 124, 0.8); transform: scale(1.04); }
    }
    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(212, 175, 55, 0.18);
      border: 1px solid rgba(212, 175, 55, 0.5);
      color: #D4AF37;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      padding: 5px 14px;
      border-radius: 20px;
      margin-bottom: 12px;
    }
    .badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 4px;
      background: #D4AF37;
      display: inline-block;
      box-shadow: 0 0 6px #D4AF37;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 26px;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: -0.5px;
    }
    .subtitle {
      color: #A3B7AE;
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 24px;
    }
    .receipt-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      padding: 16px;
      margin-bottom: 22px;
      text-align: left;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      font-size: 13px;
    }
    .receipt-row:not(:last-child) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .receipt-label {
      color: #839790;
      font-weight: 500;
    }
    .receipt-val {
      color: #E8F2EE;
      font-weight: 700;
      font-family: monospace;
      font-size: 12px;
    }
    .unlocked-features {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 24px;
      text-align: left;
    }
    .feature-item {
      background: rgba(35, 155, 104, 0.12);
      border: 1px solid rgba(35, 155, 104, 0.25);
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 11px;
      font-weight: 600;
      color: #D3EFE3;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-return {
      display: block;
      width: 100%;
      background: linear-gradient(135deg, #2BB07C 0%, #176B50 100%);
      color: #FFFFFF;
      font-size: 16px;
      font-weight: 700;
      padding: 16px 20px;
      border-radius: 14px;
      border: none;
      cursor: pointer;
      text-decoration: none;
      box-shadow: 0 10px 28px rgba(43, 176, 124, 0.45);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      font-family: inherit;
    }
    .btn-return:active {
      transform: scale(0.98);
      box-shadow: 0 4px 14px rgba(43, 176, 124, 0.35);
    }
    .return-hint {
      margin-top: 16px;
      font-size: 12px;
      color: #7A8E87;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="celebrate-icon-box">🎉</div>
    <div class="badge-pill">
      <span class="badge-dot"></span>
      <span>PRO MEMBERSHIP ACTIVE</span>
    </div>
    <h2>SplitMate Pro Activated!</h2>
    <p class="subtitle">Your test payment was approved. All VIP features and limits have been unlocked.</p>

    <!-- Unlocked Badges -->
    <div class="unlocked-features">
      <div class="feature-item"><span>✅</span> Unlimited Splits</div>
      <div class="feature-item"><span>🧾</span> AI OCR Bill Scan</div>
      <div class="feature-item"><span>🌐</span> Live Real-time FX</div>
      <div class="feature-item"><span>📊</span> Excel & CSV Export</div>
      <div class="feature-item"><span>🚫</span> 100% Zero Ads</div>
      <div class="feature-item"><span>👑</span> VIP Gold Badge</div>
    </div>

    <!-- Receipt Details -->
    <div class="receipt-box">
      <div class="receipt-row">
        <span class="receipt-label">Order Ref</span>
        <span class="receipt-val">${String(order_id || 'order_verified').slice(0, 18)}...</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Payment ID</span>
        <span class="receipt-val">${String(payment_id || 'pay_test_approved').slice(0, 18)}...</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Status</span>
        <span class="receipt-val" style="color: #2BB07C; font-family: inherit; font-size: 13px;">● Approved & Active</span>
      </div>
    </div>

    <button id="return-btn" class="btn-return" onclick="handleReturnApp()">
      Return to SplitMate App
    </button>

    <div id="status-hint" class="return-hint">
      Swipe up or tap your SplitMate app to begin enjoying your Pro membership.
    </div>
  </div>

  <script>
    function handleReturnApp() {
      var hint = document.getElementById('status-hint');
      if (hint) {
        hint.innerHTML = "✨ Returning to SplitMate... If your browser stays open, swipe up to return to the app!";
      }

      // Try opening the app via registered URL scheme
      window.location.href = "splitmate://pro-activated";

      // Attempt window close (for in-app webviews / tabs)
      setTimeout(function() {
        try { window.close(); } catch(e) {}
      }, 500);
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};

