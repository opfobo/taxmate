
import { useTranslation } from "@/hooks/useTranslation";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface RevenueData {
  date: string;
  value: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  currency?: string;
}

const RevenueChart = ({ data, currency = "EUR" }: RevenueChartProps) => {
  const { t } = useTranslation();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <ChartContainer
      config={{
        revenue: {
          label: t("revenue"),
          theme: {
            light: "rgba(59, 130, 246, 0.5)",
            dark: "rgba(59, 130, 246, 0.5)"
          }
        }
      }}
      className="aspect-auto h-[300px]"
    >
      <AreaChart
        data={data}
        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
      >
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis 
          dataKey="date" 
          stroke="var(--muted-foreground)" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="var(--muted-foreground)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <ChartTooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <ChartTooltipContent
                  className="w-[200px]"
                  label={payload[0].payload.date}
                >
                  {`${t("revenue")}: ${formatCurrency(payload[0].value as number)}`}
                </ChartTooltipContent>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          name="revenue"
          stroke="#3b82f6"
          fillOpacity={0.2}
          fill="url(#colorRevenue)"
        />
      </AreaChart>
    </ChartContainer>
  );
};

export default RevenueChart;
