// Simple webhook receiver for Stripe
// Deploy this to a service like Vercel, Netlify Functions, or AWS Lambda

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const BACK4APP_APP_ID = process.env.BACK4APP_APP_ID;
const BACK4APP_MASTER_KEY = process.env.BACK4APP_MASTER_KEY;

module.exports = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const customerEmail = session.customer_details?.email || session.customer_email;
                
                if (!customerEmail) {
                    console.error('No email found in session');
                    break;
                }
                
                // Find user in Back4App by email
                const userQuery = await fetch(`https://parseapi.back4app.com/classes/_User?where=${encodeURIComponent(JSON.stringify({email: customerEmail}))}`, {
                    headers: {
                        'X-Parse-Application-Id': BACK4APP_APP_ID,
                        'X-Parse-Master-Key': BACK4APP_MASTER_KEY
                    }
                });
                
                const userData = await userQuery.json();
                
                if (userData.results && userData.results.length > 0) {
                    const user = userData.results[0];
                    
                    // Update user subscription status
                    await fetch(`https://parseapi.back4app.com/classes/_User/${user.objectId}`, {
                        method: 'PUT',
                        headers: {
                            'X-Parse-Application-Id': BACK4APP_APP_ID,
                            'X-Parse-Master-Key': BACK4APP_MASTER_KEY,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            stripeCustomerId: session.customer,
                            stripeSubscriptionId: session.subscription,
                            subscriptionStatus: 'active',
                            subscriptionExpiresAt: {
                                __type: 'Date',
                                iso: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                            },
                            usageCount: 0
                        })
                    });
                }
                break;
            }
            
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
            case 'invoice.payment_succeeded':
            case 'invoice.payment_failed': {
                // Handle other events similarly
                console.log(`Received ${event.type}`);
                break;
            }
        }
        
        res.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Webhook processing failed');
    }
};
