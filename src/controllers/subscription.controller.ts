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
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>SplitMate Pro Checkout</title>
  <style>
    body {
      background-color: #121916;
      color: #F2F6F4;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justifyContent: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background-color: #1E2925;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 12px 30px rgba(0,0,0,0.5);
    }
    .badge {
      font-size: 40px;
      margin-bottom: 16px;
    }
    h2 {
      margin: 0 0 8px 0;
      color: #3DD598;
      font-size: 24px;
    }
    p {
      color: #A7B5B0;
      font-size: 15px;
      line-height: 1.5;
      margin: 0 0 24px 0;
    }
    .btn {
      background: #2BB07C;
      color: #FFFFFF;
      font-size: 16px;
      font-weight: 700;
      padding: 14px 28px;
      border-radius: 12px;
      border: none;
      width: 100%;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(43, 176, 124, 0.4);
    }
    .secure {
      margin-top: 18px;
      font-size: 12px;
      color: #6E7D78;
    }
  </style>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <div class="card">
    <div class="badge">💎</div>
    <h2>SplitMate Pro</h2>
    <p>${description || 'Upgrade to unlock AI receipts, export reports, and unlimited splits.'}</p>
    <button id="pay-btn" class="btn">Pay ₹${Number(amount || 0) / 100} with Razorpay</button>
    <div class="secure">🔒 256-bit Encrypted &amp; Secured by Razorpay</div>
    <div style="margin-top: 14px;">
      <button id="sim-btn" class="btn" style="background: #176B50; font-size: 14px; padding: 10px 16px;">⚡ Complete Sandbox Test Payment</button>
    </div>
  </div>

  <script>
    var cleanOrderId = "${orderId || ''}";
    var options = {
      key: "${keyId || 'rzp_test_TzYOq8vZZErm5Y'}",
      amount: ${Number(amount || 149900)},
      currency: "INR",
      name: "${name || 'SplitMate Pro'}",
      description: "${description || 'Subscription'}",
      theme: {
        color: "#176B50"
      },
      handler: function(response) {
        window.location.href = "/api/v1/subscriptions/razorpay/success?payment_id=" + (response.razorpay_payment_id || 'pay_test_' + Date.now()) + "&order_id=" + (response.razorpay_order_id || cleanOrderId) + "&signature=" + (response.razorpay_signature || 'simulated_test_signature_approved');
      }
    };

    // Attach order_id only if it is a real official Razorpay order (starts with 'order_' and not 'order_sim_')
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
      rzp.open();
      e.preventDefault();
    };

    document.getElementById('sim-btn').onclick = function(e){
      e.preventDefault();
      window.location.href = "/api/v1/subscriptions/razorpay/success?payment_id=pay_sim_" + Date.now() + "&order_id=" + cleanOrderId + "&signature=simulated_test_signature_approved";
    };

    // Auto open checkout on load
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
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Successful - SplitMate Pro</title>
  <style>
    body {
      background-color: #121916;
      color: #F2F6F4;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justifyContent: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      text-align: center;
    }
    .card {
      background: #1E2925;
      border: 1px solid #2BB07C;
      border-radius: 20px;
      padding: 36px 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 12px 30px rgba(0,0,0,0.5);
    }
    .emoji { font-size: 54px; margin-bottom: 12px; }
    h2 { color: #3DD598; margin: 0 0 10px; font-size: 24px; }
    p { color: #A7B5B0; font-size: 15px; line-height: 1.5; margin: 0 0 20px; }
    .btn {
      display: inline-block;
      background: #2BB07C;
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 700;
      padding: 14px 28px;
      border-radius: 12px;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">🎉</div>
    <h2>SplitMate Pro Activated!</h2>
    <p>Your test payment was approved! Return to your SplitMate app to enjoy all Pro benefits.</p>
    <a href="splitmate://" class="btn">Return to SplitMate App</a>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};

