import type { TrackedChannel } from "@/pages/Index";
import { Plus, MoreHorizontal } from "lucide-react";
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
}

export const TopBar = ({ channels, selectedChannelId, onSelectChannel, onAddChannel }: TopBarProps) => {
  return (
    <div className="sticky top-0 z-40 px-4 pt-4 pb-3">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          Tracker
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddChannel}
            className="w-9 h-9 rounded-full glass flex items-center justify-center
                       text-foreground hover:bg-[hsl(var(--glass-hover))]
                       transition-all duration-200 active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-9 h-9 rounded-full glass flex items-center justify-center
                           text-foreground hover:bg-[hsl(var(--glass-hover))]
                           transition-all duration-200 active:scale-95"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong rounded-2xl border-0 ios-shadow min-w-[180px]">
              <DropdownMenuItem className="rounded-xl text-sm cursor-pointer">
                Alle aktualisieren
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl text-sm cursor-pointer">
                Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Channel pills */}
      {channels.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {channels.map((ch) => {
            const isSelected = ch.id === selectedChannelId;
            return (
              <button
                key={ch.id}
                onClick={() => onSelectChannel(ch.id)}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium
                  transition-all duration-300 ease-out active:scale-95
                  ${isSelected
                    ? "glass-pill-active ios-shadow-sm"
                    : "glass-pill text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {ch.channel_name || "Channel"}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
