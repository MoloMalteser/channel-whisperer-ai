import { useRef, useState, useCallback } from "react";
import { Radio, BarChart3, Settings } from "lucide-react";

type Tab = "channels" | "analytics" | "settings";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: typeof Radio }[] = [
  { id: "channels", label: "Channels", icon: Radio },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartTab = useRef(activeTab);

  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    dragStartX.current = clientX;
    dragStartTab.current = activeTab;
  }, [activeTab]);

  const handleDragEnd = useCallback((clientX: number) => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = clientX - dragStartX.current;
    const threshold = 40;
    const currentIdx = tabs.findIndex(t => t.id === dragStartTab.current);

    if (diff > threshold && currentIdx > 0) {
      onTabChange(tabs[currentIdx - 1].id);
    } else if (diff < -threshold && currentIdx < tabs.length - 1) {
      onTabChange(tabs[currentIdx + 1].id);
    }
  }, [isDragging, onTabChange]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div
        ref={containerRef}
        className="glass-pill rounded-full px-2 py-2 flex items-center gap-1 ios-shadow select-none"
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseUp={(e) => handleDragEnd(e.clientX)}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => !isDragging && onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
                transition-all duration-300 ease-out tap-bounce
                ${isActive
                  ? "glass-pill-active ios-shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {isActive && (
                <span className="animate-scale-in text-xs font-semibold">
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
