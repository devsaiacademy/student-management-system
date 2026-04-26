"use client";

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
import { STATUS_COLORS } from "./charts/colors";
import { makePieLabel, renderPieLabel } from "./charts/pie-label";

type PaymentOverview = {
  revenue: {
    totalBv: number;
    totalCr: number;
    totalPending: number;
    totalDiscontinued: number;
  };
  studentCounts: {
    paid: number;
    unpaid: number;
  };
};

const REVENUE_COLORS = ["#0769AB", "#22c55e", "#f59e0b", "#ef4444"] as const;

function statusFill(name: string) {
  return name === "Paid" ? STATUS_COLORS.paid : STATUS_COLORS.unpaid;
}

function formatInr(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

const renderRevenuePieLabel = makePieLabel(formatInr);

export function PaymentCharts({ data }: { data: PaymentOverview }) {
  const statusData = [
    { name: "Paid", count: data.studentCounts.paid },
    { name: "Unpaid", count: data.studentCounts.unpaid },
  ];
  const totalCount = statusData.reduce((sum, entry) => sum + entry.count, 0);
  const statusPieData = statusData.filter((entry) => entry.count > 0);

  const revenueData = [
    { name: "TOTAL BV", value: data.revenue.totalBv },
    { name: "TOTAL CR", value: data.revenue.totalCr },
    { name: "PENDING", value: data.revenue.totalPending },
    { name: "DISCONTINUED", value: data.revenue.totalDiscontinued },
  ];
  const revenuePieData = revenueData.filter((entry) => entry.value > 0);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ChartCard
        bar={
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
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
            <Bar dataKey="count" name="Student Count" radius={[4, 4, 0, 0]}>
              {statusData.map((entry) => (
                <Cell fill={statusFill(entry.name)} key={entry.name} />
              ))}
            </Bar>
          </BarChart>
        }
        pie={
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={statusPieData}
              dataKey="count"
              label={renderPieLabel}
              labelLine={false}
              nameKey="name"
              outerRadius="70%"
            >
              {statusPieData.map((entry) => (
                <Cell fill={statusFill(entry.name)} key={entry.name} />
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
        title="STUDENT PAYMENT STATUS"
      />
      <ChartCard
        pie={
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={revenuePieData}
              dataKey="value"
              label={renderRevenuePieLabel}
              labelLine={false}
              nameKey="name"
              outerRadius="70%"
            >
              {revenuePieData.map((entry, index) => (
                <Cell
                  fill={REVENUE_COLORS[index % REVENUE_COLORS.length]}
                  key={entry.name}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatInr(Number(value))} />
            <Legend
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>{value}</span>
              )}
              wrapperStyle={{ fontSize: 14 }}
            />
          </PieChart>
        }
        subtitle={`Total billed: ${formatInr(data.revenue.totalBv)}`}
        title="REVENUE BREAKDOWN"
      />
    </div>
  );
}
