# Razorpay Migration - Cleanup Instructions

## ⚠️ Old Stripe Files to Remove

The following files from the Stripe integration are no longer needed and should be deleted to clean up the codebase:

### Backend Files (5 files)

```bash
# Remove old Stripe models
rm server/src/models/Subscription.js
rm server/src/models/PaymentHistory.js

# Remove old Stripe controller
rm server/src/controllers/billingController.js

# Remove old Stripe routes
rm server/src/routes/billingRoutes.js

# Remove old Stripe middleware
rm server/src/middleware/requireSubscription.js
```

### Frontend Files (3 files)

```bash
# Remove old Stripe billing pages
rm client/src/pages/BillingDashboardPage.jsx
rm client/src/pages/BillingSuccessPage.jsx
rm client/src/pages/BillingCancelPage.jsx
```

### Documentation Files (3 files)

```bash
# Remove Stripe documentation
rm STRIPE_SETUP.md
rm STRIPE_TESTING_GUIDE.md
rm PREMIUM_FEATURES.md
```

## Cleanup by Environment

### Windows (PowerShell)

```powershell
# Backend cleanup
Remove-Item "server\src\models\Subscription.js" -Force
Remove-Item "server\src\models\PaymentHistory.js" -Force
Remove-Item "server\src\controllers\billingController.js" -Force
Remove-Item "server\src\routes\billingRoutes.js" -Force
Remove-Item "server\src\middleware\requireSubscription.js" -Force

# Frontend cleanup
Remove-Item "client\src\pages\BillingDashboardPage.jsx" -Force
Remove-Item "client\src\pages\BillingSuccessPage.jsx" -Force
Remove-Item "client\src\pages\BillingCancelPage.jsx" -Force

# Documentation cleanup
Remove-Item "STRIPE_SETUP.md" -Force
Remove-Item "STRIPE_TESTING_GUIDE.md" -Force
Remove-Item "PREMIUM_FEATURES.md" -Force
```

### macOS/Linux (Bash)

```bash
# Backend cleanup
rm -f server/src/models/Subscription.js
rm -f server/src/models/PaymentHistory.js
rm -f server/src/controllers/billingController.js
rm -f server/src/routes/billingRoutes.js
rm -f server/src/middleware/requireSubscription.js

# Frontend cleanup
rm -f client/src/pages/BillingDashboardPage.jsx
rm -f client/src/pages/BillingSuccessPage.jsx
rm -f client/src/pages/BillingCancelPage.jsx

# Documentation cleanup
rm -f STRIPE_SETUP.md
rm -f STRIPE_TESTING_GUIDE.md
rm -f PREMIUM_FEATURES.md
```

## What Was Already Removed

✅ Billing webhook endpoint removed from `server/src/app.js`
✅ `billingController` import removed from `server/src/app.js`
✅ Stripe dependencies removed from `server/package.json`
✅ All STRIPE\_\* environment variables removed from `server/.env`

## Verification After Cleanup

After removing the old files, restart the servers to verify there are no import errors:

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

**Expected Result**: No warnings about duplicate Mongoose schema indexes.

## Files Successfully Migrated

✅ **User Model** - Now uses: `isPremium`, `subscriptionPlan`, `subscriptionExpiry`
✅ **Payment Model** - New schema replacing old PaymentHistory
✅ **Payment Controller** - Complete Razorpay implementation
✅ **Payment Routes** - All endpoints configured
✅ **Frontend Service** - paymentService.js for API calls
✅ **Pricing Page** - Completely redesigned for Razorpay
✅ **Payment Pages** - Success and Failure pages created
✅ **Routing** - App.jsx updated with /payment routes
✅ **Security** - requirePremium middleware created

## Summary

| Item       | Stripe (Old)                                              | Razorpay (New)                     |
| ---------- | --------------------------------------------------------- | ---------------------------------- |
| Models     | Subscription, PaymentHistory                              | Payment                            |
| Middleware | requireSubscription                                       | requirePremium                     |
| Routes     | /api/billing/\*                                           | /api/payment/\*                    |
| Pages      | /billing, /billing/success, /billing/cancel               | /payment/success, /payment/failure |
| Config     | STRIPE_SECRET_KEY, STRIPE_CURRENCY, STRIPE_WEBHOOK_SECRET | RAZORPAY_KEY_ID, RAZORPAY_SECRET   |
| SDK        | stripe                                                    | razorpay                           |

## Next Steps

1. ✅ Run cleanup commands above
2. ✅ Restart both servers
3. ✅ Verify no import errors in console
4. ✅ Test payment flow at /pricing
5. ✅ Verify database updates after payment
6. ✅ Deploy to production with live Razorpay credentials

## Important Notes

- Do NOT delete `RAZORPAY_SETUP.md` or `RAZORPAY_INTEGRATION_SUMMARY.md`
- Do NOT delete new frontend pages: `PricingPage.jsx`, `PaymentSuccessPage.jsx`, `PaymentFailurePage.jsx`
- Do NOT delete new services: `paymentService.js`
- Do NOT delete new middleware: `requirePremium.js`

## Cleanup Verification Checklist

After running cleanup commands:

- [ ] All 5 backend files deleted
- [ ] All 3 frontend files deleted
- [ ] All 3 documentation files deleted
- [ ] Both servers restart without errors
- [ ] No "Cannot find module" errors in console
- [ ] No duplicate schema index warnings
- [ ] /pricing page loads correctly
- [ ] Payment flow works end-to-end
