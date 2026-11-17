import { useMemo } from "react"
import { HeartHandshake } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { CustomItem } from "@/components/CustomItem"
import { CustomSkeleton } from "@/components/CustomSkeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { getGenderChartColor } from "@/lib/relationship"
import type { NudgeActivityPoint } from "@/types/insight"
import type { Gender } from "@/types/relationship"

interface NudgeActivityChartProps {
  data: NudgeActivityPoint[]
  topEmoji: string | null
  topLabel: string | null
  myGender?: Gender | null
  partnerGender?: Gender | null
  isLoading?: boolean
}

export function NudgeActivityChart({
  data,
  topEmoji,
  topLabel,
  myGender,
  partnerGender,
  isLoading = false,
}: NudgeActivityChartProps) {
  const hasAnyNudge = data.some((d) => d.sent > 0 || d.received > 0)

  const chartConfig = useMemo(
    () =>
      ({
        sent: {
          label: "Sent",
          color: getGenderChartColor(myGender, "var(--chart-1)"),
        },
        received: {
          label: "Received",
          color: getGenderChartColor(partnerGender, "var(--chart-2)"),
        },
      }) satisfies ChartConfig,
    [myGender, partnerGender]
  )

  return (
    <CustomItem
      variant="soft"
      title="Nudges"
      description={
        topEmoji && topLabel ? `Top: ${topEmoji} ${topLabel}` : "Sent vs. rec"
      }
      icon={<HeartHandshake className="size-4 text-primary" />}
      className="rounded-2xl p-3"
      contentClassName="w-full"
    >
      {isLoading ? (
        <CustomSkeleton className="h-36 w-full rounded-xl" />
      ) : !hasAnyNudge ? (
        <div className="flex h-36 w-full items-center justify-center rounded-xl border border-dashed border-primary/25 px-2 text-center text-[11px] text-muted-foreground">
          No nudges in this range.
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-36 w-full">
          <BarChart
            data={data}
            margin={{ top: 6, right: 6, left: -28, bottom: 0 }}
          >
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
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={10}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar
              dataKey="sent"
              stackId="nudges"
              fill="var(--color-sent)"
              radius={[0, 0, 3, 3]}
            />
            <Bar
              dataKey="received"
              stackId="nudges"
              fill="var(--color-received)"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      )}
    </CustomItem>
  )
}
