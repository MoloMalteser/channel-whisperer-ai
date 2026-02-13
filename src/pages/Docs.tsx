import { ArrowLeft, Globe, Code2, Zap, Shield, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PlatformIcon } from "@/components/PlatformIcon";

const Docs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-full glass flex items-center justify-center text-foreground tap-bounce"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">API-Dokumentation</h1>
            <p className="text-xs text-muted-foreground">So funktioniert die Follower-Erkennung</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Overview */}
          <section className="glass rounded-3xl p-5 ios-shadow animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-foreground" />
              <h2 className="text-base font-semibold text-foreground">Überblick</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Social Tracker nutzt einen <span className="text-foreground font-medium">deterministischen Regex-Algorithmus</span> (kein AI/ML), 
              um Follower-Zahlen direkt aus dem HTML-Quellcode von Social-Media-Seiten zu extrahieren. 
              Das ist <span className="text-foreground font-medium">schnell, kostenlos und zuverlässig</span>.
            </p>
          </section>

          {/* How it works */}
          <section className="glass rounded-3xl p-5 animate-slide-up stagger-1" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-5 h-5 text-foreground" />
              <h2 className="text-base font-semibold text-foreground">So funktioniert es</h2>
            </div>
            <div className="flex flex-col gap-4">
              <Step number={1} title="URL-Eingabe">
                Du gibst die URL eines Social-Media-Profils oder Channels ein (z.B. 
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded-md mx-1">whatsapp.com/channel/...</code>).
              </Step>
              <Step number={2} title="HTML-Abruf">
                Eine Backend-Funktion ruft die Seite mit einem Browser-User-Agent ab, 
                um die vollständige HTML-Seite zu erhalten — inklusive Meta-Tags.
              </Step>
              <Step number={3} title="Plattform-Erkennung">
                Die URL wird analysiert, um die Plattform zu bestimmen: WhatsApp, TikTok, Instagram oder YouTube. 
                Jede Plattform hat optimierte Parsing-Regeln.
              </Step>
              <Step number={4} title="Regex-Extraktion">
                Follower-Zahlen werden aus <code className="text-xs bg-muted px-1.5 py-0.5 rounded-md mx-1">og:description</code>, 
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded-md mx-1">meta description</code> und dem HTML-Body 
                mit Regex-Patterns extrahiert.
              </Step>
              <Step number={5} title="Zahlen-Parsing">
                Kurzformen werden automatisch umgerechnet: 
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded-md mx-1">1.2K → 1.200</code>, 
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded-md mx-1">3.5M → 3.500.000</code>, 
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded-md mx-1">1B → 1.000.000.000</code>
              </Step>
            </div>
          </section>

          {/* Regex Patterns */}
          <section className="glass rounded-3xl p-5 animate-slide-up stagger-2" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-5 h-5 text-foreground" />
              <h2 className="text-base font-semibold text-foreground">Regex-Patterns</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Zwei Hauptmuster werden verwendet, um Follower-Zahlen in verschiedenen Sprachen zu finden:
            </p>
            <div className="bg-muted/50 rounded-2xl p-4 font-mono text-xs text-foreground leading-relaxed overflow-x-auto">
              <div className="text-muted-foreground mb-1">{"// Pattern 1: Zahl vor dem Keyword"}</div>
              <div className="mb-3">(\d[\d,.]*[KMB]?)\s*(followers|Follower|Abonnenten|subscribers|abonnés)</div>
              <div className="text-muted-foreground mb-1">{"// Pattern 2: Keyword vor der Zahl"}</div>
              <div>(followers|Follower|...)\s*:?\s*(\d[\d,.]*[KMB]?)</div>
            </div>
          </section>

          {/* Supported Platforms */}
          <section className="glass rounded-3xl p-5 animate-slide-up stagger-3" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-foreground" />
              <h2 className="text-base font-semibold text-foreground">Unterstützte Plattformen</h2>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { platform: "whatsapp", name: "WhatsApp", desc: "Extrahiert aus og:description und Channel-Seiten-HTML", keywords: "followers, members, participants" },
                { platform: "tiktok", name: "TikTok", desc: "Liest Follower/Fans aus Profil-Meta-Tags", keywords: "Followers, Fans" },
                { platform: "instagram", name: "Instagram", desc: "Parst das Format '1.2M Followers, 500 Following'", keywords: "Followers" },
                { platform: "youtube", name: "YouTube", desc: "Erkennt Abonnenten in Deutsch und Englisch", keywords: "subscribers, Abonnenten" },
              ].map((p) => (
                <div key={p.platform} className="glass rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <PlatformIcon platform={p.platform} size={20} />
                    <span className="text-sm font-semibold text-foreground">{p.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1.5">{p.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {p.keywords.split(', ').map(k => (
                      <span key={k} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{k}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Edge Function API */}
          <section className="glass rounded-3xl p-5 animate-slide-up stagger-4" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-foreground" />
              <h2 className="text-base font-semibold text-foreground">Backend-Funktion</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Die Edge Function <code className="text-xs bg-muted px-1.5 py-0.5 rounded-md">analyze-whatsapp-channel</code> verarbeitet zwei Modi:
            </p>
            <div className="flex flex-col gap-2">
              <div className="glass rounded-2xl p-4">
                <p className="text-xs font-semibold text-foreground mb-1">Manueller Modus</p>
                <div className="bg-muted/50 rounded-xl p-3 font-mono text-xs text-foreground">
                  POST {`{ "url": "https://whatsapp.com/channel/..." }`}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Gibt <code className="bg-muted px-1 py-0.5 rounded">followerCount</code>, <code className="bg-muted px-1 py-0.5 rounded">channelName</code>, <code className="bg-muted px-1 py-0.5 rounded">platform</code> zurück.
                </p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-xs font-semibold text-foreground mb-1">Cron-Modus</p>
                <div className="bg-muted/50 rounded-xl p-3 font-mono text-xs text-foreground">
                  POST {`{ "mode": "cron" }`}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Aktualisiert alle aktiven Channels automatisch und speichert Snapshots in der Datenbank.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const Step = ({ number, title, children }: { number: number; title: string; children: React.ReactNode }) => (
  <div className="flex gap-3">
    <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
      {number}
    </div>
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{children}</p>
    </div>
  </div>
);

export default Docs;
