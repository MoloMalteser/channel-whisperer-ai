import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PlatformIcon } from "@/components/PlatformIcon";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate("/");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Bestätigungs-Email gesendet!", { description: "Prüfe dein Postfach." });
      }
    } catch (err: any) {
      toast.error(err.message || "Fehler bei der Anmeldung");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm flex flex-col gap-6 animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-2xl glass ios-shadow flex items-center justify-center">
            <span className="text-3xl font-bold text-foreground">S</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Social Tracker</h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Willkommen zurück" : "Konto erstellen"}
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleOAuth("google")}
            className="w-full h-12 rounded-2xl glass flex items-center justify-center gap-3 text-sm font-medium text-foreground transition-all tap-bounce hover:bg-[hsl(var(--glass-hover))]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Mit Google anmelden
          </button>
          <button
            onClick={() => handleOAuth("apple")}
            className="w-full h-12 rounded-2xl glass flex items-center justify-center gap-3 text-sm font-medium text-foreground transition-all tap-bounce hover:bg-[hsl(var(--glass-hover))]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="hsl(var(--foreground))">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Mit Apple anmelden
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs text-muted-foreground">oder</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full h-12 px-4 rounded-2xl glass text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            required
            minLength={6}
            className="w-full h-12 px-4 rounded-2xl glass text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-foreground text-background font-semibold text-sm transition-all tap-bounce hover:opacity-90 disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isLogin ? "Anmelden" : "Registrieren"}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          {isLogin ? "Noch kein Konto? Registrieren" : "Bereits ein Konto? Anmelden"}
        </button>
      </div>
    </div>
  );
};

export default Auth;
