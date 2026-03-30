import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";

interface ChartData {
  date: string;
  assetPerformance: number;
  btcPerformance: number;
  ethPerformance: number;
}

interface RelativeStrengthChartProps {
  data: ChartData[];
  assetName: string;
  period: "30d" | "90d";
}

export function RelativeStrengthChart({
  data,
  assetName,
  period,
}: RelativeStrengthChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="card-elevated p-6">
        <p className="text-center text-muted-foreground">No data available</p>
      </Card>
    );
  }

  const periodLabel = period === "30d" ? "30-Day" : "90-Day";

  return (
    <Card className="card-elevated p-6">
      <h3 className="text-lg font-semibold mb-4">
        {periodLabel} Relative Strength
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            stroke="var(--color-muted-foreground)"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="var(--color-muted-foreground)"
            style={{ fontSize: "12px" }}
            label={{ value: "Performance (%)", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-background)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
            }}
            formatter={(value: number) => `${value.toFixed(2)}%`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="assetPerformance"
            stroke="#3b82f6"
            name={assetName}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="btcPerformance"
            stroke="#f59e0b"
            name="Bitcoin"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="ethPerformance"
            stroke="#8b5cf6"
            name="Ethereum"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">{assetName} Return</p>
          <p className="text-lg font-semibold text-blue-600">
            {data[data.length - 1]?.assetPerformance.toFixed(2)}%
          </p>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">Bitcoin Return</p>
          <p className="text-lg font-semibold text-amber-600">
            {data[data.length - 1]?.btcPerformance.toFixed(2)}%
          </p>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">Ethereum Return</p>
          <p className="text-lg font-semibold text-purple-600">
            {data[data.length - 1]?.ethPerformance.toFixed(2)}%
          </p>
        </div>
      </div>
    </Card>
  );
}
