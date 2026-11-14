import { Smile } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { CustomItem } from "@/components/CustomItem"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { getGenderChartColor } from "@/lib/relationship"
import type { MoodTrendPoint } from "@/types/insight"
import type { Gender } from "@/types/relationship"

interface MoodTrendChartProps {
  data: MoodTrendPoint[]
  myName: string
  partnerName: string
  myGender?: Gender | null
  partnerGender?: Gender | null
}

export function MoodTrendChart({
  data,
  myName,
  partnerName,
  myGender,
  partnerGender,
}: MoodTrendChartProps) {
  const hasAnyMood = data.some((d) => d.me !== null || d.partner !== null)

  const chartConfig = {
    me: {
      label: myName,
      color: getGenderChartColor(myGender, "var(--chart-1)"),
    },
    partner: {
      label: partnerName,
      color: getGenderChartColor(partnerGender, "var(--chart-2)"),
    },
  } satisfies ChartConfig

  return (
    <CustomItem
      variant="default"
      title="Mood Trend"
      description="Score 0.0 – 1.0"
      icon={<Smile className="size-4 text-primary" />}
      className="rounded-2xl p-3"
      contentClassName="w-full"
    >
      {!hasAnyMood ? (
        <div className="flex h-36 w-full items-center justify-center rounded-xl border border-dashed border-border/60 px-2 text-center text-[11px] text-muted-foreground">
          No mood logs in this range.
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-36 w-full">
          <AreaChart
            data={data}
            margin={{ top: 6, right: 6, left: -28, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillMeMood" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-me)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-me)"
                  stopOpacity={0.02}
                />
              </linearGradient>
              <linearGradient id="fillPartnerMood" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-partner)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-partner)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              minTickGap={16}
              fontSize={10}
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 0.5, 1]}
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={10}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="me"
              type="monotone"
              stroke="var(--color-me)"
              strokeWidth={2}
              fill="url(#fillMeMood)"
              connectNulls
              dot={{ r: 2 }}
              activeDot={{ r: 3.5 }}
            />
            <Area
              dataKey="partner"
              type="monotone"
              stroke="var(--color-partner)"
              strokeWidth={2}
              fill="url(#fillPartnerMood)"
              connectNulls
              dot={{ r: 2 }}
              activeDot={{ r: 3.5 }}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </CustomItem>
  )
}
