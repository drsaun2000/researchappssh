"use client"

import type React from "react"

const filterMotionProps = (props: any) => {
  const {
    initial,
    animate,
    exit,
    variants,
    transition,
    whileHover,
    whileTap,
    whileFocus,
    whileInView,
    onAnimationStart,
    onAnimationComplete,
    onAnimationUpdate,
    onHoverStart,
    onHoverEnd,
    onTap,
    onTapStart,
    onTapCancel,
    onFocus,
    onBlur,
    onViewportEnter,
    onViewportLeave,
    layoutId,
    layout,
    drag,
    dragConstraints,
    dragElastic,
    dragMomentum,
    dragTransition,
    onDrag,
    onDragStart,
    onDragEnd,
    ...filteredProps
  } = props
  return filteredProps
}

export const motion = {
  div: ({ children, className, style, ...props }: any) => (
    <div className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </div>
  ),
  span: ({ children, className, style, ...props }: any) => (
    <span className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </span>
  ),
  p: ({ children, className, style, ...props }: any) => (
    <p className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </p>
  ),
  button: ({ children, className, style, ...props }: any) => (
    <button className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </button>
  ),
}

export const AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>

export type Variants = Record<string, any>
export type Transition = Record<string, any>
export type TargetAndTransition = Record<string, any>
export type Variant = Record<string, any>

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
