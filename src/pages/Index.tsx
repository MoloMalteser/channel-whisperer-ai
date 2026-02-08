import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LinkInput } from "@/components/LinkInput";
import { FollowerDisplay } from "@/components/FollowerDisplay";
import { LoadingState } from "@/components/LoadingState";
import { MessageCircle } from "lucide-react";

export type AnalysisResult = {
  followerCount: number | null;
  channelName: string;
  rawText: string;
  scrapedAt: string;
};

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "analyze-whatsapp-channel",
        { body: { url } }
      );

      if (fnError) {
        setError(fnError.message || "Fehler bei der Analyse");
        return;
      }

      if (!data?.success) {
        setError(data?.error || "Konnte die Followerzahl nicht ermitteln");
        return;
      }

      setResult({
        followerCount: data.followerCount,
        channelName: data.channelName,
        rawText: data.rawText,
        scrapedAt: data.scrapedAt,
      });
    } catch (err) {
      console.error("Error:", err);
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-10">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center glow-border">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              WA Channel Tracker
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Paste einen WhatsApp Channel-Link und sieh die Followerzahl
            </p>
          </div>
        </div>

        {/* Input */}
        <LinkInput onSubmit={handleAnalyze} isLoading={isLoading} />

        {/* States */}
        {isLoading && <LoadingState />}

        {error && (
          <div className="w-full p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center animate-fade-in">
            {error}
          </div>
        )}

        {result && <FollowerDisplay result={result} />}
      </div>
    </div>
  );
};

export default Index;
