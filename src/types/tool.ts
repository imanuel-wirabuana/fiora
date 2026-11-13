import type { LucideIcon } from "lucide-react"
import type {
  CustomItemHorizontalAlign,
  CustomItemVariant,
  CustomItemVerticalAlign,
} from "@/components/CustomItem"

export type ToolBoxSize =
  | "1x1"
  | "2x1"
  | "3x1"
  | "1x2"
  | "2x2"
  | "3x2"
  | "1x3"
  | "2x3"
  | "3x3"

export interface ToolItem {
  id: string
  title: string
  description: string
  href: string
  icon: LucideIcon
  size?: ToolBoxSize
  variant?: CustomItemVariant
  contentVerticalAlign?: CustomItemVerticalAlign
  contentHorizontalAlign?: CustomItemHorizontalAlign
}


