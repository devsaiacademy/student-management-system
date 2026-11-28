"use client";

import { useIsMobile } from "@student-management-system/ui/hooks/use-mobile";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "./charts/chart-card";
import { BAR_COLOR, PIE_PALETTE_7, getLevelColor } from "./charts/colors";
import { renderPieLabel } from "./charts/pie-label";

const naturalCompare = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
}).compare;

type LevelCount = { level: string; count: number };
type SourceCount = { source: string; count: number };

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
    <div className="flex flex-col gap-6">
      <LevelsChartCard levels={sortedLevels} />
      <SourcesChartCard sources={sortedSources} />
    </div>
  );
}

function LevelsChartCard({ levels }: { levels: LevelCount[] }) {
  const pieData = levels.filter((entry) => entry.count > 0);
  const totalCount = levels.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <ChartCard
      bar={
        // 13 level labels don't fit horizontally; slant them so every label
        // stays visible (interval 0 stops recharts from hiding some).
        <BarChart data={levels} margin={{ bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            angle={-35}
            dataKey="level"
            height={70}
            interval={0}
            textAnchor="end"
            tick={{ fontSize: 12 }}
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
      }
      pie={
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
            {pieData.map((entry) => (
              <Cell fill={getLevelColor(entry.level)} key={entry.level} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} students`, "Count"]} />
          <Legend
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>{value}</span>
            )}
            wrapperStyle={{ fontSize: 14 }}
          />
        </PieChart>
      }
      subtitle={`Total students: ${totalCount}`}
      title="Levels count"
    />
  );
}

function SourcesChartCard({ sources }: { sources: SourceCount[] }) {
  const isWide = !useIsMobile();
  const pieData = sources.filter((entry) => entry.count > 0);
  const totalCount = sources.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <ChartCard
      bar={
        <BarChart data={sources} margin={{ bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            angle={isWide ? 0 : -20}
            dataKey="source"
            height={isWide ? 30 : 60}
            interval={0}
            textAnchor={isWide ? "middle" : "end"}
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
      }
      pie={
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
                fill={PIE_PALETTE_7[index % PIE_PALETTE_7.length]}
                key={entry.source}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} students`, "Count"]} />
          <Legend
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>{value}</span>
            )}
            wrapperStyle={{ fontSize: 14 }}
          />
        </PieChart>
      }
      subtitle={`Total students: ${totalCount}`}
      title="Student sources"
    />
  );
}
