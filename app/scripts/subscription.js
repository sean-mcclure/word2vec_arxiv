// Subscription Management for LatentLink

class SubscriptionManager {
    constructor() {
        this.stripe = null;
    }

    // Initialize Stripe
    async initialize() {
        if (!window.Stripe) {
            throw new Error('Stripe.js not loaded');
        }
        this.stripe = Stripe(STRIPE_CONFIG.publishableKey);
    }

    // Create checkout session via Back4App Cloud Function
    async createCheckoutSession() {
        try {
            const user = Parse.User.current();
            if (!user) {
                throw new Error('Must be logged in to subscribe');
            }

            // Call Back4App Cloud Function to create Stripe checkout session
            const result = await Parse.Cloud.run('createCheckoutSession', {
                userId: user.id,
                email: user.get('email'),
                priceId: STRIPE_CONFIG.priceId
            });

            if (result.sessionId) {
                // Redirect to Stripe Checkout
                const { error } = await this.stripe.redirectToCheckout({
                    sessionId: result.sessionId
                });

                if (error) {
                    throw new Error(error.message);
                }
            } else {
                throw new Error('Failed to create checkout session');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            throw error;
        }
    }

    // Create customer portal session for managing subscription
    async createPortalSession() {
        try {
            const user = Parse.User.current();
            if (!user) {
                throw new Error('Must be logged in');
            }

            const result = await Parse.Cloud.run('createPortalSession', {
                userId: user.id
            });

            if (result.url) {
                window.location.href = result.url;
            } else {
                throw new Error('Failed to create portal session');
            }
        } catch (error) {
            console.error('Portal error:', error);
            throw error;
        }
    }

    // Check subscription status
    async getSubscriptionStatus() {
        try {
            const user = Parse.User.current();
            if (!user) {
                return { active: false };
            }

            await user.fetch();
            
            return {
                active: user.get('subscriptionStatus') === 'active',
                status: user.get('subscriptionStatus'),
                expiresAt: user.get('subscriptionExpiresAt'),
                customerId: user.get('stripeCustomerId'),
                subscriptionId: user.get('stripeSubscriptionId')
            };
        } catch (error) {
            console.error('Status check error:', error);
            return { active: false, error: error.message };
        }
    }
}

// Export singleton instance
const subscriptionManager = new SubscriptionManager();
