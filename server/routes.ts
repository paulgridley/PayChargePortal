import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertCustomerSchema } from "@shared/schema";
import { z } from "zod";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create checkout session for subscription schedule (3-month plan)
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { email, pcnNumber, vehicleRegistration, penaltyAmount } = req.body;

      // Validate and fetch customer
      let customer = await storage.getCustomerByEmail(email);
      if (!customer) {
        customer = await storage.createCustomer({
          email,
          pcnNumber,
          vehicleRegistration,
        });
      }

      // Ensure Stripe customer exists
      let stripeCustomer;
      if (customer.stripeCustomerId) {
        stripeCustomer = await stripe.customers.retrieve(
          customer.stripeCustomerId,
        );
      } else {
        stripeCustomer = await stripe.customers.create({
          email: customer.email,
          metadata: {
            pcnNumber: customer.pcnNumber,
            vehicleRegistration: customer.vehicleRegistration,
          },
        });
        customer = await storage.updateCustomerStripeInfo(
          customer.id,
          stripeCustomer.id,
        );
      }

      // Create product & price
      const product = await stripe.products.create({
        name: `PCN Payment Plan - ${pcnNumber}`,
        description: `Recurring payment plan for PCN ${pcnNumber}, Vehicle ${vehicleRegistration}, Total: £${penaltyAmount}`,
      });

      const monthlyAmountInPence = Math.round((penaltyAmount / 3) * 100);
      const price = await stripe.prices.create({
        unit_amount: monthlyAmountInPence,
        currency: "gbp",
        recurring: { interval: "month" },
        product: product.id,
      });

      // Create 3-iteration subscription schedule
      const schedule = await stripe.subscriptionSchedules.create({
        customer: stripeCustomer.id,
        start_date: "now",
        end_behavior: "cancel",
        metadata: {
          pcnNumber: customer.pcnNumber,
          vehicleRegistration: customer.vehicleRegistration,
          totalPayments: "3",
          penaltyAmount: penaltyAmount.toString(),
          monthlyAmount: (penaltyAmount / 3).toFixed(2),
        },
        phases: [
          {
            items: [{ price: price.id }],
            iterations: 3,
          },
        ],
      });

      // Resolve domain URL
      let domainURL =
        process.env.CUSTOM_DOMAIN_URL ||
        (process.env.WEBSITE_HOSTNAME &&
          `https://${process.env.WEBSITE_HOSTNAME}`) ||
        (process.env.REPL_SLUG &&
          process.env.REPL_OWNER &&
          `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`) ||
        process.env.WEBSITE_URL ||
        "http://localhost:5000";

      console.log("Domain URL for redirects:", domainURL);

      // Create checkout session from the active subscription on schedule
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: stripeCustomer.id,
        subscription: schedule.subscription,
        customer_update: {
          name: "auto",
        },
        success_url: `${domainURL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domainURL}/`,
        metadata: {
          customerId: customer.id,
          pcnNumber: customer.pcnNumber,
          vehicleRegistration: customer.vehicleRegistration,
          penaltyAmount: penaltyAmount.toString(),
          monthlyAmount: (penaltyAmount / 3).toFixed(2),
        },
      });

      const result = {
        sessionId: session.id,
        url: session.url,
        customerId: customer.id,
      };

      console.log("Sending checkout response:", result);
      res.json(result);
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Optional: Retain this for status-checking
  app.get("/api/subscription/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const subscription = await stripe.subscriptions.retrieve(id);
      res.json(subscription);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // OPTIONAL: Remove this if no longer used
  // app.get("/api/checkout-session", ...) → no longer required since cancel_at logic is handled by the schedule

  const httpServer = createServer(app);
  return httpServer;
}
