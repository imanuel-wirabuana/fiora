import { Link } from "wouter"
import { BookOpen, ChevronRight } from "lucide-react"
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
        const isCompact = size === "1x1"
        const isTall = size === "1x2" || size === "2x2"

        return (
          <Link
            key={tool.id}
            href={tool.href}
            className={cn(
              "group block rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
              sizeClassMap[size]
            )}
          >
            <CustomItem
              variant={tool.variant ?? "default"}
              contentVerticalAlign={tool.contentVerticalAlign ?? "start"}
              contentHorizontalAlign={tool.contentHorizontalAlign ?? "start"}
              icon={<Icon className="size-4 shrink-0 text-primary" />}
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
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
              }
              className="h-full cursor-pointer justify-between p-3 transition-colors hover:bg-muted/30"
              contentClassName="flex-1 overflow-hidden"
            />
          </Link>
        )
      })}
    </div>
  )
}
