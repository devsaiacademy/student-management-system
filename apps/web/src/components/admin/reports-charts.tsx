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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
      <LevelsChartCard levels={sortedLevels} />
      <SourcesChartCard sources={sortedSources} />
    </div>
  );
}

function LevelsChartCard({ levels }: { levels: LevelCount[] }) {
  const [view, setView] = useState<ChartView>("pie");

  const pieData = levels.filter((entry) => entry.count > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>LEVELS COUNT</CardTitle>
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
        <div className="h-[280px] sm:h-[360px] md:h-[400px]">
          <ResponsiveContainer height="100%" width="100%">
            {view === "bar" ? (
              <BarChart data={levels}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => dataMax]}
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
                  label={({ value, percent }) =>
                    percent ? `${value} (${(percent * 100).toFixed(1)}%)` : ""
                  }
                  nameKey="level"
                  outerRadius="75%"
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
                <Legend />
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>STUDENT SOURCES</CardTitle>
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
        <div className="h-[280px] sm:h-[360px] md:h-[400px]">
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
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => dataMax]}
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
                  label={({ value, percent }) =>
                    percent ? `${value} (${(percent * 100).toFixed(1)}%)` : ""
                  }
                  nameKey="source"
                  outerRadius="75%"
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
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
