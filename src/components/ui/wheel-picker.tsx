import "@ncdai/react-wheel-picker/style.css"

import type { ComponentProps } from "react"
import * as WheelPickerPrimitive from "@ncdai/react-wheel-picker"

import { cn } from "@/lib/utils"

type WheelPickerValue = WheelPickerPrimitive.WheelPickerValue

type WheelPickerOption<T extends WheelPickerValue = string> =
  WheelPickerPrimitive.WheelPickerOption<T>

type WheelPickerClassNames = WheelPickerPrimitive.WheelPickerClassNames

function WheelPickerWrapper({
  className,
  ...props
}: ComponentProps<typeof WheelPickerPrimitive.WheelPickerWrapper>) {
  return (
    <WheelPickerPrimitive.WheelPickerWrapper
      className={cn("w-full", className)}
      {...props}
    />
  )
}

function WheelPicker<T extends WheelPickerValue = string>({
  classNames,
  ...props
}: WheelPickerPrimitive.WheelPickerProps<T>) {
  return (
    <WheelPickerPrimitive.WheelPicker
      classNames={{
        optionItem: cn(
          "text-muted-foreground data-disabled:opacity-30",
          classNames?.optionItem
        ),
        highlightWrapper: cn(
          "text-primary",
          classNames?.highlightWrapper
        ),
        highlightItem: cn(
          "data-disabled:opacity-30",
          classNames?.highlightItem
        ),
      }}
      {...props}
    />
  )
}

export { WheelPicker, WheelPickerWrapper }
export type { WheelPickerClassNames, WheelPickerOption, WheelPickerValue }

