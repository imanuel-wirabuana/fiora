import * as React from "react"
import { Link } from "wouter"
import { cn } from "@/lib/utils"

export interface SettingRowProps {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children?: React.ReactNode
  href?: string
  className?: string
  onClick?: () => void
}

export function SettingRow({
  icon,
  title,
  description,
  action,
  children,
  href,
  className,
  onClick,
}: SettingRowProps) {
  const content = (
    <div
      className={cn(
        "flex w-full flex-col gap-2 py-2 text-left",
        href && "transition-colors group-hover:text-primary",
        className
      )}
      onClick={onClick}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon && (
            <div className="flex size-5 shrink-0 items-center justify-center text-primary">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-xs font-medium text-foreground">{title}</div>
            {description && (
              <div className="text-[11px] leading-tight text-muted-foreground">
                {description}
              </div>
            )}
          </div>
        </div>

        {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
      </div>

      {children && <div className="w-full pt-1">{children}</div>}
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="group block w-full rounded-xl outline-none"
      >
        {content}
      </Link>
    )
  }

  return content
}

