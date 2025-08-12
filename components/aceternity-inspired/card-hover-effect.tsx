"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"

export function CardHoverEffect({
items,
className,
}: {
items: {
  title: string
  description: string
  link: string
  icon?: React.ReactNode
}[]
className?: string
}) {
const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

return (
  <div
    className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
      className
    )}
  >
    {items.map((item, idx) => (
      <div
        key={item?.link}
        className="relative group block p-2 h-full w-full"
        onMouseEnter={() => setHoveredIndex(idx)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <div
          className={cn(
            "absolute inset-0 h-full w-full bg-primary transform scale-[0.80] rounded-full blur-3xl",
            hoveredIndex === idx ? "opacity-20" : "opacity-0"
          )}
          style={{
            transition: "opacity 0.3s ease-in-out",
          }}
        />
        <div className="rounded-2xl h-full w-full p-4 overflow-hidden bg-white dark:bg-slate-900 border border-transparent dark:border-white/[0.2] group-hover:border-primary/50 relative z-20 transform-gpu transition-all duration-500 group-hover:scale-[1.02]">
          <div className="relative z-50">
            <div className="p-4">
              {item.icon && (
                <div className="mb-4 text-primary">
                  {item.icon}
                </div>
              )}
              <h4 className="text-slate-800 dark:text-zinc-100 font-bold tracking-wide mt-4">
                {item.title}
              </h4>
              <p className="mt-8 text-slate-600 dark:text-zinc-400 tracking-wide leading-relaxed text-sm">
                {item.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
)
}
