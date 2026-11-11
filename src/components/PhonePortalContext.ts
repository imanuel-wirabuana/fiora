import { createContext, useContext, type RefObject } from "react"

export const PhonePortalContext = createContext<RefObject<HTMLElement | null> | null>(null)

export function usePhonePortal() {
  return useContext(PhonePortalContext)
}

