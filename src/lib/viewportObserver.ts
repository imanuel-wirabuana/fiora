type ViewportCallback = (inView: boolean) => void

interface ObservedEntry {
  listeners: Set<ViewportCallback>
  lastInView?: boolean
}

const observedElements = new WeakMap<Element, ObservedEntry>()
let sharedObserver: IntersectionObserver | null = null

function getSharedObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null

  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const record = observedElements.get(entry.target)
          if (!record) continue

          const inView = entry.isIntersecting
          record.lastInView = inView
          for (const listener of record.listeners) {
            listener(inView)
          }
        }
      },
      { rootMargin: "80px" }
    )
  }

  return sharedObserver
}

/**
 * Observe whether `el` intersects the viewport (expanded by an 80px margin)
 * via a single shared IntersectionObserver. Returns an unsubscribe cleanup.
 */
export function observeViewport(
  el: Element,
  callback: ViewportCallback
): () => void {
  const observer = getSharedObserver()
  if (!observer) {
    callback(true)
    return () => {}
  }

  let record = observedElements.get(el)
  if (!record) {
    record = { listeners: new Set() }
    observedElements.set(el, record)
    record.listeners.add(callback)
    observer.observe(el)
  } else {
    record.listeners.add(callback)
    if (record.lastInView !== undefined) {
      callback(record.lastInView)
    }
  }

  return () => {
    const current = observedElements.get(el)
    if (!current) return

    current.listeners.delete(callback)
    if (current.listeners.size === 0) {
      observedElements.delete(el)
      observer.unobserve(el)
    }
  }
}
