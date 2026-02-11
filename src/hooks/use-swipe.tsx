import { useState, useRef, TouchEvent, ReactNode } from "react";

interface SwipeableProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export const useSwipe = (onSwipeLeft?: () => void, onSwipeRight?: () => void, threshold = 60) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [swiping, setSwiping] = useState(false);
  const [offset, setOffset] = useState(0);

  const onTouchStart = (e: TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setSwiping(true);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!touchStart.current) return;
    const deltaX = e.touches[0].clientX - touchStart.current.x;
    const deltaY = e.touches[0].clientY - touchStart.current.y;
    // Only horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setOffset(deltaX * 0.3); // damped
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.current.y;

    if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) onSwipeRight?.();
      else onSwipeLeft?.();
    }

    touchStart.current = null;
    setSwiping(false);
    setOffset(0);
  };

  return { onTouchStart, onTouchMove, onTouchEnd, offset, swiping };
};

export const Swipeable = ({ children, onSwipeLeft, onSwipeRight, threshold = 60 }: SwipeableProps) => {
  const { onTouchStart, onTouchMove, onTouchEnd, offset } = useSwipe(onSwipeLeft, onSwipeRight, threshold);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ transform: `translateX(${offset}px)`, transition: offset === 0 ? "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)" : "none" }}
    >
      {children}
    </div>
  );
};
