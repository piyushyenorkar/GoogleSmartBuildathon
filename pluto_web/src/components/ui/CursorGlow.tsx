import { useEffect, useRef } from 'react'

/**
 * Reusable cursor glow effect component.
 * Exact port of the legacy space-theme.js glow logic.
 */
export function CursorGlow({ 
  containerRef 
}: { 
  containerRef: React.RefObject<HTMLDivElement | HTMLAnchorElement | null> 
}) {
  const glow1Ref = useRef<HTMLDivElement>(null)
  const glow2Ref = useRef<HTMLDivElement>(null)
  const glow3Ref = useRef<HTMLDivElement>(null)
  const isHovered = useRef(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovered.current) return
      
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Layer 1 (red) - closest to cursor, slight delay
      setTimeout(() => {
        if (glow1Ref.current) {
          glow1Ref.current.style.left = `${x}px`
          glow1Ref.current.style.top = `${y}px`
          glow1Ref.current.style.display = 'block'
          glow1Ref.current.style.opacity = '1'
        }
      }, 50)

      // Layer 2 (brown) - more delayed, trails behind
      setTimeout(() => {
        if (glow2Ref.current) {
          glow2Ref.current.style.left = `${x}px`
          glow2Ref.current.style.top = `${y}px`
          glow2Ref.current.style.display = 'block'
          glow2Ref.current.style.opacity = '1'
        }
      }, 150)

      // Layer 3 (tan/beige) - most delayed, longest trail
      setTimeout(() => {
        if (glow3Ref.current) {
          glow3Ref.current.style.left = `${x}px`
          glow3Ref.current.style.top = `${y}px`
          glow3Ref.current.style.display = 'block'
          glow3Ref.current.style.opacity = '1'
        }
      }, 250)
    }

    const handleMouseEnter = () => {
      isHovered.current = true
      if (glow1Ref.current) glow1Ref.current.style.opacity = '1'
      if (glow2Ref.current) glow2Ref.current.style.opacity = '1'
      if (glow3Ref.current) glow3Ref.current.style.opacity = '1'
    }

    const handleMouseLeave = () => {
      isHovered.current = false
      if (glow1Ref.current) glow1Ref.current.style.opacity = '0'
      if (glow2Ref.current) glow2Ref.current.style.opacity = '0'
      if (glow3Ref.current) glow3Ref.current.style.opacity = '0'
    }

    container.addEventListener('mousemove', handleMouseMove as EventListener)
    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove as EventListener)
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [containerRef])

  return (
    <>
      <div ref={glow1Ref} className="card-glow-effect" />
      <div ref={glow2Ref} className="glow-layer-extra" />
      <div ref={glow3Ref} className="glow-layer-tertiary" />
    </>
  )
}
