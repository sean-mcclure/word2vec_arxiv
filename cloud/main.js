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
            payment_method_types: ['card', 'link'],
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
            phone_number_collection: {
                enabled: false
            }
        });

        return { 
            sessionId: session.id,
            url: session.url 
        };
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

// Stripe Webhook Handler (called via Express endpoint)
Parse.Cloud.define('handleStripeWebhook', async (request) => {
    const event = request.params.event;
    
    if (!event) {
        throw new Parse.Error(Parse.Error.INVALID_JSON, 'No event provided');
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const customerEmail = session.customer_details?.email || session.customer_email;
            
            if (!customerEmail) {
                console.error('No email found in session:', session.id);
                break;
            }
            
            // Find user by email
            const query = new Parse.Query(Parse.User);
            query.equalTo('email', customerEmail);
            const user = await query.first({ useMasterKey: true });
            
            if (!user) {
                console.error('No user found with email:', customerEmail);
                break;
            }
            
            user.set('stripeCustomerId', session.customer);
            user.set('stripeSubscriptionId', session.subscription);
            user.set('subscriptionStatus', 'active');
            user.set('subscriptionExpiresAt', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
            user.set('usageCount', 0); // Reset usage on new subscription
            user.unset('pendingSubscription');
            
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

    // Free tier users can use the API (limits enforced by notebook system in frontend)
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
        
        return {
            content: data.choices[0].message.content
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

    // No Master Key needed - user can read their own properties
    return {
        usageCount: user.get('usageCount') || 0,
        usageLimit: user.get('usageLimit') || 100,
        subscriptionStatus: user.get('subscriptionStatus'),
        subscriptionExpiresAt: user.get('subscriptionExpiresAt')
    };
});



// Proxy ArXiv API calls (bypass CORS)
Parse.Cloud.define('searchArxiv', async (request) => {
    const { category, query, maxResults } = request.params;
    const user = request.user;
    
    console.log('ArXiv search request:', { category, query, maxResults });
    
    if (!user) {
        throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'Must be logged in');
    }
    
    try {
        const searchQuery = `cat:${category} AND all:${query}`;
        const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(searchQuery)}&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;
        
        console.log('Fetching from ArXiv:', url);
        
        // Add timeout and better error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'LatentLink/1.0 (Research Discovery Tool)'
            }
        });
        
        clearTimeout(timeoutId);
        
        console.log('ArXiv response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`ArXiv API error: ${response.status} ${response.statusText}`);
        }
        
        const xmlText = await response.text();
        
        console.log('ArXiv response received, length:', xmlText.length);
        
        return {
            success: true,
            data: xmlText
        };
    } catch (error) {
        console.error('ArXiv search error:', error);
        
        // Return error details for debugging
        return {
            success: false,
            error: error.message,
            errorType: error.name
        };
    }
});
