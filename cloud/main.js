// Back4App Cloud Functions for LatentLink
// Deploy these functions to your Back4App dashboard under Cloud Code

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Create Stripe Checkout Session
Parse.Cloud.define('createCheckoutSession', async (request) => {
    const { userId, email, priceId } = request.params;
    
    try {
        const session = await stripe.checkout.sessions.create({
            customer_email: email,
            client_reference_id: userId,
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${process.env.APP_URL}/?success=true`,
            cancel_url: `${process.env.APP_URL}/`,
            metadata: {
                userId: userId
            },
            payment_method_options: {
                card: {
                    setup_future_usage: 'off_session'
                }
            },
            // Disable Link to show card form by default
            automatic_payment_methods: {
                enabled: false
            }
        });

        return { sessionId: session.id };
    } catch (error) {
        throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, error.message);
    }
});

// Create Stripe Customer Portal Session
Parse.Cloud.define('createPortalSession', async (request) => {
    const { userId } = request.params;
    
    try {
        const query = new Parse.Query(Parse.User);
        const user = await query.get(userId, { useMasterKey: true });
        const customerId = user.get('stripeCustomerId');

        if (!customerId) {
            throw new Error('No Stripe customer ID found');
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: process.env.APP_URL,
        });

        return { url: session.url };
    } catch (error) {
        throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, error.message);
    }
});

// Stripe Webhook Handler
Parse.Cloud.define('stripeWebhook', async (request) => {
    const sig = request.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(request.body, sig, webhookSecret);
    } catch (err) {
        throw new Parse.Error(Parse.Error.INVALID_JSON, `Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const userId = session.metadata.userId || session.client_reference_id;
            
            const query = new Parse.Query(Parse.User);
            const user = await query.get(userId, { useMasterKey: true });
            
            user.set('stripeCustomerId', session.customer);
            user.set('stripeSubscriptionId', session.subscription);
            user.set('subscriptionStatus', 'active');
            user.set('subscriptionExpiresAt', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
            user.set('usageCount', 0); // Reset usage on new subscription
            
            await user.save(null, { useMasterKey: true });
            break;
        }
        
        case 'customer.subscription.updated': {
            const subscription = event.data.object;
            
            const query = new Parse.Query(Parse.User);
            query.equalTo('stripeSubscriptionId', subscription.id);
            const user = await query.first({ useMasterKey: true });
            
            if (user) {
                user.set('subscriptionStatus', subscription.status);
                if (subscription.current_period_end) {
                    user.set('subscriptionExpiresAt', new Date(subscription.current_period_end * 1000));
                }
                await user.save(null, { useMasterKey: true });
            }
            break;
        }
        
        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            
            const query = new Parse.Query(Parse.User);
            query.equalTo('stripeSubscriptionId', subscription.id);
            const user = await query.first({ useMasterKey: true });
            
            if (user) {
                user.set('subscriptionStatus', 'canceled');
                await user.save(null, { useMasterKey: true });
            }
            break;
        }
        
        case 'invoice.payment_succeeded': {
            const invoice = event.data.object;
            const subscriptionId = invoice.subscription;
            
            const query = new Parse.Query(Parse.User);
            query.equalTo('stripeSubscriptionId', subscriptionId);
            const user = await query.first({ useMasterKey: true });
            
            if (user) {
                // Reset monthly usage count on successful payment
                user.set('usageCount', 0);
                user.set('subscriptionStatus', 'active');
                if (invoice.period_end) {
                    user.set('subscriptionExpiresAt', new Date(invoice.period_end * 1000));
                }
                await user.save(null, { useMasterKey: true });
            }
            break;
        }
        
        case 'invoice.payment_failed': {
            const invoice = event.data.object;
            const subscriptionId = invoice.subscription;
            
            const query = new Parse.Query(Parse.User);
            query.equalTo('stripeSubscriptionId', subscriptionId);
            const user = await query.first({ useMasterKey: true });
            
            if (user) {
                user.set('subscriptionStatus', 'past_due');
                await user.save(null, { useMasterKey: true });
            }
            break;
        }
    }

    return { received: true };
});

// Proxy OpenAI API calls (keeps your API key secure)
Parse.Cloud.define('callOpenAI', async (request) => {
    const { messages, temperature } = request.params;
    const user = request.user;
    
    if (!user) {
        throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'Must be logged in');
    }

    // Check subscription status
    const subscriptionStatus = user.get('subscriptionStatus');
    if (subscriptionStatus !== 'active') {
        throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Active subscription required');
    }

    // Check usage limits
    const usageCount = user.get('usageCount') || 0;
    const usageLimit = user.get('usageLimit') || 100;
    
    if (usageCount >= usageLimit) {
        throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Monthly usage limit reached');
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: messages,
                temperature: temperature || 0.7
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API error');
        }

        const data = await response.json();
        
        // Increment usage count
        user.increment('usageCount');
        await user.save(null, { useMasterKey: true });
        
        return {
            content: data.choices[0].message.content,
            usage: {
                count: usageCount + 1,
                limit: usageLimit
            }
        };
    } catch (error) {
        throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, error.message);
    }
});

// Get user usage stats
Parse.Cloud.define('getUsageStats', async (request) => {
    const user = request.user;
    
    if (!user) {
        throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'Must be logged in');
    }

    await user.fetch({ useMasterKey: true });
    
    return {
        usageCount: user.get('usageCount') || 0,
        usageLimit: user.get('usageLimit') || 100,
        subscriptionStatus: user.get('subscriptionStatus'),
        subscriptionExpiresAt: user.get('subscriptionExpiresAt')
    };
});
