"use client";

import { cn } from "@student-management-system/ui/lib/utils";
import { useEffect, useRef, useState } from "react";

type Tone = "primary" | "success" | "destructive" | "muted";

const TONE_STYLES: Record<Tone, { track: string; indicator: string }> = {
  primary: {
    track: "stroke-[color:var(--surface-info)]",
    indicator: "stroke-[color:var(--primary)]",
  },
  success: {
    track: "stroke-[color:var(--surface-success)]",
    indicator: "stroke-[color:var(--surface-success-foreground)]",
  },
  destructive: {
    track: "stroke-[color:var(--surface-destructive)]",
    indicator: "stroke-[color:var(--surface-destructive-foreground)]",
  },
  muted: {
    track: "stroke-[color:var(--border)]",
    indicator: "stroke-[color:var(--muted-foreground)]",
  },
};

type CircularProgressProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  tone?: Tone;
  className?: string;
  children?: React.ReactNode;
  label?: string;
};

function CircularProgress({
  value,
  size = 140,
  strokeWidth = 12,
  tone = "primary",
  className,
  children,
  label,
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = (1 - clamped) * circumference;
  const tones = TONE_STYLES[tone];
  const percent = Math.round(clamped * 100);

  const [animatedOffset, setAnimatedOffset] = useState(circumference);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setAnimatedOffset(circumference);
        requestAnimationFrame(() => setAnimatedOffset(offset));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [offset, circumference]);

  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={percent}
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      data-slot="circular-progress"
      ref={containerRef}
      role="progressbar"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={tones.track}
        />
        <circle
          className={cn(
            tones.indicator,
            "motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500 motion-safe:ease-out"
          )}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export { CircularProgress };
export type { CircularProgressProps };
