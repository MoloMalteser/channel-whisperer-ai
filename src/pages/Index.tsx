import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChannelsView } from "@/components/ChannelsView";
import { AnalyticsView } from "@/components/AnalyticsView";
import { SettingsView } from "@/components/SettingsView";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { AddChannelSheet } from "@/components/AddChannelSheet";
import { GoalSheet } from "@/components/GoalSheet";
import { Swipeable } from "@/hooks/use-swipe";
import { toast } from "sonner";

export type TrackedChannel = {
  id: string;
  url: string;
  channel_name: string | null;
  is_active: boolean;
  created_at: string;
  latest_count: number | null;
  latest_at: string | null;
  follower_goal: number | null;
  platform: string;
};

type Tab = "channels" | "analytics" | "settings";
const tabOrder: Tab[] = ["channels", "analytics", "settings"];

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("channels");
  const [channels, setChannels] = useState<TrackedChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showGoalSheet, setShowGoalSheet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [prevCounts, setPrevCounts] = useState<Record<string, number>>({});

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
        follower_goal: (ch as any).follower_goal ?? null,
        platform: (ch as any).platform ?? 'whatsapp',
      });
    }

    // Check for changes and notify
    enriched.forEach(ch => {
      if (ch.latest_count !== null && prevCounts[ch.id] !== undefined) {
        const diff = ch.latest_count - prevCounts[ch.id];
        if (diff !== 0) {
          const name = ch.channel_name || 'Channel';
          const sign = diff > 0 ? '+' : '';
          toast(`${name}: ${sign}${diff} Follower`, {
            description: `Jetzt: ${ch.latest_count.toLocaleString("de-DE")}`,
          });
        }
        // Check goal reached
        if (ch.follower_goal && ch.latest_count >= ch.follower_goal && prevCounts[ch.id] < ch.follower_goal) {
          toast.success(`🎉 Ziel erreicht!`, {
            description: `${ch.channel_name || 'Channel'} hat ${ch.follower_goal.toLocaleString("de-DE")} Follower erreicht!`,
          });
        }
      }
    });

    const newCounts: Record<string, number> = {};
    enriched.forEach(ch => { if (ch.latest_count !== null) newCounts[ch.id] = ch.latest_count; });
    setPrevCounts(newCounts);

    setChannels(enriched);
    if (!selectedChannelId && enriched.length > 0) setSelectedChannelId(enriched[0].id);
  };

  useEffect(() => {
    fetchChannels();
    const channel = supabase
      .channel("follower-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "follower_snapshots" }, () => fetchChannels())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSwipe = (dir: "left" | "right") => {
    const idx = tabOrder.indexOf(activeTab);
    if (dir === "left" && idx < tabOrder.length - 1) setActiveTab(tabOrder[idx + 1]);
    if (dir === "right" && idx > 0) setActiveTab(tabOrder[idx - 1]);
  };

  const handleAddChannel = async (url: string) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-whatsapp-channel", { body: { url } });
      if (fnError || !data?.success) {
        toast.error("Fehler beim Hinzufügen", { description: data?.error || fnError?.message });
      } else {
        toast.success("Channel hinzugefügt!", { description: data.channelName });
        if (data.channelId) setSelectedChannelId(data.channelId);
      }
      fetchChannels();
    } catch { toast.error("Verbindungsfehler"); }
    finally { setIsLoading(false); setShowAddSheet(false); }
  };

  const handleSetGoal = async (goal: number | null) => {
    if (!selectedChannelId) return;
    await supabase.from("tracked_channels").update({ follower_goal: goal } as any).eq("id", selectedChannelId);
    if (goal) toast("Ziel gesetzt!", { description: `${goal.toLocaleString("de-DE")} Follower` });
    fetchChannels();
    setShowGoalSheet(false);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await supabase.from("tracked_channels").update({ is_active: !isActive }).eq("id", id);
    fetchChannels();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("tracked_channels").delete().eq("id", id);
    if (selectedChannelId === id) setSelectedChannelId(channels.find(c => c.id !== id)?.id || null);
    fetchChannels();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-lg mx-auto relative">
      <TopBar
        channels={channels}
        selectedChannelId={selectedChannelId}
        onSelectChannel={setSelectedChannelId}
        onAddChannel={() => setShowAddSheet(true)}
        onSetGoal={() => setShowGoalSheet(true)}
      />

      <Swipeable onSwipeLeft={() => handleSwipe("left")} onSwipeRight={() => handleSwipe("right")}>
        <main className="flex-1 overflow-y-auto pb-24 px-4 pt-2 min-h-[60vh]">
          {activeTab === "channels" && (
            <ChannelsView channels={channels} selectedChannelId={selectedChannelId}
              onToggle={handleToggle} onDelete={handleDelete} onSelect={setSelectedChannelId} />
          )}
          {activeTab === "analytics" && (
            <AnalyticsView channels={channels} selectedChannelId={selectedChannelId} />
          )}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </Swipeable>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <AddChannelSheet open={showAddSheet} onOpenChange={setShowAddSheet} onSubmit={handleAddChannel} isLoading={isLoading} />
      <GoalSheet open={showGoalSheet} onOpenChange={setShowGoalSheet} onSubmit={handleSetGoal}
        currentGoal={channels.find(c => c.id === selectedChannelId)?.follower_goal ?? null} />
    </div>
  );
};

export default Index;
