import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChannelsView } from "@/components/ChannelsView";
import { AnalyticsView } from "@/components/AnalyticsView";
import { SettingsView } from "@/components/SettingsView";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { AddChannelSheet } from "@/components/AddChannelSheet";

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
  const [activeTab, setActiveTab] = useState<"channels" | "analytics" | "settings">("channels");
  const [channels, setChannels] = useState<TrackedChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChannels = async () => {
    const { data: channelData, error: chErr } = await supabase
      .from("tracked_channels")
      .select("*")
      .order("created_at", { ascending: false });

    if (chErr || !channelData) return;

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
    if (!selectedChannelId && enriched.length > 0) {
      setSelectedChannelId(enriched[0].id);
    }
  };

  useEffect(() => {
    fetchChannels();
    const channel = supabase
      .channel("follower-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "follower_snapshots" }, () => {
        fetchChannels();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAddChannel = async (url: string) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "analyze-whatsapp-channel",
        { body: { url } }
      );
      if (fnError || !data?.success) {
        console.error("Error:", fnError || data?.error);
      } else if (data.channelId) {
        setSelectedChannelId(data.channelId);
      }
      fetchChannels();
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
      setShowAddSheet(false);
    }
  };

  const handleToggleChannel = async (id: string, isActive: boolean) => {
    await supabase.from("tracked_channels").update({ is_active: !isActive }).eq("id", id);
    fetchChannels();
  };

  const handleDeleteChannel = async (id: string) => {
    await supabase.from("tracked_channels").delete().eq("id", id);
    if (selectedChannelId === id) {
      setSelectedChannelId(channels.find(c => c.id !== id)?.id || null);
    }
    fetchChannels();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-lg mx-auto relative">
      <TopBar
        channels={channels}
        selectedChannelId={selectedChannelId}
        onSelectChannel={setSelectedChannelId}
        onAddChannel={() => setShowAddSheet(true)}
      />

      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-2">
        {activeTab === "channels" && (
          <ChannelsView
            channels={channels}
            selectedChannelId={selectedChannelId}
            onToggle={handleToggleChannel}
            onDelete={handleDeleteChannel}
            onSelect={setSelectedChannelId}
          />
        )}
        {activeTab === "analytics" && (
          <AnalyticsView
            channels={channels}
            selectedChannelId={selectedChannelId}
          />
        )}
        {activeTab === "settings" && <SettingsView />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <AddChannelSheet
        open={showAddSheet}
        onOpenChange={setShowAddSheet}
        onSubmit={handleAddChannel}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Index;
