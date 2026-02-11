import { Info } from "lucide-react";

export const SettingsView = () => {
  return (
    <div className="flex flex-col gap-4 animate-slide-up">
      <div className="glass rounded-3xl p-5 ios-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full glass flex items-center justify-center">
            <Info className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">WA Channel Tracker</p>
            <p className="text-xs text-muted-foreground">v1.0</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between py-3 border-b border-border/30">
            <span className="text-sm text-foreground">Auto-Tracking</span>
            <span className="text-xs text-muted-foreground glass-pill rounded-full px-3 py-1">Jede Minute</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border/30">
            <span className="text-sm text-foreground">Methode</span>
            <span className="text-xs text-muted-foreground glass-pill rounded-full px-3 py-1">Regex (kein AI)</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-foreground">Scraper</span>
            <span className="text-xs text-muted-foreground glass-pill rounded-full px-3 py-1">Direct Fetch</span>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-5">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
          Über
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Dieser Tracker überwacht WhatsApp-Channel Follower automatisch jede Minute.
          Kein AI nötig — die Follower-Zahl wird direkt aus den Meta-Tags der Seite extrahiert.
        </p>
      </div>
    </div>
  );
};
