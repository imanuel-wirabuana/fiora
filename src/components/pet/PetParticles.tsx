import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/utils"
import { usePetStore } from "@/stores/petStore"

export function PetParticles() {
  const particles = usePetStore((s) => s.particles)
  const removeParticle = usePetStore((s) => s.removeParticle)

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden select-none">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{
              opacity: 0,
              x: p.x,
              y: p.y,
              scale: 0.4,
              rotate: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: p.x + p.dx,
              y: p.y + p.dy,
              scale: [0.5, 1.15, 0.9],
              rotate: p.rotate,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: p.duration, ease: "easeOut" }}
            onAnimationComplete={() => removeParticle(p.id)}
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              p.sizeClass
            )}
          >
            {p.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}
