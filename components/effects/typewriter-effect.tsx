"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function TypewriterEffect({
  text,
  className,
  textClassName,
}: {
  text: string
  className?: string
  textClassName?: string
}) {
  const letters = text.split("")

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.08 * i },
    }),
  }

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  }

  return (
    <motion.span variants={container} initial="hidden" animate="visible" className={cn("inline-block", className)}>
      {letters.map((letter, index) => (
        <motion.span
          variants={child}
          key={index}
          className={cn("bg-clip-text text-transparent bg-gradient-to-b from-primary to-primary/60", textClassName)}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.span>
  )
}
