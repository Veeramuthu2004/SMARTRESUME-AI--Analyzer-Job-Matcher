# Razorpay Integration Guide

## Overview

Smart Resume Analyzer uses Razorpay as the payment gateway for subscription management. This guide covers setup, testing, and deployment.

## Table of Contents

1. [Test Credentials](#test-credentials)
2. [Payment Flow](#payment-flow)
3. [API Endpoints](#api-endpoints)
4. [Testing](#testing)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)

## Test Credentials

### Current Test Configuration

```
Key ID:  rzp_test_SqpsQbq5VkE0Dd
Secret:  DidAV9S1lUDEUbXLlmL8n64A
```

### Environment Configuration

**Server (.env)**

```
RAZORPAY_KEY_ID=rzp_test_SqpsQbq5VkE0Dd
RAZORPAY_SECRET=DidAV9S1lUDEUbXLlmL8n64A
```

**Client (.env)**

```
VITE_RAZORPAY_KEY_ID=rzp_test_SqpsQbq5VkE0Dd
```

## Payment Plans

### Pro Plan

- **Monthly**: ₹499 (49,900 paise)
- **Yearly**: ₹4,999 (499,900 paise)
- Features:
  - Unlimited resume analyses
  - AI-powered resume optimization
  - Cover letter generator
  - Interview preparation guide
  - Priority email support

### Premium Plan

- **Monthly**: ₹999 (99,900 paise)
- **Yearly**: ₹9,999 (999,900 paise)
- Features:
  - Everything in Pro
  - Personal career coach consultation
  - ATS score optimization
  - LinkedIn profile optimization
  - Job application tracking
  - Interview mock sessions
  - 24/7 priority support
  - Salary negotiation guide

## Payment Flow

### 1. Pricing Page

- User selects plan (Pro or Premium)
- Monthly/Yearly toggle
- Click "Upgrade Now" button

### 2. Create Order (Backend)

```
POST /api/payment/create-order
Body: { plan: "pro", duration: "monthly" }
Response: { orderId, amount, planName }
```

### 3. Razorpay Checkout

- Razorpay checkout modal opens
- Customer enters payment details
- Payment is processed

### 4. Payment Verification (Backend)

```
POST /api/payment/verify
Body: {
  orderId: "order_123",
  paymentId: "pay_456",
  signature: "signature_hash"
}
```

### 5. Subscription Activation

- User database updated with:
  - `isPremium: true`
  - `subscriptionPlan: "pro"`
  - `subscriptionExpiry: <calculated date>`
- Redirect to `/payment/success`

## API Endpoints

### Create Order

```http
POST /api/payment/create-order
Authorization: Bearer {token}

{
  "plan": "pro",
  "duration": "monthly"
}

Response:
{
  "success": true,
  "orderId": "order_123",
  "amount": 49900,
  "planName": "Pro Plan"
}
```

### Verify Payment

```http
POST /api/payment/verify
Authorization: Bearer {token}

{
  "orderId": "order_123",
  "paymentId": "pay_456",
  "signature": "hashvalue"
}

Response:
{
  "success": true,
  "message": "Payment verified successfully",
  "isPremium": true,
  "subscriptionPlan": "pro",
  "subscriptionExpiry": "2024-01-15"
}
```

### Get Subscription Status

```http
GET /api/payment/status
Authorization: Bearer {token}

Response:
{
  "isPremium": true,
  "subscriptionPlan": "pro",
  "subscriptionExpiry": "2024-01-15",
  "isExpired": false,
  "daysRemaining": 30
}
```

### Get Payment History

```http
GET /api/payment/history
Authorization: Bearer {token}

Response:
[
  {
    "_id": "pay_123",
    "orderId": "order_123",
    "paymentId": "pay_456",
    "amount": 49900,
    "status": "success",
    "subscriptionPlan": "pro",
    "planDuration": "monthly",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

## Testing

### Test Cards (from Razorpay)

#### Visa

- **Number**: 4111 1111 1111 1111
- **Expiry**: Any future date (MM/YY)
- **CVV**: Any 3 digits

#### Mastercard

- **Number**: 5555 5555 5555 4444
- **Expiry**: Any future date (MM/YY)
- **CVV**: Any 3 digits

#### International Card

- **Number**: 4012 0010 1030 2007
- **Expiry**: 12/25
- **CVV**: 123

### Failed Payment Test

To test failure scenarios:

- Use card: 4000 0000 0000 0002
- This will trigger a failed payment for testing

### Test Flow

1. Start development servers:

   ```bash
   # Terminal 1: Backend
   cd server
   npm run dev

   # Terminal 2: Frontend
   cd client
   npm run dev
   ```

2. Navigate to http://localhost:5173/pricing

3. Click "Upgrade Now" on any plan

4. Fill Razorpay checkout with test card details:
   - Email: test@example.com
   - Card: 4111 1111 1111 1111
   - Expiry: 12/25
   - CVV: 123

5. Complete payment

6. Verify you're redirected to `/payment/success`

7. Check database:
   ```javascript
   // In MongoDB
   db.users.findOne({ _id: userId });
   // Should have isPremium: true
   ```

## Deployment

### Production Setup

1. **Get Live Credentials**
   - Log in to Razorpay Dashboard (razorpay.com)
   - Navigate to Settings > API Keys
   - Copy live Key ID and Secret

2. **Update Environment Variables**

   **Server Production .env**

   ```
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
   RAZORPAY_SECRET=xxxxxxxxxxxxxxxxxx
   ```

   **Client Production .env**

   ```
   VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
   ```

3. **Update Pricing**
   - If prices change, update PLANS in `paymentController.js`
   - Amounts must be in paise (smallest currency unit)

4. **Deploy**
   - Vercel (Frontend): Automatic deployment from GitHub
   - Render/Railway (Backend): Set env vars in dashboard

### Webhook Setup (Optional - for Advanced Scenarios)

To handle async payment updates:

1. In Razorpay Dashboard: Settings > Webhooks
2. Add endpoint: `https://yourdomain.com/api/payment/webhook`
3. Select events:
   - payment.authorized
   - payment.failed
   - subscription.charged

4. Implement webhook handler:

   ```javascript
   POST /api/payment/webhook
   Body: Raw request body
   Headers: X-Razorpay-Signature

   // Verify signature with secret
   // Update payment status in database
   ```

## Troubleshooting

### Payment Failed - "Razorpay is not configured"

**Cause**: Missing environment variables

**Solution**:

1. Check `.env` file has RAZORPAY_KEY_ID and RAZORPAY_SECRET
2. Restart backend server after updating .env
3. Check env.js has razorpayKeyId and razorpaySecret properties

### Checkout Modal Won't Open

**Cause**: Razorpay script not loaded or wrong key ID

**Solution**:

1. Verify VITE_RAZORPAY_KEY_ID in client .env
2. Check browser console for errors
3. Ensure Razorpay script is loaded:
   ```html
   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
   ```

### Signature Verification Failed

**Cause**: Secret key mismatch or corrupted data

**Solution**:

1. Verify RAZORPAY_SECRET is correct and matches live/test mode
2. Check payment data isn't modified before verification
3. Log signature components and verify manually:
   ```javascript
   const hmac = crypto
     .createHmac("sha256", secret)
     .update(`${orderId}|${paymentId}`)
     .digest("hex");
   ```

### User Still Free After Payment

**Cause**: Verification endpoint not called or failed

**Solution**:

1. Check browser network tab - verify POST to `/api/payment/verify`
2. Check backend logs for verification errors
3. Check database - ensure Payment document created
4. Verify token is valid when calling verify endpoint

### Amount Mismatch

**Cause**: Amount in paise doesn't match database

**Solution**:

1. Verify PLANS constant has correct amounts (in paise)
2. Ensure no arithmetic errors: ₹499 = 49,900 paise
3. Check currency calculation in createOrder

## Monitoring

### Key Metrics to Track

1. **Payment Success Rate**

   ```javascript
   db.payments.aggregate([
     { $match: { status: "success" } },
     { $group: { _id: null, count: { $sum: 1 } } },
   ]);
   ```

2. **Active Subscriptions**

   ```javascript
   db.users.countDocuments({ isPremium: true });
   ```

3. **Expiring Soon**
   ```javascript
   db.users.countDocuments({
     subscriptionExpiry: {
       $lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
     },
   });
   ```

## Support

- Razorpay Docs: https://razorpay.com/docs/
- Test Mode Limitations: No real money charged
- Live Mode: Real transactions processed
- Support Email: support@smartresume.dev

## Checklist Before Launch

- [ ] Test credentials configured in .env files
- [ ] Razorpay key ID displayed in checkout modal
- [ ] Payment success/failure pages working
- [ ] Database records created after payment
- [ ] Email notifications sent (if configured)
- [ ] Live credentials obtained from Razorpay
- [ ] Production environment variables set
- [ ] SSL/HTTPS enabled on backend
- [ ] CORS configured for frontend domain
- [ ] Webhook endpoint ready (optional)
