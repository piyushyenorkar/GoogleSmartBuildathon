import React, { useState, useRef, useEffect } from 'react'

interface TagItem { name: string; icon: string }

export function TagsInput({ 
  items, 
  setItems, 
  db, 
  placeholder 
}: { 
  items: string[]; 
  setItems: (items: string[]) => void; 
  db: TagItem[]; 
  placeholder: string 
}) {
  const [input, setInput] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const matches = db.filter(s => 
    s.name.toLowerCase().includes(input.toLowerCase()) && !items.includes(s.name)
  ).slice(0, 8)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const addTag = (name: string) => {
    if (!items.includes(name)) setItems([...items, name])
    setInput('')
    setShowDropdown(false)
  }

  const removeTag = (idx: number) => {
    const newItems = [...items]
    newItems.splice(idx, 1)
    setItems(newItems)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      addTag(input.trim().replace(/,/g, ''))
    } else if (e.key === 'Backspace' && !input && items.length > 0) {
      removeTag(items.length - 1)
    }
  }

  return (
    <div className="techstack-autocomplete-wrap" ref={containerRef}>
      <div className="tags-input-container" onClick={() => document.getElementById(`tags-input-${placeholder}`)?.focus()}>
        {items.map((tag, idx) => {
          if (!tag || typeof tag !== 'string') return null;
          const dbItem = db.find(x => x.name.toLowerCase() === tag.toLowerCase())
          const icon = dbItem?.icon
          const isUrl = icon?.startsWith('http')
          return (
            <span key={idx} className="tag">
              {icon && (isUrl ? <img src={icon} style={{width:14,height:14,objectFit:'contain'}} alt=""/> : <span style={{fontSize:'0.9rem'}}>{icon}</span>)}
              {tag}
              <span className="remove-tag" onClick={(e) => { e.stopPropagation(); removeTag(idx) }}>&times;</span>
            </span>
          )
        })}
        <input 
          id={`tags-input-${placeholder}`}
          type="text" 
          value={input}
          onChange={e => { setInput(e.target.value); setShowDropdown(true) }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          placeholder={items.length === 0 ? placeholder : ''} 
        />
      </div>
      {showDropdown && matches.length > 0 && input.trim() && (
        <div className="techstack-dropdown show">
          {matches.map(s => {
            const isUrl = s.icon?.startsWith('http')
            return (
              <div key={s.name} className="techstack-dropdown-item" onClick={() => addTag(s.name)}>
                {s.icon ? (isUrl ? <img src={s.icon} alt="" /> : <span className="icon-span" style={{fontSize:'1.1rem'}}>{s.icon}</span>) : <span className="icon-span">⭐</span>}
                {s.name}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
