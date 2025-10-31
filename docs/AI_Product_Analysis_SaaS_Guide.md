# AI Product Analysis SaaS - Complete Setup & Deployment Guide

## Table of Contents
1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Local Development Setup](#local-development-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup with Supabase](#database-setup-with-supabase)
6. [Payment Integration with Stripe](#payment-integration-with-stripe)
7. [Frontend Customization](#frontend-customization)
8. [Deployment Options](#deployment-options)
9. [Production Configuration](#production-configuration)
10. [Maintenance & Scaling](#maintenance--scaling)
11. [Troubleshooting](#troubleshooting)
12. [FAQs](#faqs)

## Introduction
Welcome to the AI Product Analysis SaaS platform! This comprehensive guide will walk you through setting up, customizing, and deploying your SaaS application. The platform is built with modern web technologies including React, Vite, Supabase, and Stripe integration for payments.

## System Requirements

### Development Environment
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or yarn)
- **Git**: Latest stable version
- **Code Editor**: VS Code (recommended) or any modern IDE

### Production Environment
- **Server**: Node.js v18+ environment
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage or AWS S3
- **CDN**: Recommended for global distribution

## Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ai-product-analysis.git
cd ai-product-analysis
```

### 2. Install Dependencies
```bash
# Using npm
npm install

# Or using yarn
yarn install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Application Settings
NODE_ENV=development
PORT=3000
```

### 4. Start Development Servers
```bash
# Start both frontend and backend
npm run dev:all

# Or start them separately
npm run dev      # Frontend
npm run server   # Backend
```

## Database Setup with Supabase

### 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com) and sign up/in
2. Click "New Project"
3. Choose a name, database password, and region
4. Wait for the project to initialize

### 2. Set Up Database Schema
Run the following SQL in the Supabase SQL Editor:

```sql
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users table (extends auth.users)
create table public.user_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  billing_address jsonb,
  payment_method jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Product Analyses table
create table public.product_analyses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  product_name text not null,
  description text,
  target_audience text,
  competitors text[],
  status text default 'pending',
  report_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.user_profiles enable row level security;
alter table public.product_analyses enable row level security;

-- Create RLS policies
create policy "Users can view their own profile"
on public.user_profiles for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.user_profiles for update
using (auth.uid() = id);

create policy "Users can view their own analyses"
on public.product_analyses for select
using (auth.uid() = user_id);

create policy "Users can create analyses"
on public.product_analyses for insert
with check (auth.uid() = user_id);

create policy "Users can update their own analyses"
on public.product_analyses for update
using (auth.uid() = user_id);
```

### 3. Set Up Storage Buckets
1. Go to Storage > Create Bucket
2. Create a bucket named "reports" with public access
3. Set up CORS policy for your domain

## Payment Integration with Stripe

### 1. Create a Stripe Account
1. Sign up at [Stripe](https://stripe.com)
2. Activate your account and complete the onboarding
3. Retrieve your API keys from the Developers section

### 2. Configure Webhooks
1. Go to Developers > Webhooks
2. Add an endpoint: `https://yourdomain.com/api/webhook`
3. Add these events to listen for:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 3. Set Up Products and Prices
1. Go to Products > Add Product
2. Create a subscription product (e.g., "Pro Plan")
3. Set up pricing (e.g., $29/month)
4. Note the Price ID for your frontend

## Frontend Customization

### Branding
1. Update `public/favicon.ico` with your logo
2. Modify theme colors in `src/theme/theme.ts`
3. Update the site metadata in `index.html`

### Pages
- Homepage: `src/pages/Home.tsx`
- Dashboard: `src/pages/Dashboard.tsx`
- Analysis: `src/pages/Analysis.tsx`
- Pricing: `src/pages/Pricing.tsx`
- Account: `src/pages/Account.tsx`

## Deployment Options

### Option 1: Vercel (Recommended)
1. Push your code to a GitHub/GitLab repository
2. Import the repository to Vercel
3. Add environment variables in Vercel settings
4. Deploy!

### Option 2: Self-Hosted
1. Install dependencies:
   ```bash
   npm ci --production
   ```
2. Build the application:
   ```bash
   npm run build
   ```
3. Start the production server:
   ```bash
   npm start
   ```
4. Set up a reverse proxy (Nginx/Apache)
5. Configure SSL with Let's Encrypt

## Production Configuration

### Environment Variables
```env
NODE_ENV=production
PORT=3000
VITE_API_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### Security Headers
Add these headers to your web server configuration:

```nginx
# Nginx example
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;
```

## Maintenance & Scaling

### Database Backups
1. Set up automated backups in Supabase
2. Export data regularly:
   ```bash
   pg_dump -h db.yourproject.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql
   ```

### Monitoring
1. Set up error tracking (Sentry/LogRocket)
2. Monitor server health (UptimeRobot/New Relic)
3. Set up logging (Papertrail/LogDNA)

### Scaling
1. **Vertical Scaling**:
   - Upgrade your server resources
   - Increase database performance tier

2. **Horizontal Scaling**:
   - Add more application instances
   - Set up load balancing
   - Implement database read replicas

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
- Verify Supabase credentials
- Check if database is running
- Verify network connectivity

#### 2. Authentication Problems
- Clear browser cache and cookies
- Check Supabase authentication logs
- Verify JWT configuration

#### 3. Payment Processing
- Check Stripe logs
- Verify webhook signatures
- Test with Stripe test cards

#### 4. Performance Issues
- Check database queries
- Implement caching
- Optimize images and assets

## FAQs

### 1. How do I reset the admin password?
```sql
UPDATE auth.users 
SET encrypted_password = crypt('newpassword', gen_salt('bf')) 
WHERE email = 'admin@example.com';
```

### 2. How do I update the application?
1. Pull the latest changes
2. Update dependencies:
   ```bash
   npm update
   ```
3. Run database migrations if any
4. Restart the application

### 3. How do I add new features?
1. Create a new branch
2. Implement your changes
3. Write tests
4. Submit a pull request
5. Deploy after review

### 4. How do I handle increased traffic?
1. Enable CDN for static assets
2. Implement caching
3. Scale your infrastructure
4. Optimize database queries

## Support
For additional support:
- Documentation: [docs.yourdomain.com](https://docs.yourdomain.com)
- Email: support@yourdomain.com
- GitHub Issues: [github.com/yourusername/ai-product-analysis/issues](https://github.com/yourusername/ai-product-analysis/issues)

---
*Last Updated: October 31, 2025*
*Version: 1.0.0*
