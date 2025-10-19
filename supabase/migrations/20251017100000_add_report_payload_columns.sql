-- Add report payload storage for v2 reports
ALTER TABLE public.product_analyses
  ADD COLUMN IF NOT EXISTS report_version TEXT NOT NULL DEFAULT 'legacy-v1',
  ADD COLUMN IF NOT EXISTS report_payload JSONB,
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT now();

-- Ensure existing legacy rows have an explicit version tag
UPDATE public.product_analyses
SET report_version = COALESCE(report_version, 'legacy-v1')
WHERE report_version IS DISTINCT FROM 'legacy-v1';
