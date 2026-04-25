"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@student-management-system/ui/components/card";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@student-management-system/ui/components/toggle-group";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BAR_COLOR = "#0769AB";

const LEVEL_PIE_COLORS = [
  "#0769AB",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
] as const;

const SOURCE_PIE_COLORS = [
  "#0769AB",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
] as const;

const RADIAN = Math.PI / 180;
const LEADER_LINE_COLOR = "#9ca3af";
const LABEL_TEXT_COLOR = "#111827";

type PieLabelProps = {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  fill?: string;
  name?: string | number;
  value?: number;
  percent?: number;
};

function renderPieLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  fill,
  name,
  value,
  percent,
}: PieLabelProps) {
  if (
    cx === undefined ||
    cy === undefined ||
    midAngle === undefined ||
    outerRadius === undefined ||
    !percent
  ) {
    return null;
  }

  const cos = Math.cos(-midAngle * RADIAN);
  const sin = Math.sin(-midAngle * RADIAN);
  const sx = cx + outerRadius * cos;
  const sy = cy + outerRadius * sin;
  const mx = cx + (outerRadius + 16) * cos;
  const my = cy + (outerRadius + 16) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 14;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";
  const textOffset = cos >= 0 ? 4 : -4;

  return (
    <g>
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        fill="none"
        stroke={LEADER_LINE_COLOR}
      />
      <circle
        cx={ex}
        cy={ey}
        fill={LEADER_LINE_COLOR}
        r={2}
        stroke="none"
      />
      <text
        dominantBaseline="middle"
        fontSize={14}
        textAnchor={textAnchor}
        x={ex + textOffset}
        y={ey}
      >
        <tspan fill={fill ?? LABEL_TEXT_COLOR} fontWeight={500}>
          {String(name)}:{" "}
        </tspan>
        <tspan fill={LABEL_TEXT_COLOR}>
          {value} ({(percent * 100).toFixed(1)}%)
        </tspan>
      </text>
    </g>
  );
}

const naturalCompare = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
}).compare;

type LevelCount = { level: string; count: number };
type SourceCount = { source: string; count: number };
type ChartView = "bar" | "pie";

type ReportsChartsProps = {
  levels: LevelCount[];
  sources: SourceCount[];
};

export function ReportsCharts({ levels, sources }: ReportsChartsProps) {
  const sortedLevels = [...levels].sort((a, b) =>
    naturalCompare(a.level, b.level)
  );

  const sortedSources = [...sources].sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <LevelsChartCard levels={sortedLevels} />
      <SourcesChartCard sources={sortedSources} />
    </div>
  );
}

function LevelsChartCard({ levels }: { levels: LevelCount[] }) {
  const [view, setView] = useState<ChartView>("pie");

  const pieData = levels.filter((entry) => entry.count > 0);
  const totalCount = levels.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle>LEVELS COUNT</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total students: {totalCount}
          </p>
        </div>
        <ToggleGroup
          aria-label="Chart view"
          onValueChange={(values) => {
            const next = values[0];
            if (next === "bar" || next === "pie") {
              setView(next);
            }
          }}
          value={[view]}
          variant="outline"
        >
          <ToggleGroupItem aria-label="Bar chart" value="bar">
            <BarChart3 />
          </ToggleGroupItem>
          <ToggleGroupItem aria-label="Pie chart" value="pie">
            <PieChartIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <div className="h-[340px] sm:h-[440px] md:h-[500px]">
          <ResponsiveContainer height="100%" width="100%">
            {view === "bar" ? (
              <BarChart data={levels}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis
                  allowDecimals={false}
                  domain={[0, totalCount]}
                  label={{
                    angle: -90,
                    position: "insideLeft",
                    value: "Total Count",
                  }}
                />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill={BAR_COLOR}
                  name="Student Count"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={pieData}
                  dataKey="count"
                  label={renderPieLabel}
                  labelLine={false}
                  nameKey="level"
                  outerRadius="70%"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      fill={LEVEL_PIE_COLORS[index % LEVEL_PIE_COLORS.length]}
                      key={entry.level}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} students`, "Count"]}
                />
                <Legend
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color }}>{value}</span>
                  )}
                  wrapperStyle={{ fontSize: 14 }}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function SourcesChartCard({ sources }: { sources: SourceCount[] }) {
  const [view, setView] = useState<ChartView>("pie");

  const pieData = sources.filter((entry) => entry.count > 0);
  const totalCount = sources.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle>STUDENT SOURCES</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total students: {totalCount}
          </p>
        </div>
        <ToggleGroup
          aria-label="Chart view"
          onValueChange={(values) => {
            const next = values[0];
            if (next === "bar" || next === "pie") {
              setView(next);
            }
          }}
          value={[view]}
          variant="outline"
        >
          <ToggleGroupItem aria-label="Bar chart" value="bar">
            <BarChart3 />
          </ToggleGroupItem>
          <ToggleGroupItem aria-label="Pie chart" value="pie">
            <PieChartIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <div className="h-[340px] sm:h-[440px] md:h-[500px]">
          <ResponsiveContainer height="100%" width="100%">
            {view === "bar" ? (
              <BarChart data={sources} margin={{ bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  angle={-20}
                  dataKey="source"
                  height={60}
                  interval={0}
                  textAnchor="end"
                  tick={{ fontSize: 14 }}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, totalCount]}
                  label={{
                    angle: -90,
                    position: "insideLeft",
                    value: "Total Count",
                  }}
                />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill={BAR_COLOR}
                  name="Student Count"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={pieData}
                  dataKey="count"
                  label={renderPieLabel}
                  labelLine={false}
                  nameKey="source"
                  outerRadius="70%"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      fill={SOURCE_PIE_COLORS[index % SOURCE_PIE_COLORS.length]}
                      key={entry.source}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} students`, "Count"]}
                />
                <Legend
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color }}>{value}</span>
                  )}
                  wrapperStyle={{ fontSize: 14 }}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
