
import { useTranslation } from "@/hooks/useTranslation";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface OrderVolumeData {
  date: string;
  value: number;
}

interface OrderVolumeChartProps {
  data: OrderVolumeData[];
}

const OrderVolumeChart = ({ data }: OrderVolumeChartProps) => {
  const { t } = useTranslation();

  return (
    <ChartContainer
      config={{
        orders: {
          label: t("orders"),
          theme: {
            light: "#10b981",
            dark: "#10b981"
          }
        }
      }}
      className="aspect-auto h-[300px]"
    >
      <BarChart
        data={data}
        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
      >
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
        />
        <ChartTooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <ChartTooltipContent
                  className="w-[200px]"
                  label={payload[0].payload.date}
                >
                  {`${t("orders")}: ${payload[0].value}`}
                </ChartTooltipContent>
              );
            }
            return null;
          }}
        />
        <Bar 
          dataKey="value" 
          name="orders"
          fill="#10b981" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
};

export default OrderVolumeChart;
