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

    // Redirect to Stripe Payment Link
    async createCheckoutSession() {
        try {
            const user = Parse.User.current();
            if (!user) {
                throw new Error('Must be logged in to subscribe');
            }

            // Store pending subscription status
            user.set('pendingSubscription', true);
            user.set('subscriptionInitiatedAt', new Date());
            await user.save();

            // Redirect directly to Stripe Payment Link with prefilled email
            const email = user.get('email');
            const paymentUrl = `${STRIPE_CONFIG.paymentLink}?prefilled_email=${encodeURIComponent(email)}`;
            
            window.location.href = paymentUrl;
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
