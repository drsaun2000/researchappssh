"use client"

import { cn } from "@/lib/utils"

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden bg-gradient-to-r from-transparent via-teal-500/10 to-transparent",
        className
      )}
    >
      <div className="absolute inset-0">
        {/* Animated beams */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-teal-500/50 to-transparent animate-pulse" />
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-blue-600/50 to-transparent animate-pulse delay-1000" />
        <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent animate-pulse delay-2000" />
        
        {/* Horizontal beams */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent animate-pulse delay-500" />
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-600/30 to-transparent animate-pulse delay-1500" />
      </div>
    </div>
  )
}
