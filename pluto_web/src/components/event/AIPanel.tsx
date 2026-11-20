import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, BrainCircuit, GraduationCap, X, ChevronRight, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Event } from '@/types'
import { formatTime } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { apiPost } from '@/lib/api'
import './AIPanel.css'

interface AIPanelProps {
  isOpen: boolean
  events: Event[]
  mode: 'explore' | 'community'
}

type TabType = 'skills' | 'wantToLearn' | 'extras'

export function AIPanel({ isOpen, events, mode }: AIPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('skills')
  const [isLoading, setIsLoading] = useState(false)
  const [recommended, setRecommended] = useState<Event[]>([])
  const { user } = useAuthStore()

  useEffect(() => {
    if (isOpen && events.length > 0) {
      loadRecommendations(activeTab)
    }
  }, [isOpen, activeTab, events.length])

  const loadRecommendations = async (tab: TabType) => {
    if (!user || events.length === 0) return
    setIsLoading(true)
    setRecommended([])

    try {
      // 1. Fetch user portfolio
      let { data: portfolio } = await supabase
        .from('portfolios')
        .select('skills, want_to_learn, hobbies, interests')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!portfolio) {
        portfolio = { skills: [], want_to_learn: [], hobbies: [], interests: [] }
      }

      let contextData = ''
      if (tab === 'skills') {
        contextData = portfolio.skills?.length ? `Skills: ${portfolio.skills.join(', ')}` : 'A general student looking for skill-building opportunities.'
      } else if (tab === 'wantToLearn') {
        contextData = portfolio.want_to_learn?.length ? `Wants to learn: ${portfolio.want_to_learn.join(', ')}` : 'A curious student wanting to learn new things.'
      } else {
        contextData = (portfolio.hobbies?.length || portfolio.interests?.length) 
          ? `Hobbies: ${(portfolio.hobbies || []).join(', ')}, Interests: ${(portfolio.interests || []).join(', ')}`
          : 'A student looking for fun extracurricular activities.'
      }

      const availableEvents = events.map(e => ({
        id: e.id,
        title: e.title,
        category: (e as any).category || 'event',
        description: e.description ? e.description.substring(0, 500) : ''
      }))

      const prompt = `You are a personalized recommendation engine for college events.
A student has the following profile information:
${contextData}

Here are the available upcoming events:
${JSON.stringify(availableEvents)}

Task: Carefully read each event's name and description. Select up to 3 events that are strictly related to the student's profile provided above. The recommendation MUST make logical sense based on what the event is about and what the student is interested in.
Output JSON only. Do not include markdown formatting or backticks.
Format exactly as a JSON object containing a "recommendations" array:
{
  "recommendations": [
    {
      "eventId": "event_id_here",
      "reason": "A short, engaging 1-sentence reason starting with an emoji explaining exactly how the event description matches their profile."
    }
  ]
}`

      const groqData: any = await apiPost('/api/ai/recommend', {
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })

      let aiResult = groqData?.choices?.[0]?.message?.content

      let parsed: any = []
      try {
        const jsonObj = JSON.parse(aiResult)
        if (Array.isArray(jsonObj)) {
          parsed = jsonObj
        } else if (jsonObj.recommendations && Array.isArray(jsonObj.recommendations)) {
          parsed = jsonObj.recommendations
        } else if (jsonObj.events && Array.isArray(jsonObj.events)) {
          parsed = jsonObj.events
        } else {
          const values = Object.values(jsonObj)
          const arr = values.find(v => Array.isArray(v))
          if (arr) parsed = arr
        }
      } catch (e) {
        console.error('[AIPanel] Failed to parse JSON from Groq:', aiResult)
      }

      const recommendedEvents = parsed.map((rec: any) => {
        const targetId = rec.eventId || rec.event_id || rec.id
        const eventInfo = events.find((e: any) => String(e.id) === String(targetId))
        
        if (!eventInfo) {
          const titleMatch = events.find((e: any) => e.title && rec.title && e.title.toLowerCase() === rec.title.toLowerCase())
          if (titleMatch) {
            return { ...titleMatch, aiReason: rec.reason || rec.aiReason || rec.ai_reason || 'Highly recommended based on your profile.' }
          }
          return null
        }
        
        return {
          ...eventInfo,
          aiReason: rec.reason || rec.aiReason || rec.ai_reason || 'Highly recommended based on your profile.'
        }
      }).filter(Boolean).slice(0, 3)

      setRecommended(recommendedEvents)
    } catch (err) {
      console.error('[AIPanel] Error fetching recommendations:', err)
      setRecommended([])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="ai-recommendation-panel" id={`ai-recomm-panel-${mode}`}>
      <div className="ai-recomm-header">
        <Sparkles size={16} />
        <span>AI Personalized Recommendations</span>
      </div>
      
      <div className="ai-recomm-tabs">
        <button 
          className={`ai-recomm-tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          <Activity size={14} />
          Based on Skills
        </button>
        <button 
          className={`ai-recomm-tab ${activeTab === 'wantToLearn' ? 'active' : ''}`}
          onClick={() => setActiveTab('wantToLearn')}
        >
          <GraduationCap size={14} />
          Want to Learn
        </button>
        <button 
          className={`ai-recomm-tab ${activeTab === 'extras' ? 'active' : ''}`}
          onClick={() => setActiveTab('extras')}
        >
          <BrainCircuit size={14} />
          Extracurricular
        </button>
      </div>

      <div className="ai-recomm-content" id={`ai-recomm-content-${mode}`}>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ai-recomm-loading"
            >
              <div className="ai-loading-spinner" />
              <div className="ai-loading-text">Analyzing your portfolio & matching events...</div>
            </motion.div>
          ) : recommended.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ai-recomm-empty"
            >
              <X size={28} />
              <div className="empty-title">Recommendations Unavailable</div>
              <div>AI couldn't generate recommendations right now. Please try again in a moment.</div>
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ai-recomm-list"
            >
              {recommended.map((ev, index) => (
                <div className="ai-list-item" style={{ animationDelay: `${index * 0.1}s` }} key={ev.id}>
                  <div className="ai-list-rank">{index + 1}</div>
                  <div className="ai-list-thumb" style={{ backgroundImage: `url(${ev.banner_url || ''})` }}>
                    <span>{ev.price === 0 ? 'Free' : `₹${ev.price}`}</span>
                  </div>
                  <div className="ai-list-content">
                    <h4 className="ai-list-title">{ev.title}</h4>
                    <div className="ai-list-meta">
                      <span>📅 {new Date(ev.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>🕒 {formatTime(ev.start_time || ev.time || '')}</span>
                      <span>📍 {ev.venue}</span>
                    </div>
                    <div className="ai-list-reason">
                      <span>✨</span>
                      <i>"{(ev as any).aiReason || 'Highly recommended based on your profile.'}"</i>
                    </div>
                  </div>
                  <div className="ai-list-action">
                    <Link to={`/admin/events/${ev.id}`} className="ai-list-btn secondary">
                      View Event
                    </Link>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
