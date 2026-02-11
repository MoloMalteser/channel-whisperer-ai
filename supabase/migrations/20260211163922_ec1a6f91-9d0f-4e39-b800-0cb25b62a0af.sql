
-- Add follower goal and platform type to tracked_channels
ALTER TABLE public.tracked_channels
ADD COLUMN IF NOT EXISTS follower_goal integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS platform text DEFAULT 'whatsapp';
