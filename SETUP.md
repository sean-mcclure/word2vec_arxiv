# LatentLink Setup Guide

Complete setup instructions for deploying LatentLink with Back4App and Stripe.

## Prerequisites

1. **Back4App Account**: Sign up at [https://www.back4app.com/](https://www.back4app.com/)
2. **Stripe Account**: Sign up at [https://stripe.com/](https://stripe.com/)
3. **OpenAI API Key**: Get from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

---

## Step 1: Back4App Setup

### 1.1 Create a New App

1. Log in to Back4App Dashboard
2. Click "Build new app"
3. Name it "LatentLink"
4. Choose a region close to your users

### 1.2 Get Your Credentials

1. Go to **App Settings** → **Security & Keys**
2. Copy these values:
   - **Application ID**
   - **JavaScript Key**
   - **Master Key** (keep this secret!)

### 1.3 Configure App Settings

1. Go to **App Settings** → **Server Settings**
2. Set **App Name**: `LatentLink`
3. Enable **Email Verification** (optional but recommended)

### 1.4 Deploy Cloud Code

1. Go to **Cloud Code** → **Functions**
2. Copy the entire contents of `/cloud/main.js`
3. Paste into the Cloud Code editor
4. Click **Deploy**

### 1.5 Set Environment Variables

1. Go to **App Settings** → **Server Settings** → **Environment Variables**
2. Add these variables:

```
STRIPE_SECRET_KEY=sk_test_... (your Stripe secret key)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe webhook setup)
OPENAI_API_KEY=sk-... (your OpenAI API key)
APP_URL=https://yourdomain.com (your app URL)
```

---

## Step 2: Stripe Setup

### 2.1 Create a Product

1. Log in to Stripe Dashboard
2. Go to **Products** → **Add Product**
3. Name: "LatentLink Subscription"
4. Description: "Monthly subscription to LatentLink"
5. Pricing: **$9.99/month** (recurring)
6. Click **Save product**
7. Copy the **Price ID** (starts with `price_...`)

### 2.2 Set Up Webhook

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://parseapi.back4app.com/functions/stripeWebhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_...`)
7. Add this to Back4App environment variables as `STRIPE_WEBHOOK_SECRET`

### 2.3 Get API Keys

1. Go to **Developers** → **API keys**
2. Copy:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)

---

## Step 3: Configure Frontend

### 3.1 Update Back4App Config

Edit `app/scripts/back4app-config.js`:

```javascript
const BACK4APP_CONFIG = {
    applicationId: 'YOUR_APPLICATION_ID', // From Back4App
    javascriptKey: 'YOUR_JAVASCRIPT_KEY', // From Back4App
    serverURL: 'https://parseapi.back4app.com'
};

const STRIPE_CONFIG = {
    publishableKey: 'pk_test_...', // From Stripe
    priceId: 'price_...' // From Stripe Product
};
```

### 3.2 Test Locally

```bash
python3 -m http.server 8888 --directory app
```

Open `http://localhost:8888/`

---

## Step 4: Deploy to Production

### Option A: Deploy to Back4App Hosting

1. Go to **Web Hosting** in Back4App Dashboard
2. Upload your `app/` folder
3. Set custom domain (optional)

### Option B: Deploy to Vercel/Netlify

1. Push code to GitHub
2. Connect to Vercel/Netlify
3. Set build directory to `app/`
4. Deploy

### Option C: Deploy to Your Own Server

1. Upload `app/` folder to your web server
2. Configure HTTPS (required for Stripe)
3. Point domain to server

---

## Step 5: Testing

### 5.1 Test Signup Flow

1. Create a new account
2. Verify email (if enabled)
3. Should see subscription page

### 5.2 Test Stripe Checkout

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future expiry date and CVC

### 5.3 Test Discovery Flow

1. After subscribing, should see main app
2. Select domains and search
3. Click "Discover Connections"
4. Verify AI responses work
5. Check usage counter updates

---

## Step 6: Go Live

### 6.1 Switch to Production Keys

1. **Stripe**: Switch from test to live keys
2. **OpenAI**: Ensure production API key is set
3. Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

### 6.2 Update Environment Variables

In Back4App, update all environment variables to production values.

### 6.3 Test Production

1. Create real account
2. Make real $9.99 payment
3. Test full flow
4. Verify webhooks work

---

## Monitoring & Maintenance

### Usage Tracking

Monitor in Back4App Dashboard:
- **Database Browser** → **User** class
- Check `usageCount` and `subscriptionStatus` fields

### Stripe Dashboard

Monitor:
- Active subscriptions
- Failed payments
- Churn rate

### OpenAI Usage

Monitor API costs:
- [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- Set up billing alerts

---

## Troubleshooting

### "Must be logged in" Error
- Check Back4App credentials in config
- Verify Parse SDK is loaded
- Check browser console for errors

### "Active subscription required" Error
- Verify Stripe webhook is working
- Check user's `subscriptionStatus` in Back4App database
- Ensure webhook secret is correct

### "Monthly usage limit reached" Error
- User has hit 100 discoveries/month
- Reset manually in database or wait for next billing cycle

### Stripe Webhook Not Working
- Verify endpoint URL is correct
- Check webhook signing secret
- Test webhook in Stripe Dashboard

---

## Cost Estimates

### Per User Per Month

**Revenue**: $9.99

**Costs**:
- OpenAI API: ~$0.65 (100 discoveries)
- Stripe fees: ~$0.59 (2.9% + $0.30)
- Back4App: Free tier (up to 25k requests/month)

**Net Profit**: ~$8.75 per user (88% margin)

### Scaling

- 100 users: $875/month profit
- 1,000 users: $8,750/month profit
- 10,000 users: $87,500/month profit

**Note**: Back4App paid plans start at $5/month for higher limits.

---

## Support

For issues:
1. Check Back4App logs: **Core** → **Logs**
2. Check Stripe events: **Developers** → **Events**
3. Check browser console for frontend errors

---

## Security Checklist

- [ ] OpenAI API key stored in Back4App environment variables (not in frontend)
- [ ] Stripe secret key stored in Back4App environment variables
- [ ] Master Key never exposed to frontend
- [ ] HTTPS enabled on production domain
- [ ] Webhook signing secret configured
- [ ] Email verification enabled (optional)
- [ ] Rate limiting configured (optional)

---

## Next Steps

1. Customize pricing/features
2. Add more payment options
3. Implement team accounts
4. Add usage analytics
5. Create admin dashboard
6. Add email notifications
7. Implement referral program

---

**Questions?** Open an issue on GitHub or contact support.
