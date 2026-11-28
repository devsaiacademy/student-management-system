import type { Level } from "@student-management-system/db/schema/constants";

export const BAR_COLOR = "#0769AB";

// One fixed colour per level, so a level keeps its colour even when other
// levels have 0 students and drop out of the pie. Ordered to match the
// chart's sort order; validated so neighbouring slices stay distinguishable
// for colour-blind readers (adjacent CVD ΔE ≥ 9).
export const LEVEL_COLORS: Record<Level, string> = {
  "Level 1": "#0769AB",
  "Level 1 - 2": "#eb6834",
  "Level 1 - 3": "#1baf7a",
  "Level 1 - 4": "#6250d6",
  "Level 1 - 5": "#eda100",
  "Level 1 - 6": "#e34948",
  "Level 2": "#06b6d4",
  "Level 2 - 3": "#008300",
  "Level 3": "#e87ba4",
  "Level 4": "#8b4513",
  "Level 4 - 6": "#9085e9",
  "Level 5": "#c2185b",
  "Level 6": "#a3a300",
};

const FALLBACK_LEVEL_COLOR = "#737373";

export const getLevelColor = (level: string): string =>
  LEVEL_COLORS[level as Level] ?? FALLBACK_LEVEL_COLOR;

export const PIE_PALETTE_7 = [
  "#0769AB",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
] as const;

export const STATUS_COLORS = {
  paid: "#0769AB",
  unpaid: "#f59e0b",
} as const;
