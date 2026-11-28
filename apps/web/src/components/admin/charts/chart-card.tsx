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
import type { ReactElement } from "react";
import { useState } from "react";
import { ResponsiveContainer } from "recharts";

export type ChartView = "bar" | "pie";

type ChartCardProps = {
  title: string;
  subtitle: string;
  pie: ReactElement;
  bar?: ReactElement;
  defaultView?: ChartView;
};

export function ChartCard({
  title,
  subtitle,
  pie,
  bar,
  defaultView = "pie",
}: ChartCardProps) {
  const [view, setView] = useState<ChartView>(defaultView);
  const renderedView = bar && view === "bar" ? bar : pie;

  return (
    <Card className="rounded-[12px] shadow-sm transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {bar ? (
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
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="h-[340px] sm:h-[440px] md:h-[500px]">
          <ResponsiveContainer height="100%" width="100%">
            {renderedView}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
