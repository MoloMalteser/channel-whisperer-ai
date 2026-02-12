import type { TrackedChannel } from "@/pages/Index";
import { Plus, MoreHorizontal, Target } from "lucide-react";
import { PlatformIcon } from "@/components/PlatformIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  channels: TrackedChannel[];
  selectedChannelId: string | null;
  onSelectChannel: (id: string) => void;
  onAddChannel: () => void;
  onSetGoal: () => void;
}

export const TopBar = ({ channels, selectedChannelId, onSelectChannel, onAddChannel, onSetGoal }: TopBarProps) => {
  return (
    <div className="sticky top-0 z-40 px-4 pt-4 pb-3">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-foreground tracking-tight">Tracker</h1>
        <div className="flex items-center gap-2">
          <button onClick={onAddChannel}
            className="w-9 h-9 rounded-full glass flex items-center justify-center text-foreground hover:bg-[hsl(var(--glass-hover))] transition-all tap-bounce">
            <Plus className="w-5 h-5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-full glass flex items-center justify-center text-foreground hover:bg-[hsl(var(--glass-hover))] transition-all tap-bounce">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong rounded-2xl border-0 ios-shadow min-w-[180px]">
              <DropdownMenuItem onClick={onSetGoal} className="rounded-xl text-sm cursor-pointer gap-2">
                <Target className="w-4 h-4" /> Follower-Ziel setzen
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl text-sm cursor-pointer">
                Alle aktualisieren
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {channels.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {channels.map((ch) => {
            const isSelected = ch.id === selectedChannelId;
            return (
              <button key={ch.id} onClick={() => onSelectChannel(ch.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ease-out tap-bounce
                  ${isSelected ? "glass-pill-active ios-shadow-sm" : "glass-pill text-muted-foreground hover:text-foreground"}`}>
                <PlatformIcon platform={ch.platform} size={14} />
                {ch.channel_name || "Channel"}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
