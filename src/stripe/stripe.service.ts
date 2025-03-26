import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: stripe.Stripe;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new stripe.Stripe(configService.get<string>('STRIPE_KEY'), {
      apiVersion: '2025-02-24.acacia',
    });
  }

  getCheckoutSession = async (id: string) => {
    return this.stripe.checkout.sessions.retrieve(id);
  };

  getSubscription = async (id: string) => {
    return this.stripe.subscriptions.retrieve(id);
  };

  createProduct = async (
    name: string,
    defaultPrice?: stripe.Stripe.ProductCreateParams.DefaultPriceData,
  ): Promise<stripe.Stripe.Product> => {
    return this.stripe.products.create({
      name,
      default_price_data: defaultPrice,
      expand: defaultPrice ? ['default_price'] : undefined,
    });
  };

  disactivateProduct = (id: string) => {
    return this.stripe.products.update(id, {
      active: false,
    });
  };

  removeProduct = (id: string) => {
    return this.stripe.products.del(id);
  };

  createPrice = (
    productId: string,
    currency: string,
    amount: number,
    interval: stripe.Stripe.PriceCreateParams.Recurring.Interval,
  ) => {
    return this.stripe.prices.create({
      product: productId,
      currency: currency,
      unit_amount: amount,
      billing_scheme: 'per_unit',
      recurring: interval ? { interval } : undefined,
    });
  };

  disactivatePrice = (id: string) => {
    return this.stripe.prices.update(id, {
      active: false,
    });
  };

  createCustomer = async (
    email: string,
    name: string,
  ): Promise<stripe.Stripe.Customer> => {
    return this.stripe.customers.create({
      email,
      name,
    });
  };

  updateCustomer = async (id: string, email: string, name: string) => {
    return this.stripe.customers.update(id, {
      email,
      name,
    });
  };

  removeCustomer = async (id: string) => {
    return this.stripe.customers.del(id);
  };

  createSubscription = async (
    customerId: string,
    priceId: string,
  ): Promise<stripe.Stripe.Subscription> => {
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
    });
  };

  cancelSubscription = (
    subscriptionId: string,
  ): Promise<stripe.Stripe.Subscription> => {
    return this.stripe.subscriptions.cancel(subscriptionId);
  };

  createCustomerPortalSession = async (
    customerId: string,
  ): Promise<stripe.Stripe.BillingPortal.Session> => {
    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
    });
  };

  createPurchaseSession = async (
    customerId: string,
    priceId: string,
    userId: string,
    movieId: string,
  ): Promise<stripe.Stripe.Checkout.Session> => {
    return this.stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.configService.get(
        'CLIENT_URL',
      )}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      customer: customerId,
      mode: 'payment',
      metadata: {
        userId,
        movieId,
        priceId,
      },
    });
  };

  createSubscriptionSession = async (
    customerId: string,
    priceId: string,
    userId: string,
    currencyId: string,
  ): Promise<stripe.Stripe.Checkout.Session> => {
    return this.stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.configService.get(
        'CLIENT_URL',
      )}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      customer: customerId,
      mode: 'subscription',
      currency: currencyId,
      subscription_data: {
        metadata: {
          userId,
        },
      },
    });
  };

  constructEvent = (
    payload: any,
    signature: string | string[],
    webhookSecret: string,
  ): stripe.Stripe.Event => {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  };
}
