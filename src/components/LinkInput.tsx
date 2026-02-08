import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface LinkInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export const LinkInput = ({ onSubmit, isLoading }: LinkInputProps) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full animate-fade-in">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://whatsapp.com/channel/..."
            disabled={isLoading}
            className="h-12 bg-surface border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 rounded-xl pl-4 pr-4 text-sm font-mono"
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold transition-all duration-200 hover:shadow-[var(--shadow-glow)] disabled:opacity-40"
        >
          <Search className="w-4 h-4 mr-2" />
          Tracken
        </Button>
      </div>
    </form>
  );
};
