import { useEffect, useRef } from 'react'

export function HyperspeedBg() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // We will dynamically load the exact scripts the original HTML used to guarantee identical behavior
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve() // Already loaded
          return
        }
        const script = document.createElement('script')
        script.src = src
        script.onload = () => resolve()
        script.onerror = () => reject(new Error(`Failed to load ${src}`))
        document.body.appendChild(script)
      })
    }

    const initHyperspeed = async () => {
      try {
        // If it's already fully loaded from a previous visit, just initialize it
        if (window.initHyperspeed) {
          if (containerRef.current && !window.hyperspeedInstance) {
            window.hyperspeedInstance = window.initHyperspeed(containerRef.current)
          }
          return
        }

        // Only add scripts if they don't exist in the DOM
        const scriptsToLoad = [
          'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
          'https://cdn.jsdelivr.net/npm/postprocessing@6.29.3/build/postprocessing.min.js',
          '/hyperspeed/hyperspeed.js'
        ]

        scriptsToLoad.forEach(src => {
          if (!document.querySelector(`script[src="${src}"]`)) {
            const script = document.createElement('script')
            script.src = src
            script.async = false // Ensure execution order
            document.body.appendChild(script)
          }
        })

        if (!document.querySelector('link[href="/hyperspeed/hyperspeed.css"]')) {
          const cssLink = document.createElement('link')
          cssLink.rel = 'stylesheet'
          cssLink.href = '/hyperspeed/hyperspeed.css'
          document.head.appendChild(cssLink)
        }

        // Poll until all scripts finish downloading and evaluating
        const checkReady = () => {
          if (window.initHyperspeed) {
            if (containerRef.current && !window.hyperspeedInstance) {
              window.hyperspeedInstance = window.initHyperspeed(containerRef.current)
            }
          } else {
            setTimeout(checkReady, 50) // Try again in 50ms
          }
        }
        
        checkReady()

      } catch (err) {
        console.error('Failed to load Hyperspeed resources:', err)
      }
    }

    initHyperspeed()

    return () => {
      // Cleanup
      if (window.hyperspeedInstance && typeof window.hyperspeedInstance.dispose === 'function') {
        window.hyperspeedInstance.dispose()
        window.hyperspeedInstance = null
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [])

  return <div id="lights" ref={containerRef} style={{ width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 0 }} />
}

declare global {
  interface Window {
    initHyperspeed: any
    hyperspeedInstance: any
  }
}
