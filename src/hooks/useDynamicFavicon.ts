import { useEffect } from "react"

const DEFAULT_PRIMARY = "oklch(0.6802 0.1902 32.0008)"

function createFaviconSvg(fillColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M 50 18 C 58 28 64 36 64 45 C 64 54 58 60 50 63 C 42 60 36 54 36 45 C 36 36 42 28 50 18 Z" fill="${fillColor}" />
  <path d="M 44.5 68 C 30 68 18 58 18 42 C 22 42 30 44 38 49 C 45 54 47.5 62 47.5 73 C 46.5 70 45.5 68 44.5 68 Z" fill="${fillColor}" />
  <path d="M 55.5 68 C 70 68 82 58 82 42 C 78 42 70 44 62 49 C 55 54 52.5 62 52.5 73 C 53.5 70 54.5 68 55.5 68 Z" fill="${fillColor}" />
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function useDynamicFavicon() {
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>(
      'link[rel="icon"][type="image/svg+xml"]'
    )
    if (!link) {
      link = document.createElement("link")
      link.rel = "icon"
      link.type = "image/svg+xml"
      document.head.prepend(link)
    }

    const updateFavicon = () => {
      const computedPrimary = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim()
      const color = computedPrimary || DEFAULT_PRIMARY
      if (link) {
        link.href = createFaviconSvg(color)
      }
    }

    updateFavicon()

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "class" || m.attributeName === "style") {
          updateFavicon()
          break
        }
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    })

    return () => {
      observer.disconnect()
    }
  }, [])
}

