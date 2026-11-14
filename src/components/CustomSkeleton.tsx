import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

/**
 * Branded skeleton placeholder using primary/20 tint.
 */
export function CustomSkeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="custom-skeleton"
      className={cn("animate-pulse rounded-2xl bg-primary/20", className)}
      {...props}
    />
  )
}

