-- ==============================================================================
-- Migration: Add Satellite Tree Detection Columns to farms
-- Purpose:
--   Add columns to store satellite AI tree detection results:
--     - detected_trees (INTEGER)
--     - detection_confidence (NUMERIC)
--     - detected_at (TIMESTAMPTZ)
-- ==============================================================================

ALTER TABLE public.farms
  ADD COLUMN IF NOT EXISTS detected_trees INTEGER,
  ADD COLUMN IF NOT EXISTS detection_confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS detected_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_farms_id ON public.farms (id);
