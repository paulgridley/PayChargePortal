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
  
  // Create checkout session for subscription
  app.post("/api/create-checkout-session", async (req, res) => {
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

      const domainURL = process.env.NODE_ENV === 'production' 
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` 
        : 'http://localhost:5000';

      // Create Checkout Session with 3-month subscription
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: stripeCustomer.id,
        line_items: [{
          price: price.id,
          quantity: 1,
        }],
        subscription_data: {
          description: `PCN Payment Plan - ${customer.pcnNumber}`,
          metadata: {
            pcnNumber: customer.pcnNumber,
            vehicleRegistration: customer.vehicleRegistration,
            totalPayments: '3',
            paymentReference: customer.pcnNumber
          }
        },
        customer_update: {
          name: 'auto',
        },
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: `Monthly payment for PCN ${customer.pcnNumber}`,
            custom_fields: [
              {
                name: 'PCN Reference',
                value: customer.pcnNumber
              },
              {
                name: 'Vehicle Registration',
                value: customer.vehicleRegistration
              }
            ]
          }
        },
        success_url: `${domainURL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domainURL}/`,
        metadata: {
          customerId: customer.id,
          pcnNumber: customer.pcnNumber,
          vehicleRegistration: customer.vehicleRegistration
        }
      });

      res.json({ 
        sessionId: session.id,
        url: session.url,
        customerId: customer.id
      });

    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Get checkout session details
  app.get("/api/checkout-session", async (req, res) => {
    try {
      const { sessionId } = req.query;
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'Session ID is required' });
      }
      
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      res.json(session);
    } catch (error: any) {
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
