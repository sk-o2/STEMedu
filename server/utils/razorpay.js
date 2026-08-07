const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

// Create a Razorpay Order
exports.createRazorpayOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  try {
    const razorpay = getRazorpayInstance();
    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes,
    };
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    // Only generate a demo fallback order when still running with placeholder credentials
    const isPlaceholderKey = !process.env.RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID === 'rzp_test_your_key_id';
    if (error.statusCode === 401 && isPlaceholderKey) {
      return {
        id: `order_demo_${Date.now()}`,
        entity: 'order',
        amount: Math.round(amount * 100),
        amount_paid: 0,
        amount_due: Math.round(amount * 100),
        currency,
        receipt: receipt || `rcpt_demo_${Date.now()}`,
        status: 'created',
        notes,
        isDemo: true,
      };
    }
    throw error;
  }
};

// Verify Razorpay Payment Signature
exports.verifyRazorpaySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  // Demo order: skip signature check (only reaches here if placeholder key still in use)
  if (razorpay_order_id && razorpay_order_id.startsWith('order_demo_')) {
    return true;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    // Refuse verification when key secret is missing — do not mark as paid
    console.error('[Razorpay] RAZORPAY_KEY_SECRET is not set — rejecting payment verification');
    return false;
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === razorpay_signature;
};
