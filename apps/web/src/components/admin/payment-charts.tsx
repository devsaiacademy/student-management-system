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
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PaymentOverview = {
  revenue: {
    totalBv: number;
    totalCr: number;
    totalPending: number;
  };
  studentCounts: {
    paid: number;
    unpaid: number;
  };
};

const BAR_COLORS = {
  paid: "#0769AB",
  unpaid: "#f59e0b",
} as const;

const PIE_COLORS = ["#0769AB", "#22c55e", "#f59e0b"] as const;

export function PaymentCharts({ data }: { data: PaymentOverview }) {
  const barData = [
    { name: "Paid", count: data.studentCounts.paid },
    { name: "Unpaid", count: data.studentCounts.unpaid },
  ];

  const pieData = [
    { name: "TOTAL BV", value: data.revenue.totalBv },
    { name: "TOTAL CR", value: data.revenue.totalCr },
    { name: "PENDING", value: data.revenue.totalPending },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Student Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] sm:h-[360px] md:h-[400px]">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  allowDecimals={false}
                  label={{
                    angle: -90,
                    position: "insideLeft",
                    value: "Student Count",
                  }}
                />
                <Tooltip />
                <Bar dataKey="count" name="Student Count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry) => (
                    <Cell
                      fill={
                        entry.name === "Paid"
                          ? BAR_COLORS.paid
                          : BAR_COLORS.unpaid
                      }
                      key={entry.name}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>PERCENT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] sm:h-[360px] md:h-[400px]">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={pieData}
                  dataKey="value"
                  label={({ percent }) =>
                    percent ? `${(percent * 100).toFixed(1)}%` : ""
                  }
                  nameKey="name"
                  outerRadius="75%"
                >
                  {pieData.map((entry, index) => (
                    <Cell fill={PIE_COLORS[index]} key={entry.name} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    `\u20B9${Number(value).toLocaleString("en-IN")}`
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
