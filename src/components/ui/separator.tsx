"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal"
          ? "h-[1px] min-h-[1px] max-h-[1px] w-full"
          : "h-full w-[1px] min-w-[1px] max-w-[1px] self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
