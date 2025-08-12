"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

type Props = {
  /**
   * Tailwind classes to merge.
   */
  className?: string
  /**
   * Base glow size in px (inner).
   */
  size?: number
  /**
   * Secondary halo size in px (outer).
   */
  haloSize?: number
  /**
   * Overall opacity multiplier.
   */
  opacity?: number
}

/**
 * CursorGlow renders a radial gradient that follows the cursor.
 * Colors are driven by CSS variables and match your theme:
 * hsl(var(--primary)).
 */
export default function CursorGlow({
  className,
  size = 160,
  haloSize = 360,
  opacity = 1,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced motion and coarse pointers (touch)
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const coarse =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(pointer: coarse)").matches

    if (reduced || coarse) {
      el.style.opacity = "0"
      return
    }

    let ticking = false
    const onMove = (e: MouseEvent) => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        el.style.setProperty("--x", e.clientX + "px")
        el.style.setProperty("--y", e.clientY + "px")
        ticking = false
      })
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMove)
  }, [])

  // Use CSS vars for sizes so users can tweak via props.
  const style: React.CSSProperties = {
    // initial center (off-screen until moved)
    ["--x" as any]: "-1000px",
    ["--y" as any]: "-1000px",
    ["--size" as any]: `${size}px`,
    ["--halo" as any]: `${haloSize}px`,
    ["--opacity" as any]: opacity.toString(),
  }

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        // Layered radial gradients; alpha via / syntax to match theme.
        "pointer-events-none fixed inset-0 z-10",
        // Blend softly over background and under content colors
        "mix-blend-soft-light",
        // Smooth fade in when moving
        "transition-opacity duration-300 ease-linear",
        className
      )}
      style={{
        ...style,
        background:
          // inner bright core + outer halo, both using theme primary color
          `radial-gradient(var(--size) circle at var(--x) var(--y), hsl(var(--primary) / calc(0.30 * var(--opacity))), transparent 65%),
           radial-gradient(var(--halo) circle at var(--x) var(--y), hsl(var(--primary) / calc(0.14 * var(--opacity))), transparent 70%)`,
      }}
    />
  )
}
