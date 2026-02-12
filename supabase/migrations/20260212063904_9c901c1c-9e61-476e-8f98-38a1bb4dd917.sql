
-- Fix follower_snapshots RLS: allow service role inserts but scope reads to channel owners
DROP POLICY IF EXISTS "Anyone can insert follower snapshots" ON public.follower_snapshots;
DROP POLICY IF EXISTS "Anyone can view follower snapshots" ON public.follower_snapshots;

-- Service role bypasses RLS, so INSERT policy not needed for edge function
-- Users can view snapshots for their own channels
CREATE POLICY "Users can view their channel snapshots"
ON public.follower_snapshots FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tracked_channels tc
    WHERE tc.id = follower_snapshots.channel_id
    AND tc.user_id = auth.uid()
  )
);

-- Allow service role inserts (service role bypasses RLS, but adding for completeness)
CREATE POLICY "Service can insert snapshots"
ON public.follower_snapshots FOR INSERT
WITH CHECK (true);
