import type { Modifier } from "@dnd-kit/core"

/**
 * Restricts drag-and-drop movement to the vertical (Y) axis.
 */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
})

