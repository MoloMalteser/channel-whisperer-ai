import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { Radio, BarChart3, Settings, LucideProps } from "lucide-react";

type Tab = "channels" | "analytics" | "settings";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

interface TabItem {
  id: Tab;
  label: string;
  icon: React.ComponentType<LucideProps>;
}

const tabs: TabItem[] = [
  { id: "channels", label: "Channels", icon: Radio },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(280);
  const [isDragging, setIsDragging] = useState(false);

  // Dynamic indicator width: wider when showing label, narrower when dragging
  const indicatorWidthIdle = 80;
  const indicatorWidthDrag = 44;
  const currentIndicatorWidth = isDragging ? indicatorWidthDrag : indicatorWidthIdle;
  const indicatorHeight = 40;
  const tabWidth = width / tabs.length;
  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  const x = useMotionValue(activeIndex * tabWidth + tabWidth / 2 - currentIndicatorWidth / 2);
  const springX = useSpring(x, { stiffness: 800, damping: 45 });

  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const springScaleX = useSpring(scaleX, { stiffness: 400, damping: 15 });
  const springScaleY = useSpring(scaleY, { stiffness: 400, damping: 15 });

  const lastX = useRef(0);
  const lastT = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => setWidth(containerRef.current!.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!isDragging) {
      x.set(activeIndex * tabWidth + tabWidth / 2 - currentIndicatorWidth / 2);
    }
  }, [activeIndex, isDragging, tabWidth, x, currentIndicatorWidth]);

  const setFromClientX = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const local = clientX - rect.left;
    const max = width - currentIndicatorWidth;
    x.set(Math.max(0, Math.min(local - currentIndicatorWidth / 2, max)));
  };

  const wobble = (clientX: number) => {
    const now = performance.now();
    const dt = Math.max(1, now - lastT.current);
    const v = (clientX - lastX.current) / dt;
    const f = Math.min(Math.abs(v) * 2.4, 0.8);
    scaleX.set(1.2 + f);
    scaleY.set(0.8 - f * 0.4);
    lastX.current = clientX;
    lastT.current = now;
  };

  const snap = () => {
    const current = x.get();
    const index = Math.round((current + currentIndicatorWidth / 2 - tabWidth / 2) / tabWidth);
    const clamped = Math.max(0, Math.min(index, tabs.length - 1));
    onTabChange(tabs[clamped].id);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs z-50 px-4">
      <div
        ref={containerRef}
        className="relative w-full h-14 rounded-full glass-pill ios-shadow touch-none overflow-hidden flex items-center select-none"
        onPointerDown={(e) => {
          setIsDragging(true);
          scaleX.set(1.3);
          scaleY.set(0.7);
          lastX.current = e.clientX;
          lastT.current = performance.now();
          setFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (!isDragging) return;
          setFromClientX(e.clientX);
          wobble(e.clientX);
        }}
        onPointerUp={() => {
          setIsDragging(false);
          scaleX.set(1);
          scaleY.set(1);
          snap();
        }}
        onPointerCancel={() => {
          setIsDragging(false);
          scaleX.set(1);
          scaleY.set(1);
          snap();
        }}
      >
        {/* Wobble Indicator */}
        <motion.div
          className="absolute rounded-full z-40 bg-primary"
          style={{
            width: currentIndicatorWidth,
            height: indicatorHeight,
            left: 0,
            top: "50%",
            y: "-50%",
            x: springX,
            scaleX: springScaleX,
            scaleY: springScaleY,
            originY: "center",
          }}
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />

        {/* Icons + Labels */}
        <div
          className="absolute inset-0 z-50 pointer-events-none items-center"
          style={{ display: "grid", gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
        >
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = t.id === activeTab;
            return (
              <div key={t.id} className="flex justify-center items-center gap-1.5 h-full">
                <Icon
                  className={active ? "text-primary-foreground" : "text-muted-foreground"}
                  size={active && !isDragging ? 16 : 20}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                <AnimatePresence>
                  {active && !isDragging && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-primary-foreground text-[11px] font-semibold whitespace-nowrap overflow-hidden"
                    >
                      {t.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
