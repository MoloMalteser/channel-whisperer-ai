import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LinkInput } from "@/components/LinkInput";
import { FollowerDisplay } from "@/components/FollowerDisplay";
import { LoadingState } from "@/components/LoadingState";
import { TrackedChannelsList } from "@/components/TrackedChannelsList";
import { MessageCircle, Zap } from "lucide-react";

export type AnalysisResult = {
  followerCount: number | null;
  channelName: string;
  rawText: string;
  scrapedAt: string;
  channelId?: string;
};

export type TrackedChannel = {
  id: string;
  url: string;
  channel_name: string | null;
  is_active: boolean;
  created_at: string;
  latest_count: number | null;
  latest_at: string | null;
};

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [channels, setChannels] = useState<TrackedChannel[]>([]);

  const fetchChannels = async () => {
    const { data: channelData, error: chErr } = await supabase
      .from("tracked_channels")
      .select("*")
      .order("created_at", { ascending: false });

    if (chErr || !channelData) return;

    // Get latest snapshot for each channel
    const enriched: TrackedChannel[] = [];
    for (const ch of channelData) {
      const { data: snap } = await supabase
        .from("follower_snapshots")
        .select("follower_count, created_at")
        .eq("channel_id", ch.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      enriched.push({
        id: ch.id,
        url: ch.url,
        channel_name: ch.channel_name,
        is_active: ch.is_active,
        created_at: ch.created_at,
        latest_count: snap?.follower_count ?? null,
        latest_at: snap?.created_at ?? null,
      });
    }

    setChannels(enriched);
  };

  useEffect(() => {
    fetchChannels();

    // Subscribe to realtime changes on follower_snapshots
    const channel = supabase
      .channel("follower-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "follower_snapshots" },
        () => {
          console.log("New snapshot received, refreshing...");
          fetchChannels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "analyze-whatsapp-channel",
        { body: { url } }
      );

      if (fnError) {
        setError(fnError.message || "Fehler bei der Analyse");
        return;
      }

      if (!data?.success) {
        setError(data?.error || "Konnte die Followerzahl nicht ermitteln");
        return;
      }

      setResult({
        followerCount: data.followerCount,
        channelName: data.channelName,
        rawText: data.rawText,
        scrapedAt: data.scrapedAt,
        channelId: data.channelId,
      });

      // Refresh the channel list
      fetchChannels();
    } catch (err) {
      console.error("Error:", err);
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChannel = async (id: string, isActive: boolean) => {
    await supabase
      .from("tracked_channels")
      .update({ is_active: !isActive })
      .eq("id", id);
    fetchChannels();
  };

  const handleDeleteChannel = async (id: string) => {
    await supabase.from("tracked_channels").delete().eq("id", id);
    fetchChannels();
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-8 pt-16">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center glow-border">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              WA Channel Tracker
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Paste einen WhatsApp Channel-Link — wird automatisch jede Minute getrackt
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-[11px] text-primary font-semibold uppercase tracking-wider">
              Auto-Tracking aktiv
            </span>
          </div>
        </div>

        {/* Input */}
        <LinkInput onSubmit={handleAnalyze} isLoading={isLoading} />

        {/* States */}
        {isLoading && <LoadingState />}

        {error && (
          <div className="w-full p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center animate-fade-in">
            {error}
          </div>
        )}

        {result && <FollowerDisplay result={result} />}

        {/* Tracked channels list */}
        {channels.length > 0 && (
          <TrackedChannelsList
            channels={channels}
            onToggle={handleToggleChannel}
            onDelete={handleDeleteChannel}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
