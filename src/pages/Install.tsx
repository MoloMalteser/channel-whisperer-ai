import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Share, MoreVertical, Plus, ArrowLeft, Smartphone, Monitor, Apple, Chrome } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) setPlatform("ios");
    else if (/Android/.test(ua)) setPlatform("android");
    else setPlatform("desktop");

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => setIsInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-muted-foreground mb-8 tap-bounce"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">Zurück</span>
      </button>

      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 rounded-[22px] glass ios-shadow flex items-center justify-center mb-4">
          <Smartphone className="w-10 h-10 text-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">App installieren</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          Installiere Social Tracker auf deinem Gerät für schnellen Zugriff und Push-Benachrichtigungen.
        </p>
      </div>

      {/* Install Button (Chrome/Android) */}
      {deferredPrompt && !isInstalled && (
        <button
          onClick={handleInstall}
          className="w-full glass-pill-active rounded-2xl p-4 flex items-center justify-center gap-3 text-primary-foreground font-semibold mb-6 tap-bounce ios-shadow"
        >
          <Download className="w-5 h-5" />
          Jetzt installieren
        </button>
      )}

      {isInstalled && (
        <div className="w-full glass rounded-2xl p-4 flex items-center justify-center gap-3 text-foreground font-medium mb-6">
          <span className="text-lg">✅</span>
          App ist bereits installiert!
        </div>
      )}

      {/* Instructions per platform */}
      <div className="flex flex-col gap-4">
        {/* iOS */}
        <div className={`glass rounded-3xl p-5 ios-shadow ${platform === "ios" ? "ring-2 ring-primary/30" : ""}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full glass flex items-center justify-center">
              <Apple className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">iPhone / iPad</p>
              <p className="text-[11px] text-muted-foreground">Safari Browser</p>
            </div>
            {platform === "ios" && (
              <span className="ml-auto text-[10px] font-medium text-primary glass-pill-active px-2 py-0.5 rounded-full">
                Dein Gerät
              </span>
            )}
          </div>
          <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full glass flex items-center justify-center text-xs font-bold text-foreground shrink-0">1</span>
              <span>Öffne diese Seite in <strong className="text-foreground">Safari</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full glass flex items-center justify-center text-xs font-bold text-foreground shrink-0">2</span>
              <span className="flex items-center gap-1.5">
                Tippe auf <Share className="w-4 h-4 text-foreground inline" /> <strong className="text-foreground">Teilen</strong>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full glass flex items-center justify-center text-xs font-bold text-foreground shrink-0">3</span>
              <span className="flex items-center gap-1.5">
                Wähle <Plus className="w-4 h-4 text-foreground inline" /> <strong className="text-foreground">Zum Home-Bildschirm</strong>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full glass flex items-center justify-center text-xs font-bold text-foreground shrink-0">4</span>
              <span>Tippe <strong className="text-foreground">Hinzufügen</strong></span>
            </li>
          </ol>
          <p className="text-[10px] text-muted-foreground mt-3">
            ℹ️ Push-Benachrichtigungen funktionieren auf iOS 16.4+ wenn als PWA installiert.
          </p>
        </div>

        {/* Android */}
        <div className={`glass rounded-3xl p-5 ${platform === "android" ? "ring-2 ring-primary/30" : ""}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full glass flex items-center justify-center">
              <Chrome className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Android</p>
              <p className="text-[11px] text-muted-foreground">Chrome Browser</p>
            </div>
            {platform === "android" && (
              <span className="ml-auto text-[10px] font-medium text-primary glass-pill-active px-2 py-0.5 rounded-full">
                Dein Gerät
              </span>
            )}
          </div>
          <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full glass flex items-center justify-center text-xs font-bold text-foreground shrink-0">1</span>
              <span>Tippe auf den <strong className="text-foreground">Installieren</strong>-Button oben</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full glass flex items-center justify-center text-xs font-bold text-foreground shrink-0">2</span>
              <span className="flex items-center gap-1.5">
                Oder tippe <MoreVertical className="w-4 h-4 text-foreground inline" /> → <strong className="text-foreground">App installieren</strong>
              </span>
            </li>
          </ol>
          <p className="text-[10px] text-muted-foreground mt-3">
            ✅ Push-Benachrichtigungen werden vollständig unterstützt.
          </p>
        </div>

        {/* Desktop */}
        <div className={`glass rounded-3xl p-5 ${platform === "desktop" ? "ring-2 ring-primary/30" : ""}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full glass flex items-center justify-center">
              <Monitor className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Desktop</p>
              <p className="text-[11px] text-muted-foreground">Chrome / Edge / Brave</p>
            </div>
            {platform === "desktop" && (
              <span className="ml-auto text-[10px] font-medium text-primary glass-pill-active px-2 py-0.5 rounded-full">
                Dein Gerät
              </span>
            )}
          </div>
          <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full glass flex items-center justify-center text-xs font-bold text-foreground shrink-0">1</span>
              <span>Klicke auf den <strong className="text-foreground">Installieren</strong>-Button oben</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full glass flex items-center justify-center text-xs font-bold text-foreground shrink-0">2</span>
              <span>Oder klicke auf das <Download className="w-4 h-4 text-foreground inline" /> Symbol in der Adressleiste</span>
            </li>
          </ol>
          <p className="text-[10px] text-muted-foreground mt-3">
            ✅ Push-Benachrichtigungen werden vollständig unterstützt.
          </p>
        </div>
      </div>

      {/* Push Support Info */}
      <div className="glass rounded-3xl p-5 mt-4">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Push-Support nach Browser</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { name: "Chrome (Android)", ok: true },
            { name: "Chrome (Desktop)", ok: true },
            { name: "Safari (iOS 16.4+)", ok: true, note: "Als PWA" },
            { name: "Safari (macOS)", ok: true },
            { name: "Firefox", ok: true },
            { name: "Edge", ok: true },
            { name: "Samsung Internet", ok: true },
            { name: "Opera", ok: true },
          ].map((b) => (
            <div key={b.name} className="flex items-center gap-1.5 py-1.5">
              <span className={b.ok ? "text-green-500" : "text-destructive"}>{b.ok ? "✅" : "❌"}</span>
              <span className="text-muted-foreground">
                {b.name}
                {b.note && <span className="text-[9px] block text-muted-foreground/70">{b.note}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstallPage;
