import { useEffect, useRef, useCallback } from 'react'
import './SpaceBackground.css'

/**
 * Animated space background with stars, nebulae, shooting stars, and dust particles.
 * Ported from the original space-theme.js + styles.css
 */
export function SpaceBackground() {
  const starsRef = useRef<HTMLDivElement>(null)

  const createStars = useCallback(() => {
    const container = starsRef.current
    if (!container) return
    container.innerHTML = ''

    const starCount = 60 // Sparse and spacious
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div')
      star.className = 'star'
      const size = Math.random() * 1.5 + 0.5 // Very small
      star.style.width = `${size}px`
      star.style.height = `${size}px`
      star.style.left = `${Math.random() * 100}%`
      star.style.top = `${Math.random() * 100}%`
      star.style.animationDelay = `${Math.random() * 3}s`
      star.style.animationDuration = `${Math.random() * 4 + 3}s` // Slower, more elegant twinkle
      container.appendChild(star)
    }
  }, [])

  useEffect(() => {
    createStars()
  }, [createStars])

  return (
    <div className="space-background" aria-hidden="true">
      <div className="stars" ref={starsRef} />
    </div>
  )
}
