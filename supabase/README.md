# Supabase Configuration

This directory contains Supabase-related configurations, migrations, and database schemas.

## Directory Structure

- `migrations/` - Database migration files
- `config.toml` - Supabase project configuration
- `seed.sql` - Initial database seed data

## Database Migrations

Migrations are used to manage database schema changes. Each migration file follows the format:
`[timestamp]_[description].sql`

### Running Migrations

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Run migrations:
   ```bash
   supabase db push
   ```

## Database Schema

Key database tables include:
- `users` - User account information
- `analyses` - Analysis history and results
- `reports` - Generated reports

## Authentication

This project uses Supabase Auth for user authentication. The following authentication methods are supported:
- Email/Password
- OAuth providers (Google, GitHub, etc.)
- Magic Links

## Environment Variables

Ensure the following environment variables are set in your `.env` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Local Development

To set up a local Supabase instance:

1. Start the local development environment:
   ```bash
   supabase start
   ```

2. Stop the local environment when done:
   ```bash
   supabase stop
   ```

3. Reset the local database:
   ```bash
   supabase db reset
   ```

## Security

- Row Level Security (RLS) is enabled on all tables
- API keys should never be committed to version control
- Use environment variables for sensitive configuration
