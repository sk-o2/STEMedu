const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance — throws if credentials are not configured
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret ||
      keyId === 'rzp_test_your_key_id' ||
      keySecret === 'your_razorpay_key_secret') {
    const err = new Error(
      'Razorpay credentials are not configured. ' +
      'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your server environment variables.'
    );
    err.statusCode = 503;
    throw err;
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// Create a Razorpay Order
exports.createRazorpayOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const razorpay = getRazorpayInstance(); // throws 503 if credentials missing
  const options = {
    amount: Math.round(amount * 100), // convert rupees → paise
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
    notes,
  };
  const order = await razorpay.orders.create(options);
  return order;
};

// Verify Razorpay Payment Signature using HMAC-SHA256
exports.verifyRazorpaySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || secret === 'your_razorpay_key_secret') {
    console.error('[Razorpay] RAZORPAY_KEY_SECRET is not configured — rejecting payment verification');
    return false;
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === razorpay_signature;
};
