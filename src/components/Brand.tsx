import type { HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"

const brandVariants = cva("transition-all select-none", {
  variants: {
    size: {
      sm: "space-y-0.5",
      default: "space-y-1",
      lg: "space-y-1.5",
    },
    align: {
      center: "text-center",
      left: "text-left",
      right: "text-right",
    },
  },
  defaultVariants: {
    size: "default",
    align: "center",
  },
})

const titleVariants = cva("font-bold tracking-tight", {
  variants: {
    size: {
      sm: "text-xl",
      default: "text-3xl",
      lg: "text-5xl",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

const subtitleVariants = cva("leading-relaxed", {
  variants: {
    size: {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

export interface BrandProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof brandVariants> {
  subtitle?: string
}

export function Brand({
  className,
  size = "default",
  align = "center",
  subtitle,
  ...props
}: BrandProps) {
  return (
    <div className={cn(brandVariants({ size, align, className }))} {...props}>
      <h1 className={cn(titleVariants({ size }))}>fiora</h1>
      {subtitle ? (
        <p className={cn(subtitleVariants({ size }))}>{subtitle}</p>
      ) : null}
    </div>
  )
}

export { brandVariants }
