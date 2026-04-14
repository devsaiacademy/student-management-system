"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@student-management-system/ui/components/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BAR_COLOR = "#0769AB";

const naturalCompare = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
}).compare;

type LevelCount = { level: string; count: number };

export function ReportsCharts({ levels }: { levels: LevelCount[] }) {
  const sortedLevels = [...levels].sort((a, b) =>
    naturalCompare(a.level, b.level)
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>LEVELS COUNT</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer height={400} width="100%">
            <BarChart data={sortedLevels}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis
                allowDecimals={false}
                label={{
                  angle: -90,
                  position: "insideLeft",
                  value: "Count",
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
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
