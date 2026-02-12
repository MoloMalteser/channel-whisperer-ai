import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { PlatformIcon } from "@/components/PlatformIcon";

interface AddChannelSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

const platforms = [
  { id: "whatsapp", label: "WhatsApp", placeholder: "https://whatsapp.com/channel/..." },
  { id: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@username" },
  { id: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel" },
];

export const AddChannelSheet = ({ open, onOpenChange, onSubmit, isLoading }: AddChannelSheetProps) => {
  const [url, setUrl] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState(0);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) { onSubmit(url.trim()); setUrl(""); }
  };

  return (
    <>
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 animate-fade-in" onClick={() => onOpenChange(false)} />
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto animate-slide-up">
        <div className="glass-strong rounded-t-3xl p-6 pb-10 ios-shadow">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 rounded-full bg-muted" />
          </div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">Channel hinzufügen</h2>
            <button onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-all tap-bounce">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Platform selector */}
          <div className="flex gap-2 mb-4">
            {platforms.map((p, i) => (
              <button key={p.id} onClick={() => setSelectedPlatform(i)}
                className={`flex-1 py-2.5 rounded-2xl flex items-center justify-center text-sm transition-all tap-bounce
                  ${i === selectedPlatform ? "glass-pill-active ios-shadow-sm" : "glass-pill text-muted-foreground"}`}>
                <PlatformIcon platform={p.id} size={18} />
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder={platforms[selectedPlatform].placeholder}
              disabled={isLoading} autoFocus
              className="w-full h-12 px-4 rounded-2xl glass text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all disabled:opacity-50" />
            <button type="submit" disabled={isLoading || !url.trim()}
              className="w-full h-12 rounded-2xl bg-foreground text-background font-semibold text-sm transition-all tap-bounce hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Wird hinzugefügt...</> : "Tracken"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
