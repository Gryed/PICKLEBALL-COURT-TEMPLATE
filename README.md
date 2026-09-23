# Pickleball Court Reservation Template

A production-ready, multi-tenant pickleball court reservation platform built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Features

- Multi-tenant organization architecture
- Organization-specific branding and configuration
- Customer court reservations
- Public court availability
- Booking lookup
- Customer accounts
- Open Play sessions
- Payment and payment-proof workflows
- Admin back-office
- Super Admin organization management
- Court management
- Operating hours
- Reports
- Notifications
- Supabase authentication and authorization
- Tenant-scoped data access
- Vercel deployment support

## Technology

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- React Router
- Vercel

## Architecture

This project uses a shared application core with organization-specific configuration.

Each organization can have its own:

- Logo
- Colors
- Typography
- Hero images
- Landing page content
- Court configuration
- Operating hours
- Payment settings
- Branding

The application remains a single shared codebase.

## Environment Variables

Create a local `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key