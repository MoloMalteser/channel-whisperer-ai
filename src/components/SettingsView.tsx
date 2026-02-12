import { useState, useEffect } from "react";
import { Info, Moon, Sun, LogOut, Clock } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlatformIcon } from "@/components/PlatformIcon";

const intervalOptions = [
  { label: "15 Min", value: 15 },
  { label: "30 Min", value: 30 },
  { label: "1 Std", value: 60 },
  { label: "3 Std", value: 180 },
  { label: "6 Std", value: 360 },
  { label: "12 Std", value: 720 },
  { label: "24 Std", value: 1440 },
];

export const SettingsView = () => {
  const { theme, setTheme } = useTheme();
  const [checkInterval, setCheckInterval] = useState(60);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load user's check interval
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("check_interval_minutes").eq("user_id", user.id).maybeSingle();
      if (data) setCheckInterval(data.check_interval_minutes);
    };
    loadProfile();
  }, []);

  const handleIntervalChange = async (value: number) => {
    setCheckInterval(value);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ check_interval_minutes: value } as any).eq("user_id", user.id);
    toast("Check-Intervall aktualisiert", { description: intervalOptions.find(o => o.value === value)?.label });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-4 animate-slide-up">
      {/* App Info */}
      <div className="glass rounded-3xl p-5 ios-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full glass flex items-center justify-center">
            <Info className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Social Tracker</p>
            <p className="text-xs text-muted-foreground">v2.1</p>
          </div>
        </div>

        {/* Dark/Light Mode Toggle */}
        <div className="flex items-center justify-between py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="w-4 h-4 text-foreground" /> : <Sun className="w-4 h-4 text-foreground" />}
            <span className="text-sm text-foreground">Dark Mode</span>
          </div>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </div>

        {/* Check Interval */}
        <div className="py-3 border-b border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-foreground" />
            <span className="text-sm text-foreground">Auto-Check Intervall</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {intervalOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleIntervalChange(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all tap-bounce
                  ${checkInterval === opt.value
                    ? "glass-pill-active ios-shadow-sm"
                    : "glass-pill text-muted-foreground hover:text-foreground"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-border/30">
          <span className="text-sm text-foreground">Methode</span>
          <span className="text-xs text-muted-foreground glass-pill rounded-full px-3 py-1">Regex (kein AI)</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-foreground">Benachrichtigungen</span>
          <span className="text-xs text-muted-foreground glass-pill rounded-full px-3 py-1">In-App Toast</span>
        </div>
      </div>

      {/* Supported Platforms */}
      <div className="glass rounded-3xl p-5">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Unterstützte Plattformen</p>
        <div className="flex flex-col gap-2">
          {[
            { platform: "whatsapp", name: "WhatsApp", desc: "Channel-Follower" },
            { platform: "tiktok", name: "TikTok", desc: "Profil-Follower" },
            { platform: "instagram", name: "Instagram", desc: "Profil-Follower" },
            { platform: "youtube", name: "YouTube", desc: "Kanal-Abonnenten" },
          ].map((p) => (
            <div key={p.name} className="flex items-center gap-3 py-2">
              <PlatformIcon platform={p.platform} size={22} />
              <div>
                <p className="text-sm text-foreground font-medium">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="glass rounded-3xl p-4 flex items-center justify-center gap-2 text-destructive text-sm font-medium transition-all tap-bounce hover:bg-destructive/10"
      >
        <LogOut className="w-4 h-4" />
        Abmelden
      </button>
    </div>
  );
};
