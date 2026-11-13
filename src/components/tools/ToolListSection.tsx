import { Link } from "wouter"
import {
  BellRing,
  BookOpen,
  CalendarHeart,
  ChevronRight,
  Images,
  ListTodo,
  Map,
  MessageCircle,
  Wallet,
} from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import { cn } from "@/lib/utils"
import type { ToolBoxSize, ToolItem } from "@/types/tool"

export const SPACE_TOOLS: ToolItem[] = [
  {
    id: "journal",
    title: "Journal",
    description: "Write personal notes or share thoughts with your partner",
    href: "/space/journal",
    icon: BookOpen,
    size: "2x1",
    variant: "solid",
    contentVerticalAlign: "start",
    contentHorizontalAlign: "start",
  },
  {
    id: "itinerary",
    title: "Itinerary",
    description: "Plan trips, date nights, and shared travel plans",
    icon: Map,
    comingSoon: true,
    size: "1x2",
    variant: "soft",
    contentVerticalAlign: "start",
    contentHorizontalAlign: "start",
  },
  {
    id: "todo-list",
    title: "Todo List",
    description: "Keep track of shared chores, goals, and bucket list items",
    icon: ListTodo,
    comingSoon: true,
    size: "2x1",
    variant: "outline",
    contentVerticalAlign: "start",
    contentHorizontalAlign: "start",
  },
  {
    id: "reminder",
    title: "Reminder",
    description: "Gentle alerts for important moments",
    icon: BellRing,
    comingSoon: true,
    size: "1x1",
    variant: "default",
    contentVerticalAlign: "start",
    contentHorizontalAlign: "start",
  },
  {
    id: "gallery",
    title: "Gallery",
    description: "Save and revisit your favorite photos together",
    icon: Images,
    comingSoon: true,
    size: "2x2",
    variant: "soft",
    contentVerticalAlign: "center",
    contentHorizontalAlign: "center",
  },
  {
    id: "financial",
    title: "Financial",
    description: "Shared budget & expense splits",
    icon: Wallet,
    comingSoon: true,
    size: "1x1",
    variant: "outline",
    contentVerticalAlign: "start",
    contentHorizontalAlign: "start",
  },
  {
    id: "period-cycle",
    title: "Period Cycle",
    description: "Care & cycle tracking",
    icon: CalendarHeart,
    comingSoon: true,
    size: "1x1",
    variant: "default",
    contentVerticalAlign: "start",
    contentHorizontalAlign: "start",
  },
  {
    id: "chat",
    title: "Chat",
    description: "A private space to message each other anytime",
    icon: MessageCircle,
    comingSoon: true,
    size: "2x1",
    variant: "soft",
    contentVerticalAlign: "start",
    contentHorizontalAlign: "start",
  },
]

const sizeClassMap: Record<ToolBoxSize, string> = {
  "1x1": "col-span-1 row-span-1",
  "2x1": "col-span-2 row-span-1",
  "3x1": "col-span-3 row-span-1",
  "1x2": "col-span-1 row-span-2",
  "2x2": "col-span-2 row-span-2",
  "3x2": "col-span-3 row-span-2",
  "1x3": "col-span-1 row-span-3",
  "2x3": "col-span-2 row-span-3",
  "3x3": "col-span-3 row-span-3",
}

interface ToolListSectionProps {
  tools?: ToolItem[]
}

export function ToolListSection({ tools = SPACE_TOOLS }: ToolListSectionProps) {
  return (
    <div className="grid grid-flow-dense auto-rows-[108px] grid-cols-3 gap-2.5">
      {tools.map((tool) => {
        const Icon = tool.icon
        const size = tool.size ?? "1x1"
        const variant = tool.variant ?? "default"
        const isSolid = variant === "solid"
        const isCompact = size === "1x1"
        const isTall = size === "1x2" || size === "2x2"
        const isInteractive = Boolean(tool.href) && !tool.comingSoon

        const card = (
          <CustomItem
            variant={variant}
            contentVerticalAlign={tool.contentVerticalAlign ?? "start"}
            contentHorizontalAlign={tool.contentHorizontalAlign ?? "start"}
            icon={
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  isSolid ? "text-primary-foreground" : "text-primary"
                )}
              />
            }
            title={tool.title}
            description={tool.description}
            descriptionClassName={cn(
              "text-[11px] leading-snug",
              isCompact
                ? "line-clamp-2"
                : isTall
                  ? "line-clamp-5"
                  : "line-clamp-3"
            )}
            topRightActions={
              tool.comingSoon ? (
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                    isSolid
                      ? "bg-primary-foreground/15 text-primary-foreground"
                      : "bg-muted/70 text-muted-foreground"
                  )}
                >
                  Soon
                </span>
              ) : (
                <ChevronRight
                  className={cn(
                    "size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5",
                    isSolid
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  )}
                />
              )
            }
            className={cn(
              "h-full justify-between p-3 transition-colors",
              isInteractive
                ? "cursor-pointer hover:opacity-95"
                : "cursor-default opacity-85"
            )}
            contentClassName="flex-1 overflow-hidden"
          />
        )

        if (!isInteractive || !tool.href) {
          return (
            <div key={tool.id} className={cn("rounded-2xl", sizeClassMap[size])}>
              {card}
            </div>
          )
        }

        return (
          <Link
            key={tool.id}
            href={tool.href}
            className={cn(
              "group block rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
              sizeClassMap[size]
            )}
          >
            {card}
          </Link>
        )
      })}
    </div>
  )
}
