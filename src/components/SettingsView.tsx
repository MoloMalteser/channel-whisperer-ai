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
            <p className="text-sm font-semibold text-foreground">Social Tracker</p>
            <p className="text-xs text-muted-foreground">v2.0</p>
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
          <div className="flex items-center justify-between py-3 border-b border-border/30">
            <span className="text-sm text-foreground">Benachrichtigungen</span>
            <span className="text-xs text-muted-foreground glass-pill rounded-full px-3 py-1">In-App Toast</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-foreground">Plattformen</span>
            <div className="flex gap-1.5">
              {["💬", "🎵", "📸", "▶️"].map((e, i) => (
                <span key={i} className="text-sm glass-pill rounded-full w-8 h-8 flex items-center justify-center">{e}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-5">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Unterstützte Plattformen</p>
        <div className="flex flex-col gap-2">
          {[
            { icon: "💬", name: "WhatsApp", desc: "Channel-Follower" },
            { icon: "🎵", name: "TikTok", desc: "Profil-Follower" },
            { icon: "📸", name: "Instagram", desc: "Profil-Follower" },
            { icon: "▶️", name: "YouTube", desc: "Kanal-Abonnenten" },
          ].map((p) => (
            <div key={p.name} className="flex items-center gap-3 py-2">
              <span className="text-lg">{p.icon}</span>
              <div>
                <p className="text-sm text-foreground font-medium">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
