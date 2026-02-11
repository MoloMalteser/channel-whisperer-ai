import { useState } from "react";
import { X, Target } from "lucide-react";

interface GoalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (goal: number | null) => void;
  currentGoal: number | null;
}

export const GoalSheet = ({ open, onOpenChange, onSubmit, currentGoal }: GoalSheetProps) => {
  const [value, setValue] = useState(currentGoal?.toString() || "");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(value, 10);
    onSubmit(isNaN(num) ? null : num);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" onClick={() => onOpenChange(false)} />
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto animate-slide-up">
        <div className="glass-strong rounded-t-3xl p-6 pb-10 ios-shadow">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 rounded-full bg-foreground/20" />
          </div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Follower-Ziel</h2>
            </div>
            <button onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-all tap-bounce">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="z.B. 10000"
              autoFocus
              className="w-full h-12 px-4 rounded-2xl glass text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
            />
            <div className="flex gap-2">
              <button type="submit"
                className="flex-1 h-12 rounded-2xl bg-foreground text-background font-semibold text-sm transition-all tap-bounce hover:opacity-90">
                Speichern
              </button>
              {currentGoal && (
                <button type="button" onClick={() => onSubmit(null)}
                  className="h-12 px-5 rounded-2xl glass text-foreground text-sm font-medium transition-all tap-bounce">
                  Entfernen
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
