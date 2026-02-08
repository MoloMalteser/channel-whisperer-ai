import type { AnalysisResult } from "@/pages/Index";
import { Users, Clock, Hash } from "lucide-react";

interface FollowerDisplayProps {
  result: AnalysisResult;
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

export const FollowerDisplay = ({ result }: FollowerDisplayProps) => {
  const { followerCount, channelName, rawText, scrapedAt } = result;

  if (followerCount === null) {
    return (
      <div className="w-full p-6 rounded-2xl bg-card border border-border text-center animate-fade-in">
        <p className="text-muted-foreground text-sm">
          Konnte keine Followerzahl finden.
        </p>
        {rawText && (
          <p className="text-muted-foreground/60 text-xs mt-2 font-mono">
            {rawText}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in">
      {/* Main number card */}
      <div className="relative p-8 rounded-2xl bg-card border border-primary/20 glow-border pulse-glow text-center overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Followers
            </span>
          </div>

          <div className="animate-count-up">
            <span className="text-7xl font-bold text-foreground glow-text font-mono tabular-nums">
              {followerCount.toLocaleString("de-DE")}
            </span>
          </div>

          <div className="mt-2 text-primary text-lg font-semibold">
            {formatNumber(followerCount)}
          </div>
        </div>
      </div>

      {/* Meta info */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-surface border border-border/50">
          <Hash className="w-3.5 h-3.5 text-primary" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Channel
            </p>
            <p className="text-sm text-foreground truncate">{channelName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-surface border border-border/50">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Abgefragt
            </p>
            <p className="text-sm text-foreground">
              {new Date(scrapedAt).toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Raw source text */}
      {rawText && (
        <div className="mt-3 p-3 rounded-xl bg-surface/50 border border-border/30">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Quelle
          </p>
          <p className="text-xs text-muted-foreground font-mono leading-relaxed">
            "{rawText}"
          </p>
        </div>
      )}
    </div>
  );
};
