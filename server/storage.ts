import { type Customer, type InsertCustomer } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomerStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<Customer>;
}

export class MemStorage implements IStorage {
  private customers: Map<string, Customer>;

  constructor() {
    this.customers = new Map();
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      (customer) => customer.email === email,
    );
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = { 
      ...insertCustomer, 
      id,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date()
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomerStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<Customer> {
    const customer = this.customers.get(id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    const updatedCustomer = {
      ...customer,
      stripeCustomerId,
      stripeSubscriptionId: stripeSubscriptionId || customer.stripeSubscriptionId
    };
    
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
}

export const storage = new MemStorage();
