import { useState, useEffect } from "react";
import type { TrackedChannel } from "@/pages/Index";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AnalyticsViewProps {
  channels: TrackedChannel[];
  selectedChannelId: string | null;
}

interface Snapshot {
  follower_count: number | null;
  created_at: string;
}

export const AnalyticsView = ({ channels, selectedChannelId }: AnalyticsViewProps) => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  const selected = channels.find(c => c.id === selectedChannelId);

  useEffect(() => {
    if (!selectedChannelId) return;
    const fetchSnapshots = async () => {
      const { data } = await supabase
        .from("follower_snapshots")
        .select("follower_count, created_at")
        .eq("channel_id", selectedChannelId)
        .order("created_at", { ascending: true })
        .limit(100);
      setSnapshots(data || []);
    };
    fetchSnapshots();
  }, [selectedChannelId]);

  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-slide-up">
        <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-4">
          <BarChart3 className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-foreground font-medium">Kein Channel ausgewählt</p>
        <p className="text-muted-foreground text-sm mt-1">Wähle einen Channel oben aus</p>
      </div>
    );
  }

  const validSnapshots = snapshots.filter(s => s.follower_count !== null);
  const counts = validSnapshots.map(s => s.follower_count!);
  const maxCount = Math.max(...counts, 1);
  const minCount = Math.min(...counts, 0);
  const range = maxCount - minCount || 1;

  // Trend
  const lastTwo = counts.slice(-2);
  const trend = lastTwo.length === 2 ? lastTwo[1] - lastTwo[0] : 0;

  return (
    <div className="flex flex-col gap-4 animate-slide-up">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Aktuell</p>
          <p className="text-lg font-bold text-foreground tabular-nums">
            {selected.latest_count?.toLocaleString("de-DE") ?? "—"}
          </p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Trend</p>
          <div className="flex items-center justify-center gap-1">
            {trend > 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> :
             trend < 0 ? <TrendingDown className="w-4 h-4 text-red-400" /> :
             <Minus className="w-4 h-4 text-muted-foreground" />}
            <p className={`text-lg font-bold tabular-nums ${
              trend > 0 ? "text-green-400" : trend < 0 ? "text-red-400" : "text-muted-foreground"
            }`}>
              {trend > 0 ? `+${trend}` : trend}
            </p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Checks</p>
          <p className="text-lg font-bold text-foreground tabular-nums">{snapshots.length}</p>
        </div>
      </div>

      {/* Mini chart */}
      <div className="glass rounded-3xl p-5 ios-shadow">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-4">
          Verlauf
        </p>
        {validSnapshots.length < 2 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Zu wenig Daten — warte auf mehr Snapshots
          </p>
        ) : (
          <div className="h-32 flex items-end gap-[2px]">
            {validSnapshots.slice(-30).map((s, i) => {
              const height = ((s.follower_count! - minCount) / range) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-foreground/20 hover:bg-foreground/40 transition-colors duration-200 min-w-[3px]"
                  style={{
                    height: `${Math.max(height, 4)}%`,
                    animationDelay: `${i * 20}ms`,
                  }}
                  title={`${s.follower_count?.toLocaleString("de-DE")} — ${new Date(s.created_at).toLocaleString("de-DE")}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Recent snapshots */}
      <div className="glass rounded-3xl p-5">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
          Letzte Einträge
        </p>
        <div className="flex flex-col gap-2">
          {snapshots.slice(-5).reverse().map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <span className="text-xs text-muted-foreground">
                {new Date(s.created_at).toLocaleString("de-DE", {
                  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                })}
              </span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {s.follower_count?.toLocaleString("de-DE") ?? "Fehler"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
