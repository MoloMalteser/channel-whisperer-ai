
-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Table for tracked WhatsApp channels
CREATE TABLE public.tracked_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  channel_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for follower count history
CREATE TABLE public.follower_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.tracked_channels(id) ON DELETE CASCADE,
  follower_count INTEGER,
  raw_text TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for faster queries
CREATE INDEX idx_follower_snapshots_channel_time ON public.follower_snapshots (channel_id, created_at DESC);
CREATE INDEX idx_tracked_channels_active ON public.tracked_channels (is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.tracked_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follower_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read/write for tracked_channels (no auth required for this simple tool)
CREATE POLICY "Anyone can view tracked channels"
  ON public.tracked_channels FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert tracked channels"
  ON public.tracked_channels FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update tracked channels"
  ON public.tracked_channels FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete tracked channels"
  ON public.tracked_channels FOR DELETE
  USING (true);

-- Public read for snapshots
CREATE POLICY "Anyone can view follower snapshots"
  ON public.follower_snapshots FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert follower snapshots"
  ON public.follower_snapshots FOR INSERT
  WITH CHECK (true);
