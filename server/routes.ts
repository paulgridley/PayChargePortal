import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertCustomerSchema } from "@shared/schema";
import { z } from "zod";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create customer and subscription
  app.post("/api/create-subscription", async (req, res) => {
    try {
      const { email, pcnNumber, vehicleRegistration } = insertCustomerSchema.parse(req.body);
      
      // Check if customer already exists
      let customer = await storage.getCustomerByEmail(email);
      
      if (!customer) {
        // Create new customer record
        customer = await storage.createCustomer({
          email,
          pcnNumber,
          vehicleRegistration
        });
      }

      // Create Stripe customer if not exists
      let stripeCustomer;
      if (customer.stripeCustomerId) {
        stripeCustomer = await stripe.customers.retrieve(customer.stripeCustomerId);
      } else {
        stripeCustomer = await stripe.customers.create({
          email: customer.email,
          metadata: {
            pcnNumber: customer.pcnNumber,
            vehicleRegistration: customer.vehicleRegistration
          }
        });
        
        // Update customer with Stripe ID
        customer = await storage.updateCustomerStripeInfo(customer.id, stripeCustomer.id);
      }

      // Create a product and price for the PCN payment (£30/month for 3 months)
      const product = await stripe.products.create({
        name: `PCN Payment Plan - ${pcnNumber}`,
        description: `Recurring payment plan for PCN ${pcnNumber}, Vehicle ${vehicleRegistration}`,
      });

      const price = await stripe.prices.create({
        unit_amount: 3000, // £30.00 in pence
        currency: 'gbp',
        recurring: {
          interval: 'month',
          interval_count: 1,
        },
        product: product.id,
      });

      // Create subscription with 3-month duration
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{
          price: price.id,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          pcnNumber: customer.pcnNumber,
          vehicleRegistration: customer.vehicleRegistration,
          totalPayments: '3'
        },
        // Set subscription to cancel after 3 payments
        cancel_at: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days from now
      });

      // Update customer with subscription ID
      await storage.updateCustomerStripeInfo(customer.id, stripeCustomer.id, subscription.id);

      const latestInvoice = subscription.latest_invoice as any;
      const paymentIntent = latestInvoice?.payment_intent;
      
      res.json({ 
        clientSecret: paymentIntent?.client_secret,
        subscriptionId: subscription.id,
        customerId: customer.id
      });

    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Get subscription status
  app.get("/api/subscription/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const subscription = await stripe.subscriptions.retrieve(id);
      res.json(subscription);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
