-- Add report_type to distinguish report variants
ALTER TABLE public.product_analyses
  ADD COLUMN IF NOT EXISTS report_type TEXT NOT NULL DEFAULT 'market_research';

-- Backfill any existing rows to default
UPDATE public.product_analyses
SET report_type = COALESCE(report_type, 'market_research');
