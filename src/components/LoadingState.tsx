import { Loader2 } from "lucide-react";

export const LoadingState = () => {
  return (
    <div className="w-full flex flex-col items-center gap-4 py-8 animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-2xl animate-ping bg-primary/5" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm text-foreground font-medium">Analysiere Channel...</p>
        <p className="text-xs text-muted-foreground">
          Seite wird gescraped und von AI ausgewertet
        </p>
      </div>
    </div>
  );
};
