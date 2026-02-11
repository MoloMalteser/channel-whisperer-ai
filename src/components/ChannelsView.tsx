import type { TrackedChannel } from "@/pages/Index";
import { Users, Pause, Play, Trash2, Radio, Target } from "lucide-react";

interface ChannelsViewProps {
  channels: TrackedChannel[];
  selectedChannelId: string | null;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toLocaleString("de-DE");
};

const platformIcon: Record<string, string> = {
  whatsapp: "💬", tiktok: "🎵", instagram: "📸", youtube: "▶️", other: "🌐",
};

export const ChannelsView = ({ channels, selectedChannelId, onToggle, onDelete, onSelect }: ChannelsViewProps) => {
  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-slide-up">
        <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-4">
          <Radio className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-foreground font-medium text-lg">Keine Channels</p>
        <p className="text-muted-foreground text-sm mt-1">Tippe + um einen Channel hinzuzufügen</p>
      </div>
    );
  }

  const selected = channels.find(c => c.id === selectedChannelId);

  return (
    <div className="flex flex-col gap-4">
      {/* Hero card */}
      {selected && (
        <div className="glass rounded-3xl p-6 animate-scale-in ios-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${selected.is_active ? "bg-green-400 animate-pulse-subtle" : "bg-muted-foreground"}`} />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {selected.is_active ? "Live" : "Pausiert"}
              </span>
              <span className="text-sm">{platformIcon[selected.platform] || "🌐"}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onToggle(selected.id, selected.is_active)}
                className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-all tap-bounce">
                {selected.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => onDelete(selected.id)}
                className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-destructive transition-all tap-bounce">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-1">{selected.channel_name || "Channel"}</p>

          {selected.latest_count !== null ? (
            <div className="flex items-end gap-3">
              <span className="text-5xl font-bold text-foreground tabular-nums tracking-tight">
                {formatNumber(selected.latest_count)}
              </span>
              <div className="flex items-center gap-1 mb-2">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Followers</span>
              </div>
            </div>
          ) : (
            <p className="text-2xl text-muted-foreground">—</p>
          )}

          {/* Goal progress bar */}
          {selected.follower_goal && selected.latest_count !== null && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">
                    Ziel: {formatNumber(selected.follower_goal)}
                  </span>
                </div>
                <span className="text-[11px] text-foreground font-medium">
                  {Math.min(100, Math.round((selected.latest_count / selected.follower_goal) * 100))}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-foreground/80 transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, (selected.latest_count / selected.follower_goal) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {selected.latest_at && (
            <p className="text-[11px] text-muted-foreground mt-3">
              Zuletzt: {new Date(selected.latest_at).toLocaleString("de-DE", {
                day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          )}
        </div>
      )}

      {/* Channel list */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
          Alle Channels ({channels.length})
        </p>
        {channels.map((ch, i) => {
          const isSelected = ch.id === selectedChannelId;
          return (
            <button key={ch.id} onClick={() => onSelect(ch.id)}
              className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-200 text-left tap-bounce
                animate-slide-up stagger-${Math.min(i + 1, 4)}
                ${isSelected ? "glass-strong ios-shadow-sm" : "glass"}`}
              style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{platformIcon[ch.platform] || "🌐"}</span>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ch.is_active ? "bg-green-400" : "bg-muted-foreground"}`} />
                  <p className="text-sm font-medium text-foreground truncate">
                    {ch.channel_name || "Channel"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ch.follower_goal && ch.latest_count !== null && (
                  <div className="w-8 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                    <div className="h-full rounded-full bg-foreground/60" style={{ width: `${Math.min(100, (ch.latest_count / ch.follower_goal) * 100)}%` }} />
                  </div>
                )}
                {ch.latest_count !== null && (
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {formatNumber(ch.latest_count)}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
