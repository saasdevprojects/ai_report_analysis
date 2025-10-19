-- Add additional form fields to product_analyses table
ALTER TABLE public.product_analyses ADD COLUMN industry TEXT;
ALTER TABLE public.product_analyses ADD COLUMN geographies JSONB;
ALTER TABLE public.product_analyses ADD COLUMN competitors_input JSONB;
ALTER TABLE public.product_analyses ADD COLUMN business_goals JSONB;
ALTER TABLE public.product_analyses ADD COLUMN constraints TEXT;
