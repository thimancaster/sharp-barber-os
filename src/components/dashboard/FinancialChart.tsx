import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface FinancialChartProps {
  data: {
    name: string;
    faturamento: number;
    despesas: number;
  }[];
  title?: string;
}

const chartConfig = {
  faturamento: {
    label: "Faturamento",
    color: "hsl(40 45% 56%)",
  },
  despesas: {
    label: "Despesas",
    color: "hsl(0 62.8% 45%)",
  },
};

export function FinancialChart({ data, title }: FinancialChartProps) {
  const formattedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      lucro: item.faturamento - item.despesas,
    }));
  }, [data]);

  return (
    <div className="card-elevated rounded-xl p-6">
      {title && (
        <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
          {title}
        </h3>
      )}
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <AreaChart
          data={formattedData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(40 45% 56%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(40 45% 56%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0 62.8% 45%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(0 62.8% 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
          <XAxis
            dataKey="name"
            stroke="hsl(0 0% 55%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(0 0% 55%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `R$${value}`}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="faturamento"
            stroke="hsl(40 45% 56%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorFaturamento)"
            name="Faturamento"
          />
          <Area
            type="monotone"
            dataKey="despesas"
            stroke="hsl(0 62.8% 45%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDespesas)"
            name="Despesas"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
