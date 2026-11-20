import { useEffect, useRef } from 'react'
import { LayoutGrid, Palette, Terminal, Wrench, Trophy, Rocket, BookOpen, Music, Asterisk, Mic, Globe, Drama, Paintbrush, Code } from 'lucide-react'
import { EVENT_CATEGORIES } from '@/lib/constants'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import './CategorySidebar.css'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  music: <Music size={22} />,
  art: <Paintbrush size={22} />,
  orator: <Mic size={22} />,
  sports: <Trophy size={22} />,
  tech: <Code size={22} />,
  cultural: <Globe size={22} />,
  drama: <Drama size={22} />,
  other: <LayoutGrid size={22} />,
}

export function CategorySidebar() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  const currentCategory = searchParams.get('category')



  const handleCategoryClick = (e: React.MouseEvent, catId: string) => {
    e.preventDefault()
    
    // If we're not on explore, community, or events, go to explore with the category
    if (!['/explore', '/community', '/events'].includes(location.pathname)) {
      navigate(`/explore?category=${catId}`)
      return
    }

    if (currentCategory === catId) {
      // Toggle off
      searchParams.delete('category')
      setSearchParams(searchParams)
    } else {
      // Toggle on
      searchParams.set('category', catId)
      setSearchParams(searchParams)
    }
  }

  return (
    <aside className="category-sidebar">
      <div className="category-list" ref={containerRef}>
        {EVENT_CATEGORIES.map((cat) => {
          const isActive = currentCategory === cat.id
          return (
            <div className="category-container" key={cat.id}>
              <a 
                href={`/events?category=${cat.id}`}
                className={`category-item ${isActive ? 'active-category' : ''}`}
                title={cat.label}
                onClick={(e) => handleCategoryClick(e, cat.id)}
              >

                {CATEGORY_ICONS[cat.id] || <LayoutGrid size={22} />}
              </a>
              <div className="category-label" style={isActive ? { color: 'var(--primary)', fontWeight: 'bold' } : undefined}>
                {cat.label}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
