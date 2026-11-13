import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item"
import { cn } from "@/lib/utils"

const customItemVariants = cva(
  "w-full max-w-full flex-col items-start gap-2.5 overflow-hidden p-3.5",
  {
    variants: {
      variant: {
        default: "border-border text-foreground",
        soft: "border-primary/20 bg-primary/10 text-foreground",
        solid: "border-transparent bg-primary text-primary-foreground",
        outline: "border-2 border-primary/70 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const customItemDescriptionVariants = cva("text-xs", {
  variants: {
    variant: {
      default: "text-muted-foreground",
      soft: "text-muted-foreground",
      solid: "text-primary-foreground/80",
      outline: "text-primary/80",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export type CustomItemVariant = NonNullable<
  VariantProps<typeof customItemVariants>["variant"]
>

export type CustomItemVerticalAlign = "start" | "center" | "end" | "between"
export type CustomItemHorizontalAlign = "start" | "center" | "end"

const verticalAlignClasses: Record<CustomItemVerticalAlign, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
}

const horizontalAlignClasses: Record<CustomItemHorizontalAlign, string> = {
  start: "items-start text-left",
  center: "items-center text-center",
  end: "items-end text-right",
}

export interface CustomItemProps extends Omit<
  React.ComponentProps<typeof Item>,
  "title" | "variant"
> {
  /** Standardized pure string header title */
  title: string
  /** Required icon or avatar rendered beside the title */
  icon: React.ReactNode
  /** Visual style variant: default, soft, solid, or outline */
  variant?: CustomItemVariant
  /** Optional vertical alignment for the body content (and description) */
  contentVerticalAlign?: CustomItemVerticalAlign
  /** Optional horizontal alignment for the body content (and description) */
  contentHorizontalAlign?: CustomItemHorizontalAlign
  /** Optional subtitle / description rendered at the top of content */
  description?: React.ReactNode
  /** Actions, badges, or timestamps on the top-right of the header */
  topRightActions?: React.ReactNode
  /** Info, status, or metadata on the bottom-left of the footer */
  bottomLeftInfo?: React.ReactNode
  /** Buttons or controls on the bottom-right of the footer */
  bottomRightActions?: React.ReactNode
  /** Main body content */
  children?: React.ReactNode
  /** Optional slot className overrides */
  headerClassName?: string
  descriptionClassName?: string
  contentClassName?: string
  footerClassName?: string
}

export function CustomItem({
  title,
  icon,
  variant = "default",
  contentVerticalAlign = "start",
  contentHorizontalAlign = "start",
  description,
  topRightActions,
  bottomLeftInfo,
  bottomRightActions,
  children,
  className,
  headerClassName,
  descriptionClassName,
  contentClassName,
  footerClassName,
  ...props
}: CustomItemProps) {
  const hasContent = Boolean(description || children)
  const hasFooter = Boolean(bottomLeftInfo || bottomRightActions)

  return (
    <Item
      variant={variant === "solid" || variant === "soft" ? "default" : "outline"}
      className={cn(customItemVariants({ variant }), className)}
      {...props}
    >
      <ItemHeader
        className={cn(
          "w-full basis-auto flex-row items-center justify-between gap-2 space-y-0",
          headerClassName
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <div className="flex shrink-0 items-center justify-center">
            {icon}
          </div>
          <ItemTitle className="min-w-0 text-sm font-semibold">
            {title}
          </ItemTitle>
        </div>

        {topRightActions && (
          <div className="flex shrink-0 items-center gap-1.5">
            {topRightActions}
          </div>
        )}
      </ItemHeader>

      {hasContent && (
        <ItemContent
          className={cn(
            "w-full min-w-0",
            verticalAlignClasses[contentVerticalAlign],
            horizontalAlignClasses[contentHorizontalAlign],
            contentClassName
          )}
        >
          {description && (
            <ItemDescription
              className={cn(
                customItemDescriptionVariants({ variant }),
                contentHorizontalAlign === "center"
                  ? "text-center"
                  : contentHorizontalAlign === "end"
                    ? "text-right"
                    : "text-left",
                descriptionClassName
              )}
            >
              {description}
            </ItemDescription>
          )}
          {children}
        </ItemContent>
      )}

      {hasFooter && (
        <ItemFooter
          className={cn(
            "w-full basis-auto flex-row items-center justify-between gap-2",
            footerClassName
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {bottomLeftInfo}
          </div>
          {bottomRightActions && (
            <div className="flex shrink-0 items-center gap-1">
              {bottomRightActions}
            </div>
          )}
        </ItemFooter>
      )}
    </Item>
  )
}
