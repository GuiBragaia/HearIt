'use client'

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { routeDirection } from './nav'

type RouteMotionValue = {
  direction: number
}

const RouteMotionContext = createContext<RouteMotionValue | null>(null)

export function RouteMotionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const prev = useRef(pathname)
  const direction = routeDirection(prev.current, pathname)

  useEffect(() => {
    prev.current = pathname
  }, [pathname])

  const value = useMemo(() => ({ direction }), [direction])

  return <RouteMotionContext.Provider value={value}>{children}</RouteMotionContext.Provider>
}

export function useRouteMotion() {
  const ctx = useContext(RouteMotionContext)
  if (!ctx) throw new Error('useRouteMotion must be used within RouteMotionProvider')
  return ctx
}
