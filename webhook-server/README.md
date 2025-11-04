# LatentLink Webhook Server

This is a standalone webhook server for handling Stripe subscription events for LatentLink.

## Setup

1. **Update credentials in `index.js`**:
   - Replace the placeholder Back4App credentials with your actual App ID, JavaScript Key, and Master Key
   - The Stripe keys are already configured

2. **Add metadata to your Stripe product**:
   - Go to Stripe Dashboard → Products → Your LatentLink product
   - Add metadata: `app` = `latentlink`
   - This tells the webhook which Back4App app to update

3. **Deploy to Back4App Web Deployment**:
   - Create a new Web Deployment in Back4App
   - Connect this repository or upload these files
   - Back4App will use the Dockerfile to build and deploy

4. **Update Stripe webhook URL**:
   - Go to Stripe Dashboard → Webhooks
   - Update the endpoint URL to your Back4App Web Deployment URL + `/webhook`
   - Example: `https://your-deployment.back4app.io/webhook`

## Testing Locally

```bash
npm install
node index.js
```

Then use Stripe CLI to forward webhooks:
```bash
stripe listen --forward-to localhost:3000/webhook
```

## How It Works

1. Stripe sends `checkout.session.completed` event when a user subscribes
2. Webhook verifies the Stripe signature
3. Extracts customer email and subscription ID
4. Reads product metadata to determine which app (latentlink)
5. Finds the user in Back4App by email
6. Updates user with:
   - `stripeCustomerId`
   - `stripeSubscriptionId`
   - `subscriptionStatus: "active"`
   - `usageCount: 0`
