# Payment Portal Application

## Overview

This is a full-stack payment portal application built with a React frontend and Express backend. The application handles customer subscription payments using Stripe integration, with a focus on penalty charge notice (PCN) payment plans. The system allows customers to set up recurring monthly payments for a 3-month period.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Payment Integration**: Stripe React SDK for secure payment processing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Payment Processing**: Stripe API for subscription management
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: Hot reload with Vite middleware integration

### Data Storage
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Migrations**: Drizzle Kit for database schema management
- **Fallback Storage**: In-memory storage implementation for development

## Key Components

### Database Schema
- **Customers Table**: Stores customer information including email, PCN number, vehicle registration, and Stripe integration data
- **Fields**: id (UUID), email (unique), pcnNumber, vehicleRegistration, stripeCustomerId, stripeSubscriptionId, createdAt

### Payment Flow
1. Customer enters payment details on the payment portal
2. System creates or retrieves customer record
3. Stripe customer and subscription are created
4. Payment confirmation and success handling
5. Automatic recurring billing setup

### Frontend Components
- **Payment Portal**: Main form for customer data collection and payment setup
- **Payment Success**: Confirmation page with next steps information
- **UI Components**: Comprehensive shadcn/ui component library including forms, cards, buttons, and payment elements

### Backend Services
- **Storage Interface**: Abstracted storage layer with both database and in-memory implementations
- **Route Handlers**: RESTful API endpoints for subscription creation
- **Stripe Integration**: Secure payment processing and subscription management

## Data Flow

1. **Customer Registration**: User submits email, PCN number, and vehicle registration
2. **Customer Lookup**: System checks for existing customer records
3. **Stripe Integration**: Creates Stripe customer and subscription objects
4. **Database Persistence**: Stores customer and Stripe relationship data
5. **Payment Processing**: Handles secure payment confirmation via Stripe
6. **Success Confirmation**: Redirects to success page with subscription details

## External Dependencies

### Core Dependencies
- **@stripe/stripe-js & @stripe/react-stripe-js**: Stripe payment integration
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm & @neondatabase/serverless**: Database ORM and Neon connection
- **express**: Web application framework
- **react & react-dom**: Frontend UI framework

### UI Dependencies
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety and development experience
- **tsx**: TypeScript execution for Node.js

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React application to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Assets**: Static assets served from build output

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **STRIPE_SECRET_KEY**: Stripe API secret key (required)
- **VITE_STRIPE_PUBLIC_KEY**: Stripe publishable key for frontend

### Production Setup
- **Single Server**: Express serves both API routes and static frontend
- **Database**: PostgreSQL via Neon serverless platform
- **Payment Processing**: Stripe handles all payment operations
- **Session Management**: PostgreSQL-backed session store for scalability

### Development Features
- **Hot Reload**: Vite middleware provides instant feedback during development
- **Error Handling**: Runtime error overlay for development debugging
- **Request Logging**: Detailed API request logging with response capture
- **Type Safety**: Full TypeScript coverage across frontend and backend