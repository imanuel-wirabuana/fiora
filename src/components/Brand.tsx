import type { HTMLAttributes, SVGProps } from "react"
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

const logoBoxVariants = cva(
  "flex shrink-0 items-center justify-center shadow-xs",
  {
    variants: {
      size: {
        sm: "size-6 rounded-lg",
        default: "size-8 rounded-xl",
        lg: "size-10 rounded-2xl",
      },
      logoVariant: {
        glass:
          "border border-primary-foreground/25 bg-primary-foreground/15 text-primary-foreground backdrop-blur-xs",
        primary:
          "border border-primary/20 bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      size: "default",
      logoVariant: "primary",
    },
  }
)

const logoIconVariants = cva("", {
  variants: {
    size: {
      sm: "size-4",
      default: "size-5.5",
      lg: "size-7",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

export function FioraLogo({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      {/* Central bud / diamond petal */}
      <path
        d="M 50 18
           C 58 28 64 36 64 45
           C 64 54 58 60 50 63
           C 42 60 36 54 36 45
           C 36 36 42 28 50 18 Z"
        fill="currentColor"
      />
      {/* Left wing petal */}
      <path
        d="M 44.5 68
           C 30 68 18 58 18 42
           C 22 42 30 44 38 49
           C 45 54 47.5 62 47.5 73
           C 46.5 70 45.5 68 44.5 68 Z"
        fill="currentColor"
      />
      {/* Right wing petal */}
      <path
        d="M 55.5 68
           C 70 68 82 58 82 42
           C 78 42 70 44 62 49
           C 55 54 52.5 62 52.5 73
           C 53.5 70 54.5 68 55.5 68 Z"
        fill="currentColor"
      />
    </svg>
  )
}

export interface BrandProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof brandVariants> {
  subtitle?: string
  showLogo?: boolean
  logoVariant?: "glass" | "primary"
}

export function Brand({
  className,
  size = "default",
  align = "center",
  subtitle,
  showLogo = false,
  logoVariant = "primary",
  ...props
}: BrandProps) {
  return (
    <div className={cn(brandVariants({ size, align, className }))} {...props}>
      <div
        className={cn(
          "flex items-center gap-2.5",
          align === "center" && "justify-center",
          align === "right" && "justify-end"
        )}
      >
        {showLogo && (
          <div className={cn(logoBoxVariants({ size, logoVariant }))}>
            <FioraLogo className={cn(logoIconVariants({ size }))} />
          </div>
        )}
        <h1 className={cn(titleVariants({ size }))}>fiora</h1>
      </div>
      {subtitle ? (
        <p className={cn(subtitleVariants({ size }), "opacity-85")}>
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}

export { brandVariants }
