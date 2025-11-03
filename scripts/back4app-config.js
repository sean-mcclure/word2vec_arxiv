// Back4App Configuration
// Replace these with your actual Back4App credentials from:
// https://dashboard.back4app.com/apps/[your-app]/settings/keys

const BACK4APP_CONFIG = {
    applicationId: '3JXJecrqAo6MxPy1yDSAUJJWlilCLQ2Y6ZcKOqDx',
    javascriptKey: 'njWMBrden8qHZgYLWxyAgIhWLxbeMadH8yx06QlV',
    serverURL: 'https://parseapi.back4app.com'
};

// Initialize Parse
Parse.initialize(BACK4APP_CONFIG.applicationId, BACK4APP_CONFIG.javascriptKey);
Parse.serverURL = BACK4APP_CONFIG.serverURL;

// Stripe Configuration
const STRIPE_CONFIG = {
    publishableKey: 'pk_live_51OzirFRpZt3bNy6s82Z9QmDL08E5s13Kr8D6dVsUWXAQbRJTDykQzIAEDI6U5WqcPRdtOtkwPN5ZBEnDrnP926ls00t5N2ZewA',
    priceId: 'price_1SPRdXRpZt3bNy6sPlp0255H',
    paymentLink: 'https://buy.stripe.com/8x214p3Vk0sdf7J4zDaEE0h'
};
