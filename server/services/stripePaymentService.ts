import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export class StripePaymentService {
  /**
   * Create a subscription for a trader
   */
  static async createSubscription(
    customerId: string,
    priceId: string,
    tradeId: string
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          tradeId,
        },
      });
      return subscription;
    } catch (error) {
      throw new Error(`Failed to create subscription: ${String(error)}`);
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.del(subscriptionId);
      return subscription;
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${String(error)}`);
    }
  }

  /**
   * Get subscription details
   */
  static async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      throw new Error(`Failed to get subscription: ${String(error)}`);
    }
  }

  /**
   * Create a payment intent for one-time payment
   */
  static async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    description?: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        description,
      });
      return paymentIntent;
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${String(error)}`);
    }
  }

  /**
   * Confirm payment intent
   */
  static async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });
      return paymentIntent;
    } catch (error) {
      throw new Error(`Failed to confirm payment intent: ${String(error)}`);
    }
  }

  /**
   * Create a customer
   */
  static async createCustomer(
    email: string,
    name?: string
  ): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
      });
      return customer;
    } catch (error) {
      throw new Error(`Failed to create customer: ${String(error)}`);
    }
  }

  /**
   * Get customer
   */
  static async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      return customer;
    } catch (error) {
      throw new Error(`Failed to get customer: ${String(error)}`);
    }
  }

  /**
   * List customer subscriptions
   */
  static async listCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
      });
      return subscriptions.data;
    } catch (error) {
      throw new Error(`Failed to list subscriptions: ${String(error)}`);
    }
  }

  /**
   * Create a product
   */
  static async createProduct(
    name: string,
    description?: string
  ): Promise<Stripe.Product> {
    try {
      const product = await stripe.products.create({
        name,
        description,
      });
      return product;
    } catch (error) {
      throw new Error(`Failed to create product: ${String(error)}`);
    }
  }

  /**
   * Create a price for a product
   */
  static async createPrice(
    productId: string,
    amount: number,
    currency: string = 'usd',
    billingPeriod: 'month' | 'year' = 'month'
  ): Promise<Stripe.Price> {
    try {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: Math.round(amount * 100), // Convert to cents
        currency,
        recurring: {
          interval: billingPeriod,
        },
      });
      return price;
    } catch (error) {
      throw new Error(`Failed to create price: ${String(error)}`);
    }
  }

  /**
   * Get invoice details
   */
  static async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      return invoice;
    } catch (error) {
      throw new Error(`Failed to get invoice: ${String(error)}`);
    }
  }

  /**
   * List customer invoices
   */
  static async listCustomerInvoices(customerId: string): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await stripe.invoices.list({
        customer: customerId,
      });
      return invoices.data;
    } catch (error) {
      throw new Error(`Failed to list invoices: ${String(error)}`);
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    body: string,
    signature: string,
    webhookSecret: string
  ): Stripe.Event {
    try {
      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      return event;
    } catch (error) {
      throw new Error(`Failed to verify webhook signature: ${String(error)}`);
    }
  }

  /**
   * Handle subscription updated event
   */
  static async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      // Update subscription status in database
      console.log(`Subscription ${subscription.id} updated:`, {
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
      });
    } catch (error) {
      throw new Error(`Failed to handle subscription updated: ${String(error)}`);
    }
  }

  /**
   * Handle subscription deleted event
   */
  static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      // Update subscription status in database
      console.log(`Subscription ${subscription.id} deleted`);
    } catch (error) {
      throw new Error(`Failed to handle subscription deleted: ${String(error)}`);
    }
  }

  /**
   * Handle payment intent succeeded event
   */
  static async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Update payment status in database
      console.log(`Payment ${paymentIntent.id} succeeded`);
    } catch (error) {
      throw new Error(`Failed to handle payment intent succeeded: ${String(error)}`);
    }
  }

  /**
   * Handle payment intent failed event
   */
  static async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Update payment status in database
      console.log(`Payment ${paymentIntent.id} failed:`, paymentIntent.last_payment_error);
    } catch (error) {
      throw new Error(`Failed to handle payment intent failed: ${String(error)}`);
    }
  }
}
