import { useState, useMemo, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Award, BookOpen, Star, Brain, Heart,
  Zap, TrendingUp, CalendarDays, Save, Plus, X, ChevronDown,
  GraduationCap, Building2, Palette, Compass, Eye, FileText,
  Rocket, Handshake, Flame, Bot, Check, Hourglass
} from 'lucide-react'
import InstitutionCapImg from '@/assets/Institutioncap.png'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { usePortfolio, useSavePortfolio, useMyProjects, type Portfolio as PortfolioType } from '@/hooks/usePortfolio'
import { apiPost } from '@/lib/api'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { TagsInput } from '@/components/portfolio/TagsInput'
import './Portfolio.css'

const SKILLS_DOMAIN_DB = [
  { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
  { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
  { name: 'TypeScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
  { name: 'Java', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg' },
  { name: 'C++', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg' },
  { name: 'C', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg' },
  { name: 'C#', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg' },
  { name: 'Go', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg' },
  { name: 'Rust', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg' },
  { name: 'Swift', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg' },
  { name: 'Kotlin', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg' },
  { name: 'PHP', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg' },
  { name: 'Ruby', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg' },
  { name: 'Dart', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg' },
  { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
  { name: 'Angular', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg' },
  { name: 'Vue.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg' },
  { name: 'Next.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' },
  { name: 'Node.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
  { name: 'Django', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg' },
  { name: 'Flask', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg' },
  { name: 'Flutter', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg' },
  { name: 'Machine Learning', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg' },
  { name: 'Deep Learning', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg' },
  { name: 'Data Science', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg' },
  { name: 'MongoDB', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg' },
  { name: 'PostgreSQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
  { name: 'MySQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg' },
  { name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
  { name: 'Kubernetes', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg' },
  { name: 'AWS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
  { name: 'Linux', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg' },
  { name: 'Git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
  { name: 'UI/UX Design', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg' },
  { name: 'Figma', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg' },
  { name: 'HTML/CSS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg' },
]

const HOBBIES_DB = [
  { name: 'Painting', icon: '🎨' }, { name: 'Drawing', icon: '✏️' },
  { name: 'Sketching', icon: '📝' }, { name: 'Photography', icon: '📷' },
  { name: 'Videography', icon: '🎬' }, { name: 'Guitar', icon: '🎸' },
  { name: 'Piano', icon: '🎹' }, { name: 'Singing', icon: '🎤' },
  { name: 'Dancing', icon: '💃' }, { name: 'Reading', icon: '📚' },
  { name: 'Writing', icon: '✍️' }, { name: 'Blogging', icon: '📝' },
  { name: 'Cooking', icon: '🍳' }, { name: 'Baking', icon: '🧁' },
  { name: 'Gaming', icon: '🎮' }, { name: 'Chess', icon: '♟️' },
  { name: 'Swimming', icon: '🏊' }, { name: 'Running', icon: '🏃' },
  { name: 'Cycling', icon: '🚴' }, { name: 'Yoga', icon: '🧘' },
  { name: 'Football', icon: '⚽' }, { name: 'Cricket', icon: '🏏' },
  { name: 'Basketball', icon: '🏀' }, { name: 'Badminton', icon: '🏸' },
  { name: 'Hiking', icon: '🥾' }, { name: 'Traveling', icon: '✈️' },
  { name: 'Coding', icon: '💻' }, { name: 'DIY Projects', icon: '🔧' },
]

const INTERESTS_DB = [
  { name: 'Artificial Intelligence', icon: '🤖' }, { name: 'Machine Learning', icon: '🧠' },
  { name: 'Web Development', icon: '🌐' }, { name: 'Mobile Apps', icon: '📱' },
  { name: 'Cybersecurity', icon: '🔒' }, { name: 'Blockchain', icon: '⛓️' },
  { name: 'Cloud Computing', icon: '☁️' }, { name: 'Data Science', icon: '📊' },
  { name: 'Robotics', icon: '🤖' }, { name: 'IoT', icon: '📡' },
  { name: 'Game Development', icon: '🎮' }, { name: 'AR / VR', icon: '🥽' },
  { name: 'Space Tech', icon: '🚀' }, { name: 'Startups', icon: '🚀' },
  { name: 'Entrepreneurship', icon: '💼' }, { name: 'Finance / Fintech', icon: '📈' },
  { name: 'Product Design', icon: '🎨' }, { name: 'UI/UX', icon: '✨' },
  { name: 'Digital Marketing', icon: '📣' }, { name: 'Content Creation', icon: '📝' },
  { name: 'Psychology', icon: '🧠' }, { name: 'Environment', icon: '🌍' },
  { name: 'Music Production', icon: '🎵' }, { name: 'Film Making', icon: '🎥' },
]

const getSkillIcon = (name: string) => {
  if (typeof name !== 'string') return undefined;
  return SKILLS_DOMAIN_DB.find(s => s.name.toLowerCase() === name.toLowerCase())?.icon
}
const getHobbyIcon = (name: string) => {
  if (typeof name !== 'string') return '📌';
  return HOBBIES_DB.find(h => h.name.toLowerCase() === name.toLowerCase())?.icon || '📌'
}
const getInterestIcon = (name: string) => {
  if (typeof name !== 'string') return '📌';
  return INTERESTS_DB.find(i => i.name.toLowerCase() === name.toLowerCase())?.icon || '📌'
}

// Exact legacy level system from portfolio.js getSkillLevelFromXP / getAILevelInfo
const SKILL_LEVELS: Record<number, { label: string; class: string; color: string }> = {
  1: { label: 'Exploring', class: 'exploring', color: '#8b5cf6' },
  2: { label: 'Familiar', class: 'familiar', color: '#3b82f6' },
  3: { label: 'Proficient', class: 'proficient', color: '#6366f1' },
  4: { label: 'Advanced', class: 'advanced', color: '#10b981' },
  5: { label: 'Expert', class: 'expert', color: '#f59e0b' },
}

export default function Portfolio() {
  const { user } = useAuthStore()
  const { data: portfolio, isLoading } = usePortfolio(user?.id)
  const saveMutation = useSavePortfolio()
  const queryClient = useQueryClient()

  // Setup form state
  const [showSetup, setShowSetup] = useState(false)
  const [hobbiesInput, setHobbiesInput] = useState<string[]>([])
  const [interestsInput, setInterestsInput] = useState<string[]>([])
  const [skillsInput, setSkillsInput] = useState<string[]>([])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isReassessing, setIsReassessing] = useState(false)
  const [reassessStatus, setReassessStatus] = useState<string | null>(null)
  const [isGettingInsights, setIsGettingInsights] = useState(false)
  const [aiInsightText, setAiInsightText] = useState<string | null>(null)
  const [aiChatHistory, setAiChatHistory] = useState<{ role: string, content: string }[]>([])

  // Event Journey Modal State
  const [ejModalIdx, setEjModalIdx] = useState<number>(-1)
  const [ejSummary, setEjSummary] = useState('')
  const [ejIsWinner, setEjIsWinner] = useState(false)
  const [ejModalResult, setEjModalResult] = useState<{ insight: string, pts: number } | null>(null)
  const [ejIsSubmitting, setEjIsSubmitting] = useState(false)
  const [ejSubmitLabel, setEjSubmitLabel] = useState<React.ReactNode>('')

  // Inline edit state
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [newTagInput, setNewTagInput] = useState('')
  const [confirmSkill, setConfirmSkill] = useState<string | null>(null)
  const [confirmDeleteSkill, setConfirmDeleteSkill] = useState<string | null>(null)
  const [aiExpanded, setAiExpanded] = useState(false)
  const [aiChatInput, setAiChatInput] = useState('')
  const [showExtracurricular, setShowExtracurricular] = useState(false)
  const [setupStatus, setSetupStatus] = useState<string | null>(null)

  // ── ALL HOOKS MUST BE ABOVE EARLY RETURNS (Rules of Hooks) ──

  // Fetch REAL projects from the projects table
  const { data: myProjects = [], isLoading: isProjectsLoading } = useMyProjects(user?.id)

  // Derive lists safely (portfolio may be null)
  const skillsList = Array.isArray(portfolio?.skills) ? portfolio.skills as string[] : []
  const hobbiesList = Array.isArray(portfolio?.hobbies) ? portfolio.hobbies as string[] : []
  const interestsList = Array.isArray(portfolio?.interests) ? portfolio.interests as string[] : []
  const wantToLearnList = Array.isArray(portfolio?.want_to_learn) ? portfolio.want_to_learn as string[] : []
  const skillLevels = portfolio?.skill_levels || {}

  // Auto-sync booked events into portfolio.events_attended
  const [eventsAttended, setEventsAttended] = useState<any[]>([])

  useEffect(() => {
    if (!user?.id || !portfolio) {
      setEventsAttended(Array.isArray(portfolio?.events_attended) ? portfolio.events_attended as any[] : [])
      return
    }

    // Fetch confirmed bookings from the bookings table
    const syncBookings = async () => {
      try {
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('id, event_id, created_at, events(title, start_date, category, banner_url)')
          .eq('user_id', user.id)
          .neq('booking_status', 'cancelled')
          .order('created_at', { ascending: false })

        if (error || !bookings) {
          setEventsAttended(Array.isArray(portfolio.events_attended) ? portfolio.events_attended as any[] : [])
          return
        }

        // Convert bookings to event journey entries
        const existingEvents = Array.isArray(portfolio.events_attended) ? portfolio.events_attended as any[] : []
        const existingEventIds = new Set(existingEvents.map((e: any) =>
          typeof e === 'object' ? (e.eventId || e.event_id || '') : ''
        ))

        const newEvents: any[] = []
        for (const b of bookings) {
          if (!existingEventIds.has(b.event_id)) {
            const ev = (b as any).events || {}
            newEvents.push({
              eventId: b.event_id,
              title: ev.title || 'Event',
              date: ev.start_date || b.created_at,
              category: ev.category || 'event',
              bannerUrl: ev.banner_url || '',
              summary: '',
              isWinner: false,
              bonusPoints: 0,
            })
          }
        }

        const merged = [...existingEvents, ...newEvents]
        setEventsAttended(merged)

        // Persist newly discovered events to DB (non-blocking)
        if (newEvents.length > 0) {
          saveMutation.mutate({
            userId: user.id,
            data: { events_attended: merged }
          })
        }
      } catch (err) {
        console.error('[Portfolio] Sync bookings error:', err)
        setEventsAttended(Array.isArray(portfolio.events_attended) ? portfolio.events_attended as any[] : [])
      }
    }

    syncBookings()
  }, [user?.id, portfolio?.id])

  // Proper Score Calculation (from real data sources)
  const activeEvents = (eventsAttended.length > 0 ? eventsAttended : (Array.isArray(portfolio?.events_attended) ? portfolio.events_attended as any[] : [])).filter(e => !e?.hidden)
  const scoreBreakdown = useMemo(() => {
    const skillsPts = skillsList.length * 5
    const projectsPts = myProjects.length * 20
    const eventsPts = activeEvents.length * 8
    const profilePts = (portfolio?.course ? 5 : 0) + (portfolio?.department ? 5 : 0)
    const hobbiesPts = hobbiesList.length * 2
    const interestsPts = interestsList.length * 2
    const total = skillsPts + projectsPts + eventsPts + profilePts + hobbiesPts + interestsPts
    return { skillsPts, projectsPts, eventsPts, profilePts, hobbiesPts, interestsPts, total }
  }, [skillsList.length, myProjects.length, activeEvents.length, portfolio?.course, portfolio?.department, hobbiesList.length, interestsList.length])

  // Auto-persist score to DB whenever it changes
  useEffect(() => {
    if (user && portfolio && scoreBreakdown.total !== (portfolio.score || 0)) {
      saveMutation.mutate(
        {
          userId: user.id,
          data: { score: scoreBreakdown.total }
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] })
          }
        }
      )
    }
  }, [scoreBreakdown.total])

  // Pre-fill form when editing an existing portfolio
  useEffect(() => {
    if (portfolio && showSetup) {
      setHobbiesInput(Array.isArray(portfolio.hobbies) ? portfolio.hobbies : [])
      setInterestsInput(Array.isArray(portfolio.interests) ? portfolio.interests : [])
      setSkillsInput(Array.isArray(portfolio.skills) ? portfolio.skills : [])
    }
  }, [portfolio, showSetup])

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert("Error: User is not authenticated.")
      return
    }
    if (skillsInput.length === 0) {
      alert('Please add at least one skill.')
      return
    }

    setSetupStatus('AI Verification...')

    try {
      // Simulate AI verification delay
      await new Promise(r => setTimeout(r, 1500))

      setSetupStatus('Saving to Database...')
      await saveMutation.mutateAsync({
        userId: user.id,
        data: {
          course: user.course || '',
          department: user.department || '',
          hobbies: hobbiesInput,
          interests: interestsInput,
          skills: skillsInput,
          skill_levels: portfolio?.skill_levels || {},
          want_to_learn: portfolio?.want_to_learn || [],
          events_attended: portfolio?.events_attended || [],
          score: portfolio?.score || 0,
        },
      })
      setSetupStatus('Complete!')
      setShowSetup(false)
    } catch (err: any) {
      console.error("Failed to save portfolio:", err)
      alert("Failed to save portfolio: " + err.message)
    } finally {
      setSetupStatus(null)
    }
  }

  const handleReassess = async () => {
    if (!user || !portfolio) return
    setIsReassessing(true)
    setReassessStatus('Assessing with AI...')
    try {
      // Simulate AI analyzing projects to determine bonus XP
      await new Promise(r => setTimeout(r, 2000))

      const newBonusXp: Record<string, number> = {}
        ; (portfolio.skills as string[] || []).forEach((skill) => {
          // Dummy logic: give a random bonus XP from 10 to 40
          newBonusXp[skill] = Math.floor(Math.random() * 30) + 10
        })

      const updatedSkillLevels = { ...(portfolio.skill_levels as any || {}), ...newBonusXp }

      // Optimistic update
      queryClient.setQueryData(['portfolio', user.id], {
        ...portfolio,
        skill_levels: updatedSkillLevels
      });

      await saveMutation.mutateAsync({
        userId: user.id,
        data: { skill_levels: updatedSkillLevels }
      })

      setReassessStatus('✅ Skills Updated!')
      setTimeout(() => setReassessStatus(null), 3000)
    } catch (err) {
      setReassessStatus('❌ Assessment Failed')
      setTimeout(() => setReassessStatus(null), 3000)
    } finally {
      setIsReassessing(false)
    }
  }

  const handleGetInsights = async (customQuestion?: string) => {
    if (!user || !portfolio) return
    setIsGettingInsights(true)
    try {
      const skillsList_ = (portfolio.skills as string[]) || []
      const eventsList_ = (portfolio.events_attended as any[]) || []
      const wantToLearn_ = (portfolio.want_to_learn as string[]) || []

      const profileContext = `Student Profile:
- Department: ${portfolio.department || 'Not specified'}
- Course: ${portfolio.course || 'Not specified'}
- Skills (${skillsList_.length}): ${skillsList_.join(', ') || 'None'}
- Events Attended: ${eventsList_.length}
- Skills They Want to Learn: ${wantToLearn_.join(', ') || 'None'}
- Hobbies: ${((portfolio.hobbies as string[]) || []).join(', ') || 'None'}
- Growth Score: ${portfolio.score || 0}`

      const systemMessage = {
        role: 'system',
        content: `You are PLUTO AI, a friendly, smart, and helpful AI assistant for college students on the PLUTO platform.

Here is the student's portfolio data:
${profileContext}

You can help with ANYTHING the student asks — career advice, study doubts, coding help, project ideas, exam tips, skill recommendations, motivation, or casual conversation.

Rules:
- Remember the full conversation context. If the student refers to something discussed earlier, use that context.
- Be proactive — if you notice gaps or opportunities in their profile, suggest them naturally.
- Be warm, motivating, and specific. Don't give generic advice.
- Keep answers concise (3-5 sentences) unless the student asks for detail.
- If the student hasn't asked anything specific, analyze their portfolio and give a detailed growth report with Strengths, Growth Areas, Next Steps, and Career Suggestions.`
      }

      const userMsg = customQuestion || 'Analyze my portfolio and give me a detailed growth report.'

      // Add user message to history
      const updatedHistory = [...aiChatHistory, { role: 'user', content: userMsg }]
      setAiChatHistory(updatedHistory)

      // Build messages array: system + full conversation history
      const apiMessages = [systemMessage, ...updatedHistory]

      let aiReply = ''

      try {
        const data: any = await apiPost('/api/ai/chat', {
          messages: apiMessages,
          max_tokens: 800,
          temperature: 0.7
        })
        if (data?.choices?.[0]?.message?.content) {
          aiReply = data.choices[0].message.content.trim()
        }
      } catch (err) {
        console.error('AI insight error', err)
      }

      if (!aiReply) {
        aiReply = 'Sorry, I couldn\'t process that right now. Please try again!'
      }

      // Add assistant reply to history
      setAiChatHistory(prev => [...prev, { role: 'assistant', content: aiReply }])
      setAiInsightText(aiReply)
      setIsGettingInsights(false)

      // Save last insight to DB (non-blocking)
      try {
        await saveMutation.mutateAsync({
          userId: user.id,
          data: { ai_insights: aiReply }
        })
      } catch (saveErr) {
        console.error('Save insight error (non-critical):', saveErr)
      }
    } catch (outerErr) {
      console.error('Insight error:', outerErr)
      setIsGettingInsights(false)
    }
  }

  const addTag = async (field: 'skills' | 'hobbies' | 'interests' | 'want_to_learn', tag: string) => {
    if (!user || !portfolio || !tag.trim()) return
    const current = (portfolio[field] as string[]) || []
    if (current.includes(tag.trim())) return
    await saveMutation.mutateAsync({
      userId: user.id,
      data: { [field]: [...current, tag.trim()] },
    })
    setNewTagInput('')
  }

  const removeTag = async (field: 'skills' | 'hobbies' | 'interests' | 'want_to_learn', tag: string) => {
    if (!user || !portfolio) return
    const current = (portfolio[field] as string[]) || []
    const updated = current.filter(t => t !== tag)
    queryClient.setQueryData(['portfolio', user.id], { ...portfolio, [field]: updated })
    try {
      await saveMutation.mutateAsync({ userId: user.id, data: { [field]: updated } })
    } catch (err) {
      console.error('Remove tag error:', err)
    }
  }

  const openEjModal = (idx: number, ev: any) => {
    setEjModalIdx(idx)
    setEjSummary(ev.summary || '')
    setEjIsWinner(ev.isWinner || false)
    setEjSubmitLabel('')
    if (ev.aiInsight) {
      setEjModalResult({ insight: ev.aiInsight, pts: ev.bonusPoints || 0 })
    } else {
      setEjModalResult(null)
    }
  }

  const closeAndSaveEjModal = async () => {
    if (!user || !portfolio || ejModalIdx === -1) {
      setEjModalIdx(-1)
      return
    }
    const evs = [...(portfolio.events_attended as any[] || [])]
    const ev = evs[ejModalIdx]
    if (!ev) {
      setEjModalIdx(-1)
      return
    }

    if (ev.summary !== ejSummary.trim() || ev.isWinner !== ejIsWinner) {
      evs[ejModalIdx] = {
        ...ev,
        summary: ejSummary.trim(),
        isWinner: ejIsWinner,
      }
      queryClient.setQueryData(['portfolio', user.id], { ...portfolio, events_attended: evs })
      try {
        await saveMutation.mutateAsync({ userId: user.id, data: { events_attended: evs } })
      } catch (err) {
        console.error('Save error', err)
      }
    }
    setEjModalIdx(-1)
    setEjModalResult(null)
  }

  const submitEjSummary = async () => {
    if (!user || !portfolio || ejModalIdx === -1) return

    if (!ejSummary.trim()) {
      alert('Please write a short summary of what you did at this event.')
      return
    }

    const evs = [...(portfolio.events_attended as any[] || [])]
    if (!evs[ejModalIdx]) {
      alert('Event not found in your journey.')
      return
    }

    setEjIsSubmitting(true)
    setEjSubmitLabel(<>Analyzing...</>)

    try {
      const ev = evs[ejModalIdx]
      const prompt = `You are an AI evaluator for a student portfolio platform called PLUTO.
A student attended the event "${ev.title || 'Event'}" (category: ${ev.category || 'general'}).

The student's summary of what they did/learned:
"${ejSummary.trim()}"

Did they win? ${ejIsWinner ? 'Yes' : 'No'}

Based on this summary, evaluate:
1. Assign bonus points (0 to 10) based on depth of learning, quality of participation, and relevance.
2. Give a 1-2 sentence AI insight about their growth from this event.

Reply ONLY as strictly valid JSON. No markdown, no backticks, no comments.
Format: {"bonusPoints": 5, "aiInsight": "Your one-line insight here."}`

      let bonus = 0
      let insight = 'Summary saved! AI analysis is temporarily unavailable.'

      try {
        let rawContent = null

        // Route through secure backend proxy
        const data: any = await apiPost('/api/ai/evaluate', {
          messages: [{ role: "user", content: prompt }],
          max_tokens: 600,
          temperature: 0.6
        })
        rawContent = data?.choices?.[0]?.message?.content

        if (rawContent) {
          const cleaned = rawContent.replace(/^```(json)?|```$/gm, '').trim()
          const parsed = JSON.parse(cleaned)
          bonus = Math.min(Math.max(parsed.bonusPoints || 0, 0), 10)
          insight = parsed.aiInsight || ''
        }
      } catch (aiErr) {
        console.error('AI error:', aiErr)
      }

      evs[ejModalIdx] = {
        ...ev,
        summary: ejSummary.trim(),
        isWinner: ejIsWinner,
        aiInsight: insight,
        bonusPoints: bonus,
        analyzedAt: new Date().toISOString()
      }

      // Show result immediately BEFORE saving to DB
      setEjModalResult({ insight, pts: bonus })
      setEjSubmitLabel(<span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={16} /> Saved!</span>)
      setEjIsSubmitting(false)

      // Optimistic cache update so re-render doesn't wipe state
      if (portfolio && user) {
        queryClient.setQueryData(['portfolio', user.id], {
          ...portfolio,
          events_attended: evs
        })
      }

      // Save to DB in background
      try {
        await saveMutation.mutateAsync({
          userId: user.id,
          data: { events_attended: evs }
        })
      } catch (saveErr) {
        console.error('Save error (non-critical):', saveErr)
      }
    } catch (err) {
      // Still save summary even if something fails
      const ev = evs[ejModalIdx]
      evs[ejModalIdx] = {
        ...ev,
        summary: ejSummary.trim(),
        isWinner: ejIsWinner,
      }

      setEjSubmitLabel(<span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={16} /> Saved (no AI)</span>)
      setEjModalResult({ insight: 'Summary saved! AI analysis is temporarily unavailable.', pts: 0 })
      setEjIsSubmitting(false)

      try {
        await saveMutation.mutateAsync({
          userId: user.id,
          data: { events_attended: evs }
        })
      } catch { }
    }
  }

  const removeAttendedEvent = async (idx: number) => {
    if (!user || !portfolio) return
    if (!window.confirm('Remove this event from your journey?')) return
    const evs = [...(portfolio.events_attended as any[] || [])]

    // Instead of completely removing, we mark it as hidden so syncBookings doesn't re-add it
    if (typeof evs[idx] === 'object') {
      evs[idx] = { ...evs[idx], hidden: true }
    } else {
      evs[idx] = { title: evs[idx], hidden: true }
    }

    setEventsAttended(evs)
    queryClient.setQueryData(['portfolio', user.id], { ...portfolio, events_attended: evs })
    try {
      await saveMutation.mutateAsync({ userId: user.id, data: { events_attended: evs } })
    } catch (err) {
      console.error('Delete event error:', err)
    }
  }

  if (!user) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <Helmet><title>Portfolio | PLUTO</title></Helmet>
        <Award size={72} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.5 }} />
        <h2 style={{ color: 'var(--white)', marginTop: '1rem' }}>Login Required</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Sign in to view and manage your portfolio</p>
      </div>
    )
  }

  // Loading Skeleton
  if (isLoading || isProjectsLoading) {
    return (
      <div className="container pf-container">
        <Helmet><title>Portfolio | PLUTO</title></Helmet>
        <div className="portfolio-panel active">

          {/* SCORE HERO SKELETON */}
          <div className="score-hero">
            <div className="score-ring-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="pf-skeleton-box" style={{ width: 108, height: 108, borderRadius: '50%' }}></div>
            </div>
            <div className="score-details" style={{ flex: 1, paddingLeft: '1rem' }}>
              <div className="pf-skeleton-box" style={{ width: 320, height: 36, marginBottom: 12, borderRadius: 8 }}></div>
              <div className="pf-skeleton-box" style={{ width: 420, height: 18, marginBottom: 20, borderRadius: 6 }}></div>
              <div className="pf-skeleton-box" style={{ width: 220, height: 34, borderRadius: 20, marginBottom: 24 }}></div>
              <div className="score-breakdown">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="score-chip" style={{ width: 100, height: 32, position: 'relative', overflow: 'hidden', padding: 0, border: 'none', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}><div className="pf-skeleton-box" style={{ position: 'absolute', inset: 0, borderRadius: 0 }}></div></div>)}
              </div>
            </div>
          </div>

          {/* ANALYTICS DASHBOARD SKELETON */}
          <div className="portfolio-analytics">
            <div className="portfolio-analytics-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="analytics-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <div className="pf-skeleton-box" style={{ width: 40, height: 36, borderRadius: 8 }}></div>
                  <div className="pf-skeleton-box" style={{ width: 110, height: 14, borderRadius: 4 }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* ACHIEVEMENTS SKELETON */}
          <div className="achievements-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div className="pf-skeleton-box" style={{ width: 16, height: 16, borderRadius: '50%' }}></div>
              <div className="pf-skeleton-box" style={{ width: 140, height: 18, borderRadius: 6 }}></div>
            </div>
            <div className="achievements-row">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="achievement-badge locked" style={{ width: 140, height: 36, position: 'relative', overflow: 'hidden', padding: 0 }}>
                  <div className="pf-skeleton-box" style={{ position: 'absolute', inset: 0, borderRadius: 0 }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* EVENTS JOURNEY SKELETON */}
          <div className="events-journey-section">
            <div className="events-journey-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div className="pf-skeleton-box" style={{ width: 24, height: 24, borderRadius: '50%' }}></div>
                  <div className="pf-skeleton-box" style={{ width: 180, height: 24, borderRadius: 6 }}></div>
                </div>
                <div className="pf-skeleton-box" style={{ width: 300, height: 16, borderRadius: 4 }}></div>
              </div>
            </div>
            <div className="ej-scroll-row" style={{ overflow: 'hidden' }}>
              {[1, 2, 3].map(i => <div key={i} className="pf-skeleton-box" style={{ width: 300, height: 160, borderRadius: 16, flexShrink: 0 }}></div>)}
            </div>
          </div>

          {/* COLUMNS SKELETON */}
          <div className="portfolio-columns" style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', alignItems: 'flex-start' }}>
            <div className="portfolio-left" style={{ flex: '1.2', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                <div className="pf-skeleton-box" style={{ width: 140, height: 24, borderRadius: 6 }}></div>
                <div className="pf-skeleton-box" style={{ width: 180, height: 36, borderRadius: 20 }}></div>
              </div>
              <div className="skills-grid">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="skill-card-v2" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#1e1e1e', border: 'none', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <div className="skill-card-top">
                      <div className="pf-skeleton-box" style={{ width: 38, height: 38, borderRadius: 10 }}></div>
                      <div style={{ flex: 1 }}>
                        <div className="pf-skeleton-box" style={{ width: '80%', height: 18, borderRadius: 4, marginBottom: 6 }}></div>
                        <div className="pf-skeleton-box" style={{ width: '40%', height: 12, borderRadius: 4 }}></div>
                      </div>
                    </div>
                    <div className="pf-skeleton-box" style={{ width: '100%', height: 8, borderRadius: 4 }}></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="portfolio-right" style={{ flex: '0.8', minWidth: 0 }}>
              <div className="ai-insights-panel" style={{ display: 'flex', flexDirection: 'column', height: 450 }}>
                <div className="ai-panel-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="pf-skeleton-box" style={{ width: 28, height: 28, borderRadius: '50%' }}></div>
                    <div className="pf-skeleton-box" style={{ width: 140, height: 20, borderRadius: 4 }}></div>
                  </div>
                </div>
                <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="pf-skeleton-box" style={{ width: '100%', height: 60, borderRadius: 12 }}></div>
                  <div className="pf-skeleton-box" style={{ width: '80%', height: 60, borderRadius: 12 }}></div>
                  <div className="pf-skeleton-box" style={{ width: '90%', height: 60, borderRadius: 12 }}></div>
                </div>
                <div className="ai-chat-input-area" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="pf-skeleton-box" style={{ width: '100%', height: 44, borderRadius: 22 }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

  // No portfolio — show setup
  if (!portfolio || showSetup) {
    return (
      <>
        <Helmet><title>Setup Portfolio | PLUTO</title></Helmet>
        <div className="setup-container">
          <motion.div
            className="setup-card"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >

            {/* ── LEFT BRANDING PANEL ── */}
            <div className="setup-left">
              <div className="setup-left-content">
                <div className="setup-icon-wrapper">
                  <img src={InstitutionCapImg} alt="Portfolio" className="setup-logo-img" />
                </div>
                <h1 className="setup-title">Build Your<br />Portfolio</h1>
                <p className="setup-subtitle">Tell us about yourself so PLUTO AI can build your personalized growth portfolio</p>

                <div className="setup-features">
                  <div className="setup-feature-item">
                    <svg width="14" height="14" viewBox="0 0 28 28" className="gemini-sparkle-icon">
                      <path d="M14 0C14 7.73 20.27 14 28 14C20.27 14 14 20.27 14 28C14 20.27 7.73 14 0 14C7.73 14 14 7.73 14 0Z" fill="url(#gemini-grad-left)" />
                      <defs><linearGradient id="gemini-grad-left" x1="0" y1="0" x2="28" y2="28"><stop offset="0%" stopColor="#ef4444" /><stop offset="25%" stopColor="#fbbf24" /><stop offset="50%" stopColor="#9ca3af" /><stop offset="75%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#ef4444" /></linearGradient></defs>
                    </svg>
                    <span>AI-Powered Skill Verification</span>
                  </div>
                  <div className="setup-feature-item">
                    <TrendingUp size={14} color="#34d399" fill="rgba(52,211,153,0.25)" />
                    <span>Track Your Growth Score</span>
                  </div>
                  <div className="setup-feature-item">
                    <Award size={14} color="#fbbf24" fill="rgba(251,191,36,0.25)" />
                    <span>Earn Achievements & Badges</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT FORM PANEL ── */}
            <div className="setup-right">
              <form id="setup-form" onSubmit={handleSetup}>
                <div className="form-row-2">
                  <div className="form-group">
                    <label><BookOpen size={14} color="#6366f1" fill="rgba(99,102,241,0.25)" /> Course</label>
                    <div className="setup-input" style={{ display: 'flex', alignItems: 'center', padding: '0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', color: 'rgba(255,255,255,0.6)', cursor: 'not-allowed' }}>
                      {user?.course || 'Not specified'}
                    </div>
                  </div>
                  <div className="form-group">
                    <label><Building2 size={14} color="#ec4899" fill="rgba(236,72,153,0.25)" /> Department</label>
                    <div className="setup-input" style={{ display: 'flex', alignItems: 'center', padding: '0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', color: 'rgba(255,255,255,0.6)', cursor: 'not-allowed' }}>
                      {user?.department || 'Not specified'}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label><Palette size={14} color="#f59e0b" fill="rgba(245,158,11,0.25)" /> Hobbies</label>
                  <TagsInput items={hobbiesInput} setItems={setHobbiesInput} db={HOBBIES_DB} placeholder="Search hobbies (e.g. Painting, Guitar, Football)" />
                </div>

                <div className="form-group">
                  <label><Compass size={14} color="#10b981" fill="rgba(16,185,129,0.25)" /> Interests</label>
                  <TagsInput items={interestsInput} setItems={setInterestsInput} db={INTERESTS_DB} placeholder="Search interests (e.g. AI, Startups, Blockchain)" />
                </div>

                <div className="form-group">
                  <label><Zap size={14} color="#8b5cf6" fill="rgba(139,92,246,0.25)" /> Skills *</label>
                  <TagsInput items={skillsInput} setItems={setSkillsInput} db={SKILLS_DOMAIN_DB} placeholder="Search skills (e.g. Python, React, Machine Learning)" />
                  <div className={`ai-verify-hint gemini-style ${setupStatus ? 'analyzing' : ''}`}>
                    <svg width="13" height="13" viewBox="0 0 28 28" className="gemini-sparkle-icon">
                      <path d="M14 0C14 7.73 20.27 14 28 14C20.27 14 14 20.27 14 28C14 20.27 7.73 14 0 14C7.73 14 14 7.73 14 0Z" fill="url(#gemini-grad-right)" />
                      <defs><linearGradient id="gemini-grad-right" x1="0" y1="0" x2="28" y2="28"><stop offset="0%" stopColor="#ef4444" /><stop offset="25%" stopColor="#fbbf24" /><stop offset="50%" stopColor="#9ca3af" /><stop offset="75%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#ef4444" /></linearGradient></defs>
                    </svg>
                    <span>{setupStatus ? setupStatus : 'Skills will be verified by PLUTO AI'}</span>
                  </div>
                </div>

                <button type="submit" className="setup-submit-btn" disabled={!!setupStatus}>
                  {setupStatus ? setupStatus : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 28 28">
                        <path d="M14 0C14 7.73 20.27 14 28 14C20.27 14 14 20.27 14 28C14 20.27 7.73 14 0 14C7.73 14 14 7.73 14 0Z" fill="white" />
                      </svg>
                      Create My Portfolio
                    </>
                  )}
                </button>
              </form>
            </div>

          </motion.div>
        </div>
      </>
    )
  }

  // skillsList, hobbiesList, etc. are already computed above (before early returns)

  // Domain logic
  const SKILL_DOMAINS: Record<string, string[]> = {
    'Frontend': ['React', 'Angular', 'Vue.js', 'Next.js', 'Svelte', 'HTML/CSS', 'HTML', 'CSS', 'TailwindCSS', 'Bootstrap', 'Sass', 'Web Development', 'JavaScript', 'TypeScript', 'Three.js', 'Electron', 'UI/UX Design', 'Figma'],
    'Backend': ['Node.js', 'Express', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot', 'PHP', 'Ruby', 'Go', 'Rust', 'Java', 'C#', 'API Development', 'GraphQL', 'Nginx'],
    'AI / ML': ['Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'OpenCV', 'Computer Vision', 'NLP', 'Data Science', 'Data Analysis', 'Pandas', 'NumPy', 'R', 'Python'],
    'Design': ['Figma', 'Blender', '3D Modeling', 'Graphic Design', 'Video Editing', 'UI/UX Design'],
    'DevOps': ['Docker', 'Kubernetes', 'AWS', 'Linux', 'Git', 'GitHub', 'CI/CD', 'Cloud Computing', 'Nginx', 'Vercel', 'Netlify', 'Heroku', 'Firebase', 'Supabase'],
    'General': ['C', 'C++', 'Dart', 'Kotlin', 'Swift', 'Mobile Development', 'Android', 'iOS', 'Flutter', 'React Native', 'Game Development', 'Unity', 'Blockchain', 'Cybersecurity', 'IoT', 'Embedded Systems', 'Testing', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis']
  }

  const getSkillDomain = (skillName: string) => {
    if (typeof skillName !== 'string') return 'General'
    for (const [domain, skills] of Object.entries(SKILL_DOMAINS)) {
      if (skills.some(s => s.toLowerCase() === skillName.toLowerCase())) return domain
    }
    return 'General'
  }

  const domainColors: Record<string, string> = { 'Frontend': '#6366f1', 'Backend': '#10b981', 'AI / ML': '#f59e0b', 'Design': '#ec4899', 'DevOps': '#3b82f6', 'General': '#8b5cf6' }
  const domainCounts: Record<string, number> = {}
  skillsList.forEach(s => {
    const d = getSkillDomain(s)
    domainCounts[d] = (domainCounts[d] || 0) + 1
  })

  return (
    <>
      <Helmet><title>Portfolio | PLUTO</title></Helmet>

      <div className="portfolio-panel active">
        {/* SCORE HERO */}
        <div className="score-hero">
          <div className="score-ring-container">
            <svg viewBox="0 0 120 120">
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#6366f1' }} />
                  <stop offset="100%" style={{ stopColor: '#ec4899' }} />
                </linearGradient>
              </defs>
              <circle className="score-ring-bg" cx="60" cy="60" r="54" />
              <circle
                className="score-ring-fill"
                cx="60" cy="60" r="54"
                strokeDasharray="339.29"
                strokeDashoffset={339.29 - (339.29 * Math.min(scoreBreakdown.total / 1000, 1))}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="score-ring-text">
              <div className="score-number">{scoreBreakdown.total}</div>
              <div className="score-label">SCORE</div>
            </div>
          </div>
          
          <div className="score-details" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
            <h2 className="shiny-text" style={{ background: 'linear-gradient(to right, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 4px 0' }}>Portfolio Score</h2>
            <p className="score-subtitle" style={{ margin: '0 0 8px 0', color: 'rgba(255,255,255,0.6)' }}>Your cumulative growth across skills, projects & events.</p>
            <div className="score-rank-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#3b2f4f', padding: '6px 12px', borderRadius: '16px' }}>
              <Star size={12} color="#a78bfa" />
              <span style={{ fontSize: '11px', color: '#b9a5fa', fontWeight: 'bold' }}>{scoreBreakdown.total >= 300 ? 'Top 10% · Gold' : scoreBreakdown.total >= 100 ? 'Rising Star' : 'Getting Started'}</span>
            </div>
            
            <div className="score-breakdown hide-mobile">
              <div className="score-chip"><span className="chip-label-wrap"><Sparkles className="chip-icon" /> Skills</span> <span className="chip-pts">+{scoreBreakdown.skillsPts}</span></div>
              <div className="score-chip"><span className="chip-label-wrap"><Award className="chip-icon" /> Projects</span> <span className="chip-pts">+{scoreBreakdown.projectsPts}</span></div>
              <div className="score-chip"><span className="chip-label-wrap"><CalendarDays className="chip-icon" /> Events</span> <span className="chip-pts">+{scoreBreakdown.eventsPts}</span></div>
              <div className="score-chip"><span className="chip-label-wrap"><Heart className="chip-icon" /> Hobbies</span> <span className="chip-pts">+{scoreBreakdown.hobbiesPts}</span></div>
              <div className="score-chip"><span className="chip-label-wrap"><TrendingUp className="chip-icon" /> Profile</span> <span className="chip-pts">+{scoreBreakdown.profilePts}</span></div>
            </div>
          </div>
        </div>

        {/* ANALYTICS DASHBOARD */}
        <div className="portfolio-analytics">
          <div className="portfolio-analytics-grid">
            <div className="analytics-card card-skills"><div className="analytics-value">{skillsList.length}</div><div className="analytics-label">SKILLS</div></div>
            <div className="analytics-card card-events"><div className="analytics-value">{eventsAttended.length}</div><div className="analytics-label">EVENTS ATTENDED</div></div>
            <div className="analytics-card card-projects"><div className="analytics-value">{myProjects.length}</div><div className="analytics-label">PROJECTS BUILT</div></div>
            <div className="analytics-card card-growth"><div className="analytics-value">{scoreBreakdown.total}</div><div className="analytics-label">GROWTH SCORE</div></div>
          </div>
        </div>

        {/* ACHIEVEMENTS */}
        <div className="achievements-section">
          <div className="achievements-title"><Award style={{ width: 14, height: 14 }} /> Achievements</div>
          <div className="achievements-row">
            <div className={`achievement-badge ${myProjects.length > 0 ? 'earned' : 'locked'}`}><Rocket size={14} /> First Launch</div>
            <div className={`achievement-badge ${skillsList.length >= 5 ? 'earned' : 'locked'}`}><Brain size={14} /> Skill Master</div>
            <div className={`achievement-badge ${myProjects.length >= 3 ? 'earned' : 'locked'}`}><Handshake size={14} /> Builder</div>
            <div className={`achievement-badge ${eventsAttended.length >= 3 ? 'earned' : 'locked'}`}><Flame size={14} /> Event Regular</div>
          </div>
        </div>

        {/* EVENTS JOURNEY */}
        <div className="events-journey-section">
          <div className="events-journey-header">
            <div>
              <h2><CalendarDays className="panel-icon" /> Events Journey</h2>
              <p>Events you attended and their impact on your growth</p>
            </div>
          </div>
          <div className="ej-scroll-row">
            {eventsAttended.length === 0 ? (
              <div className="ej-empty"><span className="ej-empty-icon">🎫</span><div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '0.25rem' }}>No Events Yet</div><div>Book events on the Explore page to see them here!</div></div>
            ) : eventsAttended.map((evt: any, i: number) => {
              const cat = (typeof evt === 'object' ? (evt.category || 'event') : 'event').toLowerCase()
              const catIcons: Record<string, string> = { tech: '💻', music: '🎵', art: '🎨', sports: '⚽', cultural: '🎭', drama: '🎬', orator: '🎤', workshop: '🔧', hackathon: '🚀', seminar: '🎓', event: '🎫', other: '📌' }
              const icon = catIcons[cat] || '📌'
              const title = typeof evt === 'string' ? evt : evt.title || 'Event'
              const dateStr = typeof evt === 'object' && evt.date ? new Date(evt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''
              const bannerUrl = typeof evt === 'object' ? evt.bannerUrl : ''
              const hasSummary = typeof evt === 'object' && evt.summary
              const pts = 8 + (typeof evt === 'object' && evt.isWinner ? 15 : 0) + (typeof evt === 'object' && evt.bonusPoints ? evt.bonusPoints : 0)
              if (evt && evt.hidden) return null;
              return (
                <div key={i} className={`ej-card ${typeof evt === 'object' && evt.isWinner ? 'winner' : ''}`}>
                  {bannerUrl ? <img className="ej-banner" src={bannerUrl} alt={title} onError={(e) => { (e.target as HTMLImageElement).outerHTML = `<div class="ej-banner-placeholder">${icon}</div>` }} /> : <div className="ej-banner-placeholder">{icon}</div>}
                  
                  {/* DESKTOP LAYOUT */}
                  <div className="ej-body hide-mobile">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <div className="ej-title" style={{ marginBottom: 0 }}>{title}</div>
                      {typeof evt === 'object' && evt.isWinner && <span title="Winner" style={{ fontSize: '1.2rem', lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>🏆</span>}
                    </div>
                    <div className="ej-meta">
                      {dateStr && <span className="ej-date">{dateStr}</span>}
                      <span className="ej-cat">{cat.toUpperCase()}</span>
                      <span className="ej-pts">+{pts}pts</span>
                    </div>
                  </div>
                  <div className="ej-actions hide-mobile">
                    <button className={`ej-btn ${hasSummary ? 'ej-btn-view' : 'ej-btn-summary'}`} onClick={() => openEjModal(i, evt)}>
                      {hasSummary ? <><Eye size={14} /> View</> : <><FileText size={14} /> Summary</>}
                    </button>
                    <button className="ej-btn ej-btn-remove" onClick={(e) => { e.stopPropagation(); removeAttendedEvent(i); }}>✕</button>
                  </div>

                  {/* MOBILE LAYOUT */}
                  <div className="ej-overlay hide-desktop flex" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'column', background: 'rgba(0,0,0,0.5)', padding: '12px', zIndex: 2 }}>
                    <div className="ej-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="ej-cat" style={{ background: 'rgba(255,255,255,0.12)', color: '#d1d5db', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>{cat.toUpperCase()}</span>
                      <span className="ej-pts" style={{ color: '#34d399', fontSize: '11px', fontWeight: 700, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>+{pts}pts</span>
                    </div>
                    <div style={{ flex: 1 }} />
                    <div className="ej-body-mobile">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="ej-title" style={{ color: '#fff', fontSize: '14px', fontWeight: 700, marginBottom: '2px', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>{title}</div>
                        {typeof evt === 'object' && evt.isWinner && <span style={{ fontSize: '16px' }}>🏆</span>}
                      </div>
                      <div className="ej-date" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', marginBottom: '8px' }}>{dateStr}</div>
                      
                      <div className="ej-actions-mobile" style={{ display: 'flex', flexDirection: 'row', gap: '8px', marginTop: '4px' }}>
                        <button className={`ej-btn ${hasSummary ? 'ej-btn-view' : 'ej-btn-summary'}`} onClick={() => openEjModal(i, evt)} style={{ flex: 1, padding: '8px 0', borderRadius: '20px', background: hasSummary ? '#10b981' : 'rgba(99,102,241,0.8)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {hasSummary ? <span style={{ fontSize: '11px', fontWeight: 700 }}>View</span> : <span style={{ fontSize: '11px', fontWeight: 700 }}>Summary</span>}
                        </button>
                        <button className="ej-btn-remove" onClick={(e) => { e.stopPropagation(); removeAttendedEvent(i); }} style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.15)', borderRadius: '15px', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="panel-divider"></div>

        {/* SKILLS / EXTRACURRICULAR FLIP */}
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2><Award className="panel-icon" /> {showExtracurricular ? 'Extracurricular' : 'Skills'}</h2>
            <p>{showExtracurricular ? 'Your hobbies, interests, and more' : 'Your verified skills with AI-powered level assessment'}</p>
          </div>
          <button onClick={() => setShowExtracurricular(!showExtracurricular)} style={{
            background: '#1e1e1e', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            color: '#fff', padding: '0.4rem 1rem', borderRadius: '20px', cursor: 'pointer',
            fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.3s', display: 'flex',
            alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#282828'}
            onMouseLeave={e => e.currentTarget.style.background = '#1e1e1e'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>
            {showExtracurricular ? 'Show Skills' : 'Show Extracurricular'}
          </button>
        </div>

        {!showExtracurricular ? (<>
          {skillsList.length > 0 && (
            <div className="domain-distribution">
              <div className="domain-bar-track">
                {Object.entries(domainCounts).map(([domain, count]) => (
                  <div key={domain} className="domain-bar-segment" style={{ width: `${(count / skillsList.length) * 100}%`, background: domainColors[domain] }} title={domain} />
                ))}
              </div>
              <div className="domain-legend">
                {Object.entries(domainCounts).map(([domain, count]) => (
                  <span key={domain} className="domain-legend-item">
                    <span className="domain-dot" style={{ background: domainColors[domain] }} />
                    {domain} <span style={{ color: 'rgba(255,255,255,0.4)' }}>{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="skills-grid">
            {skillsList.map((skill: string) => {
              // Calculate skill XP from real data sources
              let xp = 10
              // +25 XP for each project that uses this skill in its tech_stack
              myProjects.forEach((proj) => {
                if ((proj.tech_stack || []).some((t: string) => t.toLowerCase() === skill.toLowerCase())) xp += 25
              })
              xp += (eventsAttended.length) * 2

              // Add AI Bonus XP if it exists
              const aiBonusLevels = (portfolio.skill_levels as Record<string, number>) || {}
              if (typeof aiBonusLevels[skill] === 'number') {
                xp += aiBonusLevels[skill]
              }

              xp = Math.min(xp, 100)

              // Exact legacy getSkillLevelFromXP logic (portfolio.js:735)
              let info = xp >= 85 ? SKILL_LEVELS[5] : xp >= 65 ? SKILL_LEVELS[4] : xp >= 45 ? SKILL_LEVELS[3] : xp >= 25 ? SKILL_LEVELS[2] : SKILL_LEVELS[1]

              const domain = getSkillDomain(skill)
              const xpWidth = `${xp}%`
              const icon = getSkillIcon(skill)
              const isUrl = icon?.startsWith('http')

              return (
                <div key={skill} className="skill-card-v2" style={{ position: 'relative' }}>
                  {confirmDeleteSkill === skill ? (
                    <div style={{ position: 'absolute', top: -8, right: -8, background: 'rgba(20,20,30,0.95)', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '0.5rem', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 10, backdropFilter: 'blur(10px)', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.72rem', color: '#fff' }}>Remove?</span>
                      <button style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.15rem 0.4rem', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setConfirmDeleteSkill(null); removeTag('skills', skill); }}>Yes</button>
                      <button style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.15rem 0.4rem', fontSize: '0.7rem', cursor: 'pointer' }} onClick={() => setConfirmDeleteSkill(null)}>No</button>
                    </div>
                  ) : (
                    <button
                      className="pf-skill-remove-btn"
                      onClick={() => setConfirmDeleteSkill(skill)}
                      title="Remove skill"
                    >×</button>
                  )}
                  <div className="skill-card-top">
                    <div className="skill-icon-wrap">
                      {icon ? (isUrl ? <img src={icon} alt={skill} className="skill-logo" /> : <span className="skill-emoji">{icon}</span>) : <span className="skill-emoji">⚡</span>}
                    </div>
                    <div className="skill-info">
                      <div className="skill-name-row">
                        <span className="skill-name-text">{skill}</span>
                      </div>
                      <span className="skill-domain-label">{domain}</span>
                    </div>
                  </div>
                  <div className="skill-xp-section">
                    <div className="skill-xp-bar">
                      <div className="skill-xp-fill" style={{ width: xpWidth, background: `linear-gradient(90deg, ${info.color || '#8b5cf6'}, ${info.color || '#8b5cf6'}88)` }}></div>
                    </div>
                    <span className="skill-xp-text">{xp} XP</span>
                  </div>
                </div>
              )
            })}
          </div>

          {editingSection === 'skills' && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                style={{ flex: 1, padding: '0.6rem 1rem', background: '#1e1e1e', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '16px', color: 'white' }}
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                placeholder="Type a skill..."
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag('skills', newTagInput) } }}
              />
              <button onClick={() => addTag('skills', newTagInput)} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '10px', cursor: 'pointer' }}>Add</button>
            </div>
          )}



          <div className="want-to-learn-section">
            <div className="want-to-learn-header">
              <h4>
                <svg className="panel-icon" style={{ width: '1.2rem', height: '1.2rem', opacity: 0.8, marginRight: '0.3rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
                Skills I Want to Learn
              </h4>
              <button className="btn-add-want-skill" onClick={() => setEditingSection(editingSection === 'want_to_learn' ? null : 'want_to_learn')}>
                {editingSection === 'want_to_learn' ? 'Done' : <><Plus size={14} /> Add</>}
              </button>
            </div>

            {editingSection === 'want_to_learn' ? (
              <div className="want-to-learn-input" style={{ marginBottom: '1rem' }}>
                <TagsInput
                  items={wantToLearnList}
                  setItems={async (newItems) => {
                    if (!user) return;
                    if (portfolio) {
                      queryClient.setQueryData(['portfolio', user.id], { ...portfolio, want_to_learn: newItems });
                    }
                    await saveMutation.mutateAsync({
                      userId: user.id,
                      data: { want_to_learn: newItems }
                    })
                  }}
                  db={SKILLS_DOMAIN_DB}
                  placeholder="Search skills to learn (e.g. React, Python)..."
                />
              </div>
            ) : (
              <div className="want-to-learn-tags">
                {wantToLearnList.length === 0 ? (
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>Add skills you want to learn to show your growth mindset</span>
                ) : (
                  wantToLearnList.map((s: string) => {
                    const icon = getSkillIcon(s)
                    const isUrl = icon?.startsWith('http')
                    return (
                      <span key={s} className="want-skill-tag" style={{ position: 'relative' }}>
                        {icon ? (isUrl ? <img src={icon} style={{ width: 14, height: 14, objectFit: 'contain' }} alt="" /> : <span>{icon}</span>) : <span>🎯</span>} {s}

                        {confirmSkill === s ? (
                          <div style={{ position: 'absolute', bottom: 'calc(100% + 5px)', left: '50%', transform: 'translateX(-50%)', background: 'rgba(20,20,30,0.95)', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '0.5rem', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 10, backdropFilter: 'blur(10px)', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '0.75rem', color: '#fff' }}>Mastered this?</span>
                            <button
                              style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.15rem 0.4rem', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                setConfirmSkill(null);
                                if (!user || !portfolio) return;
                                const newWant = wantToLearnList.filter((t: string) => t !== s);
                                const newSkills = [...((portfolio.skills as string[]) || [])];
                                if (!newSkills.includes(s)) newSkills.push(s);
                                queryClient.setQueryData(['portfolio', user.id], {
                                  ...portfolio, want_to_learn: newWant, skills: newSkills
                                });
                                await saveMutation.mutateAsync({
                                  userId: user.id, data: { want_to_learn: newWant, skills: newSkills }
                                });
                              }}
                            >Yes</button>
                            <button
                              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.15rem 0.4rem', fontSize: '0.7rem', cursor: 'pointer' }}
                              onClick={(e) => { e.stopPropagation(); setConfirmSkill(null); }}
                            >No</button>
                          </div>
                        ) : (
                          <button
                            title="Mark as Learned"
                            style={{
                              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981',
                              borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center',
                              justifyContent: 'center', marginLeft: '6px', cursor: 'pointer', fontSize: '10px', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.4)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.15)'}
                            onClick={(e) => { e.stopPropagation(); setConfirmSkill(s); }}
                          >
                            ✓
                          </button>
                        )}
                      </span>
                    )
                  })
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <button
              className={`ai-suggest-btn ${isReassessing ? 'loading' : ''} ${reassessStatus?.includes('✅') ? 'ai-success' : reassessStatus?.includes('❌') ? 'ai-error' : ''}`}
              onClick={handleReassess}
              disabled={isReassessing}
              style={{ color: 'white' }}
            >
              {isReassessing ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', width: 16, height: 16 }}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
              )}
              {reassessStatus || 'AI Re-assess Skill Levels'}
            </button>
          </div>

        </>) : (<>
          {/* EXTRACURRICULAR (flipped view) */}
          <div className="extracurricular-section">
            <h3><svg className="panel-icon" style={{ width: '1.2rem', height: '1.2rem', opacity: 0.8, marginRight: '0.3rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.636h1.841C20.627 16.426 22 14.346 22 12c0-5.5-4.5-10-10-10z" /></svg>Hobbies</h3>
            <div>
              {hobbiesList.length === 0 ? <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>No hobbies added yet</span> : hobbiesList.map((h: string) => (
                <span key={h} className="extra-tag">{getHobbyIcon(h)} {h}</span>
              ))}
            </div>
          </div>

          <div className="extracurricular-section">
            <h3><svg className="panel-icon" style={{ width: '1.2rem', height: '1.2rem', opacity: 0.8, marginRight: '0.3rem', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1.45.62 2.84 1.5 3.5.76.76 1.23 1.52 1.41 2.5" /><path d="M12 2v2" /><path d="M12 18v4" /></svg>Interests</h3>
            <div>
              {interestsList.length === 0 ? <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>No interests added yet</span> : interestsList.map((i: string) => (
                <span key={i} className="extra-tag">{getInterestIcon(i)} {i}</span>
              ))}
            </div>
          </div>
        </>)}

        <div className="panel-divider"></div>

        {/* AI CHAT */}
        <div className="ai-response-panel show">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}><Bot size={18} /> PLUTO AI</h4>
            <button className="ai-suggest-btn" onClick={() => {
              if (aiChatInput.trim()) {
                const q = aiChatInput.trim()
                setAiChatInput('')
                handleGetInsights(q)
              } else {
                handleGetInsights()
              }
            }} disabled={isGettingInsights} style={{ whiteSpace: 'nowrap', flexShrink: 0, color: 'white' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={isGettingInsights ? { animation: 'spin 1s linear infinite', width: '1rem', height: '1rem', verticalAlign: 'middle', marginRight: '0.4rem' } : { width: '1rem', height: '1rem', verticalAlign: 'middle', marginRight: '0.4rem' }}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
              {isGettingInsights ? 'Analyzing...' : 'Get AI Insights'}
            </button>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {aiChatHistory.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '1.5rem 1rem', color: 'rgba(255,255,255,0.35)',
                fontSize: '0.88rem', lineHeight: '1.7',
              }}>
                <Bot size={40} strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 0.75rem auto', color: '#a78bfa', opacity: 0.8 }} />
                Hey there! I'm your personal AI assistant.<br />
                Ask me anything — career advice, study doubts, project ideas, or just chat!
              </div>
            ) : (
              <>
                {aiChatHistory.map((msg, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: '0.6rem',
                  }}>
                    <div style={{
                      maxWidth: '85%',
                      padding: '0.6rem 1rem',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25))'
                        : 'rgba(255,255,255,0.06)',
                      border: msg.role === 'user'
                        ? '1px solid rgba(99,102,241,0.3)'
                        : '1px solid rgba(255,255,255,0.08)',
                      fontSize: '0.88rem',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      color: msg.role === 'user' ? '#c4b5fd' : '#e2e8f0',
                    }}>
                      {idx === aiChatHistory.length - 1 && msg.role === 'assistant'
                        ? <Typewriter text={msg.content} />
                        : msg.content
                      }
                    </div>
                  </div>
                ))}
              </>
            )}
            {isGettingInsights && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.6rem' }}>
                <div style={{
                  padding: '0.6rem 1rem', borderRadius: '16px 16px 16px 4px',
                  background: '#1e1e1e', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '0.88rem', color: 'rgba(255,255,255,0.4)',
                }}>
                  <span style={{ animation: 'pulse 1.5s infinite' }}>Thinking...</span>
                </div>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255,255,255,0.04)',
            padding: '0.35rem 0.4rem 0.35rem 1.25rem',
            borderRadius: '50px',
            border: 'none',
            marginTop: '1rem'
          }}>
            <input
              type="text"
              className="pf-ai-chat-input"
              value={aiChatInput}
              onChange={e => setAiChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !isGettingInsights) {
                  e.preventDefault()
                  if (aiChatInput.trim()) {
                    const q = aiChatInput.trim()
                    setAiChatInput('')
                    handleGetInsights(q)
                  } else {
                    handleGetInsights()
                  }
                }
              }}
              placeholder={isGettingInsights ? 'Analyzing your profile...' : 'Ask PLUTO AI about your growth'}
              disabled={isGettingInsights}
              style={{ background: 'transparent', border: 'none', color: 'var(--white)', width: '100%', outline: 'none', fontSize: '0.9rem', padding: '0.3rem 0', boxShadow: 'none' }}
            />
            <button
              disabled={isGettingInsights}
              onClick={() => {
                if (aiChatInput.trim()) {
                  const q = aiChatInput.trim()
                  setAiChatInput('')
                  handleGetInsights(q)
                } else {
                  handleGetInsights()
                }
              }}
              style={{
                width: 34, height: 34, minWidth: 34, borderRadius: '50%', border: 'none',
                background: aiChatInput.trim().length > 0 ? 'var(--white)' : 'rgba(255,255,255,0.1)',
                color: aiChatInput.trim().length > 0 ? '#000' : 'rgba(255,255,255,0.4)',
                cursor: isGettingInsights ? 'not-allowed' : 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'all 0.3s',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}>
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* EVENT SUMMARY MODAL */}
      <AnimatePresence>
        {ejModalIdx !== -1 && (
          <div className="ej-summary-overlay show" onClick={(e) => { if (e.target === e.currentTarget) closeAndSaveEjModal() }}>
            <motion.div
              className="ej-summary-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="ej-modal-header">
                <div className="ej-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {ejModalResult ? <BookOpen size={18} /> : <FileText size={18} />}
                  {ejModalResult ? 'Event Summary' : 'Add Summary'}
                </div>
                <button className="ej-modal-close" onClick={closeAndSaveEjModal}>&times;</button>
              </div>
              <div className="ej-modal-event-name">{((portfolio?.events_attended as any[]) || [])[ejModalIdx]?.title || 'Event'}</div>
              <textarea
                className="ej-modal-textarea"
                placeholder="What did you learn? What did you do? Any key takeaways..."
                value={ejSummary}
                onChange={e => setEjSummary(e.target.value)}
              />
              <div
                onClick={() => setEjIsWinner(!ejIsWinner)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '14px 18px',
                  cursor: 'pointer',
                  color: ejIsWinner ? 'var(--white)' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                  marginTop: '0.5rem'
                }}
              >
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  border: ejIsWinner ? 'none' : '2px solid rgba(255,255,255,0.2)',
                  background: ejIsWinner ? '#8b5cf6' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s'
                }}>
                  {ejIsWinner && <Check size={14} strokeWidth={3} color="white" />}
                </div>
                <Award size={18} color={ejIsWinner ? '#fbbf24' : 'currentColor'} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.95rem', fontWeight: ejIsWinner ? 500 : 400 }}>I won a prize or placement at this event</span>
              </div>

              <button className={`ej-modal-submit ${ejIsSubmitting ? 'loading' : ''}`} onClick={submitEjSummary} disabled={ejIsSubmitting}>
                {ejIsSubmitting ? (
                  <><Hourglass size={16} style={{ animation: 'pulse 1.5s infinite', marginRight: '6px' }} /> {ejSubmitLabel || 'Analyzing...'}</>
                ) : (
                  ejSubmitLabel ? ejSubmitLabel : (ejModalResult ? 'Re-analyze with AI' : 'Analyze with AI')
                )}
              </button>

              {ejModalResult && (
                <div className="ej-modal-result show" style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#fff' }}>
                    <Brain size={16} /> <strong>AI Insight:</strong>
                  </div>
                  {ejModalResult.insight}
                  {ejModalResult.pts > 0 && <><br /><br /><strong>Bonus Points Awarded:</strong> +{ejModalResult.pts}</>}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

function Typewriter({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    setDisplayed('')
    let i = 0
    const typing = setInterval(() => {
      setDisplayed(text.substring(0, i + 1))
      i++
      if (i >= text.length) clearInterval(typing)
    }, 20) // Speed matching legacy interval
    return () => clearInterval(typing)
  }, [text])

  return (
    <>
      {displayed}
      <span className="typewriter-cursor"></span>
    </>
  )
}

