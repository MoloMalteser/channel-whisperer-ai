import type { TrackedChannel } from "@/pages/Index";
import { Users, Trash2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrackedChannelsListProps {
  channels: TrackedChannel[];
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString("de-DE");
};

export const TrackedChannelsList = ({
  channels,
  onToggle,
  onDelete,
}: TrackedChannelsListProps) => {
  return (
    <div className="w-full animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Getrackte Channels
        </h2>
        <span className="text-xs text-muted-foreground">({channels.length})</span>
      </div>

      <div className="flex flex-col gap-2">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
              ch.is_active
                ? "bg-card border-border/50"
                : "bg-surface/30 border-border/20 opacity-60"
            }`}
          >
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-sm font-medium text-foreground truncate">
                {ch.channel_name || "Unbekannter Channel"}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono truncate">
                {ch.url}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {ch.latest_count !== null && (
                <div className="text-right">
                  <p className="text-lg font-bold text-primary font-mono tabular-nums">
                    {formatNumber(ch.latest_count)}
                  </p>
                  {ch.latest_at && (
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(ch.latest_at).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onToggle(ch.id, ch.is_active)}
                  title={ch.is_active ? "Pausieren" : "Fortsetzen"}
                >
                  {ch.is_active ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(ch.id)}
                  title="Löschen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
