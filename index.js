const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Parse = require('parse/node');
const app = express();

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const PARSE_CONFIGS = {
  latentlink: {
    appId: process.env.BACK4APP_APP_ID,
    jsKey: process.env.BACK4APP_JS_KEY,
    masterKey: process.env.BACK4APP_MASTER_KEY,
    serverURL: 'https://parseapi.back4app.com',
  }
};

// Stripe webhook route (use raw body)
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('✅ Stripe event received:', event.type);
  } catch (err) {
    console.error('❌ Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    try {
      const session = event.data.object;
      console.log('📦 Session data:', session);

      const email = session.customer_details?.email;
      const subscriptionId = session.subscription;
      const customerId = session.customer;

      console.log('📧 Email:', email);
      console.log('🔐 Subscription ID:', subscriptionId);
      console.log('👤 Customer ID:', customerId);

      if (!email || !subscriptionId) {
        console.log("❌ Missing email or subscriptionId");
        return res.status(400).send("Missing required fields");
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
      console.log('🧾 Line items:', lineItems);

      const productId = lineItems.data[0]?.price?.product;
      const product = await stripe.products.retrieve(productId);
      const appTag = product?.metadata?.app;

      console.log('🏷️ App metadata:', appTag);
      const config = PARSE_CONFIGS[appTag];

      if (!config) {
        console.log(`🚫 No config found for app: ${appTag}`);
        return res.status(200).send("Ignored: unknown app");
      }

      // Initialize correct Parse app
      Parse.initialize(config.appId, config.jsKey, config.masterKey);
      Parse.serverURL = config.serverURL;

      const query = new Parse.Query(Parse.User);
      query.equalTo("email", email);
      const user = await query.first({ useMasterKey: true });

      if (!user) {
        console.log(`❌ No user found with email ${email} in app ${appTag}`);
        return res.status(404).send("User not found");
      }

      // Get subscription details to set expiration date
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const expiresAt = new Date(subscription.current_period_end * 1000);

      user.set("stripeCustomerId", customerId);
      user.set("stripeSubscriptionId", subscriptionId);
      user.set("subscriptionStatus", "active");
      user.set("subscriptionExpiresAt", expiresAt);
      user.set("usageCount", 0);
      await user.save(null, { useMasterKey: true });

      console.log(`✅ Updated user ${email} with subscription ${subscriptionId} in app ${appTag}`);
      return res.status(200).send("User updated");

    } catch (error) {
      console.error("❌ ERROR IN WEBHOOK HANDLER:", error.message);
      console.error(error.stack);
      return res.status(500).send("Internal error");
    }
  }

  res.status(200).send('Webhook received');
});

// Health check route for Back4App
app.get('/', (req, res) => {
  res.status(200).send('LatentLink Webhook Server is up');
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
