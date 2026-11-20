import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderKanban, Globe, Lock, Plus, Code2, ExternalLink,
  Trash2, Edit, Search, X, GitBranch, Sparkles, Building2, Trophy, Briefcase, UserPlus, Users, Image as ImageIcon, XCircle, ChevronLeft, ChevronRight,
  Folder, Edit3, User, Video, Camera, LockKeyhole, Rocket, Check
} from 'lucide-react'

const GithubIcon = ({ size = 24, color = "currentColor" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);
import { useAuthStore } from '@/stores/authStore'
import {
  useMyProjects, usePublicProjects, useSaveProject, useDeleteProject,
  usePortfolio, useSearchUsers,
  type Project, type Collaborator
} from '@/hooks/usePortfolio'
import { Footer } from '@/components/layout/Footer'
import './MyProjects.css'
import './Portfolio.css'

type Tab = 'browse' | 'mine'

// Module-level constant — avoids re-creation on every render
const QUOTES = [
  "Explore amazing projects...",
  "Take inspiration from others...",
  "Showcase your best work...",
  "Collaborate & build the future..."
]

const TECH_OPTIONS = [
  'React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'TypeScript', 'JavaScript',
  'Python', 'Django', 'Flask', 'FastAPI', 'Node.js', 'Express',
  'Java', 'Spring', 'Kotlin', 'Swift', 'Flutter', 'React Native',
  'Go', 'Rust', 'C++', 'C#', '.NET',
  'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Firebase', 'Supabase',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes',
  'TensorFlow', 'PyTorch', 'OpenCV', 'OpenAI', 'LangChain',
  'Figma', 'Tailwind CSS', 'Bootstrap', 'Sass', 'HTML', 'CSS',
  'Three.js', 'WebGL', 'Unity', 'Blender'
]

function getTechIcon(name: string) {
  const map: Record<string, string> = {
    'React': 'react/react-original.svg',
    'Next.js': 'nextjs/nextjs-original.svg',
    'Vue': 'vuejs/vuejs-original.svg',
    'Angular': 'angularjs/angularjs-original.svg',
    'Svelte': 'svelte/svelte-original.svg',
    'TypeScript': 'typescript/typescript-original.svg',
    'JavaScript': 'javascript/javascript-original.svg',
    'Python': 'python/python-original.svg',
    'Django': 'django/django-plain.svg',
    'Flask': 'flask/flask-original.svg',
    'FastAPI': 'fastapi/fastapi-original.svg',
    'Node.js': 'nodejs/nodejs-original.svg',
    'Express': 'express/express-original.svg',
    'Java': 'java/java-original.svg',
    'Spring': 'spring/spring-original.svg',
    'Kotlin': 'kotlin/kotlin-original.svg',
    'Swift': 'swift/swift-original.svg',
    'Flutter': 'flutter/flutter-original.svg',
    'React Native': 'react/react-original.svg',
    'Go': 'go/go-original.svg',
    'Rust': 'rust/rust-plain.svg',
    'C++': 'cplusplus/cplusplus-original.svg',
    'C#': 'csharp/csharp-original.svg',
    '.NET': 'dot-net/dot-net-original.svg',
    'PostgreSQL': 'postgresql/postgresql-original.svg',
    'MongoDB': 'mongodb/mongodb-original.svg',
    'MySQL': 'mysql/mysql-original.svg',
    'Redis': 'redis/redis-original.svg',
    'Firebase': 'firebase/firebase-plain.svg',
    'Supabase': 'supabase/supabase-original.svg',
    'AWS': 'amazonwebservices/amazonwebservices-original-wordmark.svg',
    'GCP': 'googlecloud/googlecloud-original.svg',
    'Azure': 'azure/azure-original.svg',
    'Docker': 'docker/docker-original.svg',
    'Kubernetes': 'kubernetes/kubernetes-plain.svg',
    'TensorFlow': 'tensorflow/tensorflow-original.svg',
    'PyTorch': 'pytorch/pytorch-original.svg',
    'OpenCV': 'opencv/opencv-original.svg',
    'Figma': 'figma/figma-original.svg',
    'Tailwind CSS': 'tailwindcss/tailwindcss-original.svg',
    'Bootstrap': 'bootstrap/bootstrap-original.svg',
    'Sass': 'sass/sass-original.svg',
    'HTML': 'html5/html5-original.svg',
    'CSS': 'css3/css3-original.svg',
    'Three.js': 'threejs/threejs-original.svg',
    'Unity': 'unity/unity-original.svg',
    'Blender': 'blender/blender-original.svg',
  }
  const match = map[name] || map[name.replace(' ', '')]
  return match ? `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${match}` : null
}

const isVideoMedia = (m: any) => {
  if (typeof m === 'object' && m.type === 'video') return true;
  if (typeof m === 'string' && m.match(/\.(mp4|webm|ogg|mov)($|\?)/i)) return true;
  if (typeof m === 'string' && m.startsWith('data:video')) return true;
  return false;
}

const getMediaSrc = (m: any) => {
  if (typeof m === 'object' && m.dataUrl) return m.dataUrl;
  return m;
}

const CarouselCard = ({ children, index, onClick }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const container = card.parentElement; // The mp-carousel-container
    if (!container) return;

    let ticking = false;

    const updateTransform = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;

      const distance = cardCenter - containerCenter;

      const maxDistance = container.clientWidth;
      const ratio = Math.max(-1, Math.min(1, distance / maxDistance));

      // Keep all cards at the exact same width, but slightly shrink the height of the middle card
      // using scaleY so it perfectly aligns with the edges without affecting gaps at all!
      const scaleY = 0.84 + Math.abs(ratio) * 0.16;
      const translateZ = 0;

      // Keep a very subtle 3D tilt
      const rotateY = ratio * -15;

      // Slight adjustment to keep gaps visually tight when rotated
      const translateX = ratio * -10;

      card.style.transform = `perspective(1000px) translateX(${translateX}px) rotateY(${rotateY}deg) scaleY(${scaleY}) translateZ(${translateZ}px)`;
      card.style.opacity = `${1 - Math.abs(ratio) * 0.15}`;

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateTransform);
        ticking = true;
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    setTimeout(updateTransform, 50);

    return () => {
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="mp-card mp-carousel-card"
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default function MyProjects() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Detail Modal State
  const [detailProject, setDetailProject] = useState<Project | null>(null)

  // Form state
  const [editId, setEditId] = useState<string | null>(null)
  const [projName, setProjName] = useState('')
  const [projDesc, setProjDesc] = useState('')

  // Typewriter effect state
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [displayedQuote, setDisplayedQuote] = useState("")

  useEffect(() => {
    const currentText = QUOTES[quoteIdx];
    let charIndex = 0;
    setDisplayedQuote("");

    const typingInterval = setInterval(() => {
      if (charIndex <= currentText.length) {
        setDisplayedQuote(currentText.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [quoteIdx]);

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteIdx(prev => (prev + 1) % QUOTES.length)
    }, 5000)
    return () => clearInterval(quoteInterval)
  }, [])

  const [projTech, setProjTech] = useState<string[]>([])
  const [techInput, setTechInput] = useState('')
  const [projGithub, setProjGithub] = useState('')
  const [projDeployed, setProjDeployed] = useState('')
  const [projVisibility, setProjVisibility] = useState<'public' | 'personal'>('public')
  const [projMedia, setProjMedia] = useState<any[]>([])
  const [projCollabs, setProjCollabs] = useState<Collaborator[]>([])
  const [isCollab, setIsCollab] = useState(false)
  const [collabSearchInput, setCollabSearchInput] = useState('')
  const [collabSearchResults, setCollabSearchResults] = useState<any[]>([])
  const [showCollabSearch, setShowCollabSearch] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: myProjects = [], isLoading: myLoading } = useMyProjects(user?.id)
  const { data: publicProjects = [], isLoading: publicLoading } = usePublicProjects()
  const saveProject = useSaveProject()
  const deleteProject = useDeleteProject()
  const { filterUsers } = useSearchUsers()

  const filteredPublic = useMemo(() => {
    if (!searchQuery.trim()) return publicProjects
    const q = searchQuery.toLowerCase()
    return publicProjects.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.tech_stack?.some(t => t.toLowerCase().includes(q)) ||
      p.owner_name?.toLowerCase().includes(q)
    )
  }, [publicProjects, searchQuery])

  const filteredMine = useMemo(() => {
    if (!searchQuery.trim()) return myProjects
    const q = searchQuery.toLowerCase()
    return myProjects.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.tech_stack?.some(t => t.toLowerCase().includes(q))
    )
  }, [myProjects, searchQuery])

  const currentList = activeTab === 'browse' ? filteredPublic : filteredMine
  const isDataLoading = activeTab === 'browse' ? publicLoading : myLoading

  const techSuggestions = useMemo(() => {
    if (!techInput) return []
    const q = techInput.toLowerCase()
    return TECH_OPTIONS.filter(t => t.toLowerCase().includes(q) && !projTech.includes(t)).slice(0, 6)
  }, [techInput, projTech])
  // Ref to always read the latest projCollabs inside async callbacks (fixes stale closure)
  const projCollabsRef = useRef<Collaborator[]>(projCollabs)
  projCollabsRef.current = projCollabs

  const handleCollabSearchChange = useCallback((value: string) => {
    setCollabSearchInput(value)

    if (value.trim().length < 1) {
      setCollabSearchResults([])
      return
    }

    // Pure client-side filter — instant, zero network calls
    const res = filterUsers(value)
    const currentCollabs = projCollabsRef.current
    const filtered = res.filter(u => u.id !== user?.id && !currentCollabs.some(c => c.user_id === u.id))
    if (filtered.length === 0 && res.length === 0) {
      setCollabSearchResults([{ id: 'empty', name: 'No users found', avatar_url: '', email: '' }])
    } else if (filtered.length === 0 && res.length > 0) {
      setCollabSearchResults([{ id: 'empty', name: 'All matching users already added', avatar_url: '', email: '' }])
    } else {
      setCollabSearchResults(filtered)
    }
  }, [filterUsers, user?.id])

  const resetForm = () => {
    setEditId(null)
    setProjName('')
    setProjDesc('')
    setProjTech([])
    setProjGithub('')
    setProjDeployed('')
    setProjVisibility('public')
    setProjMedia([])
    // Reset collabs to just the creator
    if (user) {
      setProjCollabs([{ user_id: user.id, name: user.name || user.email?.split('@')[0] || 'You', avatar_url: user.avatar_url || '' }])
    } else {
      setProjCollabs([])
    }
    setIsCollab(false)
    setShowCollabSearch(false)
    setCollabSearchInput('')
    setCollabSearchResults([])
    setShowForm(false)
  }

  const openEditForm = (p: Project) => {
    setEditId(p.id)
    setProjName(p.name)
    setProjDesc(p.description || '')
    setProjTech(p.tech_stack || [])
    setProjGithub(p.github || '')
    setProjDeployed(p.deployed || '')
    setProjVisibility(p.visibility || 'public')
    setProjMedia(p.media || [])
    // Reconstruct full collaborator list: owner + stored collaborators
    // DB only stores non-owner collabs (handleSubmit filters out the owner),
    // so we must prepend the owner back for the edit form to show correctly.
    const ownerCollab: Collaborator = {
      user_id: p.user_id,
      name: p.owner_name || user?.name || user?.email?.split('@')[0] || 'Owner',
      avatar_url: p.owner_avatar || user?.avatar_url || '',
    }
    const existingCollabs = p.collaborators || []
    // Avoid duplicating the owner if they're somehow already in the list
    const collabsWithoutOwner = existingCollabs.filter(c => c.user_id !== p.user_id)
    setProjCollabs([ownerCollab, ...collabsWithoutOwner])
    setIsCollab(collabsWithoutOwner.length > 0)
    setShowForm(true)
    setActiveTab('mine')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setProjMedia(prev => [...prev, {
          dataUrl: ev.target?.result,
          name: file.name,
          type: file.type.startsWith('video') ? 'video' : 'image'
        }])
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveMedia = (idx: number) => {
    setProjMedia(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Double-submit guard — if a save is already in flight, ignore
    if (!user || !projName.trim() || saveProject.isPending) return

    const collabs = projCollabs.filter(c => c.user_id !== user?.id)
    console.log('[SaveProject] Starting save...', { name: projName, collabs: collabs.length, mediaCount: projMedia.length })

    // Fire the mutation and wait for it to complete before closing the form
    saveProject.mutate({
      userId: user.id,
      project: {
        id: editId || undefined,
        name: projName,
        description: projDesc,
        tech_stack: projTech,
        github: projGithub,
        deployed: projDeployed,
        visibility: projVisibility,
        media: projMedia,
        collaborators: collabs,
      }
    }, {
      onSuccess: () => {
        console.log('[SaveProject] Successfully saved, closing form.')
        // Add a small 1-second delay so the user can clearly see the "Saving..." state completed
        setTimeout(() => {
          resetForm()
        }, 1000)
      },
      onError: (err: any) => {
        console.error('[SaveProject] FAILED:', err)
        alert('Failed to save project: ' + (err?.message || 'Unknown error'))
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project forever?')) return
    try {
      await deleteProject.mutateAsync(id)
    } catch (err: any) {
      console.error('[DeleteProject] FAILED:', err)
      alert('Failed to delete project: ' + (err?.message || 'Unknown error'))
    } finally {
      // Always close the detail modal if it was showing this project
      if (detailProject?.id === id) setDetailProject(null)
    }
  }

  const handleAddTech = (t: string) => {
    if (!projTech.includes(t)) {
      setProjTech([...projTech, t])
      setTechInput('')
    }
  }

  const handleAddCollab = (c: any) => {
    setProjCollabs([...projCollabs, { user_id: c.id, name: c.name, avatar_url: c.avatar_url }])
    setCollabSearchInput('')
    setCollabSearchResults([])
  }

  return (
    <div className="portfolio-layout">
      <Helmet>
        <title>Projects | PLUTO</title>
      </Helmet>

      <div className="portfolio-main" style={{ padding: 0 }}>
        <div className="mp-container">

          <div className="floatingTabsWrapper">
            <div className="floatingTabsInner">
              <button
                className={`floatingTab ${activeTab === 'browse' ? 'floatingTabActive' : ''}`}
                onClick={() => { setActiveTab('browse'); setShowForm(false); }}
              >
                <Globe size={18} color={activeTab === 'browse' ? '#000' : '#a1a1aa'} strokeWidth={activeTab === 'browse' ? 2 : 1.5} />
                {activeTab === 'browse' && <span className="floatingTabText">Browse</span>}
                {publicProjects.length > 0 && activeTab !== 'browse' && (
                  <div className="floatingBadge">
                    <span className="floatingBadgeText">{publicProjects.length}</span>
                  </div>
                )}
              </button>
              
              <button
                className={`floatingTab ${activeTab === 'mine' ? 'floatingTabActive' : ''}`}
                onClick={() => { setActiveTab('mine'); }}
              >
                <Briefcase size={18} color={activeTab === 'mine' ? '#000' : '#a1a1aa'} strokeWidth={activeTab === 'mine' ? 2 : 1.5} />
                {activeTab === 'mine' && <span className="floatingTabText">Mine</span>}
                {myProjects.length > 0 && activeTab !== 'mine' && (
                  <div className="floatingBadge">
                    <span className="floatingBadgeText">{myProjects.length}</span>
                  </div>
                )}
              </button>

              <button
                className="floatingTab"
                onClick={() => {
                  setActiveTab('mine');
                  resetForm();
                  // Pre-add creator as first collaborator
                  if (user) {
                    setProjCollabs([{ user_id: user.id, name: user.name || user.email?.split('@')[0] || 'You', avatar_url: user.avatar_url || '' }])
                  }
                  setShowForm(true);
                }}
              >
                <Plus size={18} color="#a1a1aa" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Typewriter Quotes */}
          <div className="mp-quote-container">
            <div className="mp-quote-text">
              {displayedQuote}
              <span className="mp-quote-cursor" />
            </div>
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.div
                className="mp-form-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={resetForm}
              >
                <motion.div
                  className="mp-form-modal"
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="mp-form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <h3>{editId ? <><Edit3 size={20} color="#f97316" /> Edit Project</> : <><Folder size={20} color="#eab308" /> New Project</>}</h3>

                      {projCollabs.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
                          {projCollabs.map((c, i) => (
                            <div key={i} title={c.user_id === user?.id ? c.name + ' (You - Owner)' : c.name + ' (Click to remove)'} onClick={() => { if (c.user_id !== user?.id) setProjCollabs(projCollabs.filter((_, idx) => idx !== i)); }} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', marginLeft: i > 0 ? '-10px' : '0', overflow: 'hidden', position: 'relative', cursor: c.user_id === user?.id ? 'default' : 'pointer', zIndex: 10 - i }}>
                              <img src={c.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + c.name} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))}
                        </div>
                      )}

                      {showCollabSearch ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                          <input
                            type="text"
                            className="mp-form-header-search-input"
                            autoFocus
                            value={collabSearchInput}
                            onChange={e => handleCollabSearchChange(e.target.value)}
                            placeholder="Search user" />
                          {collabSearchResults.length > 0 && (
                            <div className="tb-role-dropdown" style={{ display: 'block', animation: 'fadeIn 0.2s ease-out' }}>
                              {collabSearchResults.map(u => (
                                <div key={u.id} className="tb-role-option" onClick={() => {
                                  if (u.id !== 'empty' && u.id !== 'error') {
                                    handleAddCollab(u);
                                    setCollabSearchInput('');
                                  }
                                }}>
                                  {u.id !== 'empty' && u.id !== 'error' ? (
                                    <>
                                      <img src={u.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + u.name} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                                      {u.name}
                                    </>
                                  ) : (
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>{u.name}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <button type="button" onClick={() => { setShowCollabSearch(false); setCollabSearchInput(''); setCollabSearchResults([]); }} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', minWidth: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }} title="Done"><Check size={16} strokeWidth={3} /></button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setShowCollabSearch(true)} className="mp-collab-btn" style={{ marginLeft: projCollabs.length > 0 ? '0' : '0.5rem' }}>
                          <UserPlus size={14} /> Collab
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button type="button" className="mp-form-close" onClick={resetForm}><X size={20} /></button>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mp-form-body">
                    {/* 35% Media Column */}
                    <div className="mp-form-media-col">
                      <div className="mp-form-group mp-media-section" style={{ marginTop: 0 }}>
                        <label style={{ fontSize: '1rem', color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Camera size={18} color="#a78bfa" /> Media Gallery
                        </label>
                        <div className="mp-media-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          {projMedia.map((m, i) => (
                            <div key={i} className="mp-media-item" style={{ width: '100%', height: '120px', borderRadius: '20px' }}>
                              {isVideoMedia(m) ? (
                                <div className="mp-media-vid"><Video size={24} color="#ec4899" /></div>
                              ) : (
                                <img src={getMediaSrc(m)} alt="" />
                              )}
                              <button type="button" className="mp-media-remove" onClick={() => handleRemoveMedia(i)}><X size={12} /></button>
                            </div>
                          ))}
                          <button type="button" className="mp-media-add-btn" style={{ width: '100%', height: '120px', display: 'flex', flexDirection: 'column', gap: '8px', borderRadius: '20px', justifyContent: 'center' }} onClick={() => fileInputRef.current?.click()}>
                            <Plus size={24} /> <span>Add Media</span>
                          </button>
                          <input type="file" accept="image/*,video/*" multiple hidden ref={fileInputRef} onChange={handleMediaUpload} />
                        </div>
                      </div>
                    </div>

                    {/* 65% Content Column */}
                    <div className="mp-form-content-col">
                      <div className="mp-form-group">
                        <label>Visibility <span className="req">*</span></label>
                        <div className="mp-vis-toggle">
                          <button type="button" className={`mp-vis-btn ${projVisibility === 'public' ? 'active' : ''}`} onClick={() => setProjVisibility('public')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={16} color="#a78bfa" /> Public</span>
                            {projVisibility === 'public' && <Check size={16} color="#a78bfa" />}
                          </button>
                          <button type="button" className={`mp-vis-btn ${projVisibility === 'personal' ? 'active' : ''}`} onClick={() => setProjVisibility('personal')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><LockKeyhole size={16} color="#a78bfa" /> Personal</span>
                            {projVisibility === 'personal' && <Check size={16} color="#a78bfa" />}
                          </button>
                        </div>
                      </div>

                      <div className="mp-form-group">
                        <label>Project Name <span className="req">*</span></label>
                        <input type="text" value={projName} onChange={e => setProjName(e.target.value)} placeholder="My Awesome Project" required />
                      </div>

                      <div className="mp-form-group" style={{ marginBottom: '0.75rem' }}>
                        <label>Description</label>
                        <textarea value={projDesc} onChange={e => setProjDesc(e.target.value)} placeholder="What does this project do?" rows={3} />
                      </div>

                      <div className="mp-form-group">
                        <label>Tech Stack</label>
                        <div className="mp-tech-wrap">
                          <div className="mp-tech-chips">
                            {projTech.map(t => (
                              <span key={t} className="mp-tech-chip">
                                {getTechIcon(t) && <img src={getTechIcon(t)!} alt="" />} {t}
                                <button type="button" onClick={() => setProjTech(projTech.filter(x => x !== t))}><X size={14} /></button>
                              </span>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={techInput}
                            onChange={e => setTechInput(e.target.value)}
                            onKeyDown={e => {
                              if ((e.key === 'Enter' || e.key === ',') && techInput.trim()) {
                                e.preventDefault(); handleAddTech(techInput.trim());
                              }
                            }}
                            placeholder="Search (e.g. React, Python)"
                          />
                          {techSuggestions.length > 0 && (
                            <div className="tb-role-dropdown" style={{ display: 'block' }}>
                              {techSuggestions.map(t => (
                                <div key={t} className="tb-role-option" onClick={() => handleAddTech(t)}>
                                  {getTechIcon(t) && <img src={getTechIcon(t)!} alt="" />} {t}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mp-form-row">
                        <div className="mp-form-group">
                          <label><GithubIcon size={14} color="#ffffff" /> GitHub Link</label>
                          <input type="url" value={projGithub} onChange={e => setProjGithub(e.target.value)} placeholder="https://github.com/your-repo" />
                        </div>
                        <div className="mp-form-group">
                          <label><Globe size={14} color="#a78bfa" /> Deployed Link</label>
                          <input type="url" value={projDeployed} onChange={e => setProjDeployed(e.target.value)} placeholder="https://myapp.vercel.app" />
                        </div>
                      </div>



                      <div className="mp-form-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-modal btn-modal-ghost" onClick={resetForm}>Cancel</button>
                        <button type="submit" className="btn-modal btn-modal-primary" disabled={saveProject.isPending}>
                          {saveProject.isPending ? 'Saving...' : 'Save Project'}
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="mp-carousel-container"
            onWheel={(e) => {
              const container = e.currentTarget;
              if (Math.abs(e.deltaY) > 0) {
                e.preventDefault();
                container.scrollLeft += e.deltaY;
              }
            }}
          >
            {isDataLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="mp-card mp-skeleton-card" style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="mp-skel-media" />
                  <div className="mp-skel-body">
                    <div className="mp-skel-title" />
                    <div className="mp-skel-desc" />
                    <div className="mp-skel-desc short" />
                    <div className="mp-skel-tags">
                      <div className="mp-skel-tag" />
                      <div className="mp-skel-tag" />
                      <div className="mp-skel-tag" />
                    </div>
                    <div className="mp-skel-footer">
                      <div className="mp-skel-icon" />
                      <div className="mp-skel-icon" />
                      <div style={{ flex: 1 }} />
                      <div className="mp-skel-avatar" />
                      <div className="mp-skel-avatar" />
                    </div>
                  </div>
                </div>
              ))
            ) : currentList.length === 0 ? (
              <div className="mp-empty">
                <FolderKanban size={48} style={{ opacity: 0.2, margin: '0 auto' }} />
                <h3>No projects found</h3>
                <p>{activeTab === 'browse' ? 'Be the first to share a project!' : 'Click "+ New Project" to showcase your work.'}</p>
              </div>
            ) : (
              currentList.map((proj, index) => {
                const firstMedia = proj.media && proj.media.length > 0 ? proj.media[0] : null
                const mediaCount = proj.media?.length || 0

                return (
                  <CarouselCard
                    key={proj.id}
                    index={index}
                    onClick={() => setDetailProject(proj)}
                  >
                    {/* Media Background */}
                    <div className="mp-card-media">
                      {firstMedia ? (
                        isVideoMedia(firstMedia) ? (
                          <div className="mp-card-media-placeholder" style={{ background: 'rgba(99,102,241,0.15)' }}>🎬</div>
                        ) : (
                          <img src={getMediaSrc(firstMedia)} alt="" />
                        )
                      ) : (
                        <div className="mp-card-media-placeholder">🚀</div>
                      )}
                      {mediaCount > 1 && <span className="mp-media-count">+{mediaCount - 1}</span>}
                    </div>

                    {/* Top Badges & Actions */}
                    {activeTab === 'mine' && (
                      <>
                        <span className={`mp-vis-badge ${proj.visibility}`}>
                          {proj.visibility === 'public' ? <Globe size={12} color="#fff" /> : <Lock size={12} color="#fff" />} {proj.visibility}
                        </span>
                        {proj.user_id !== user?.id && (
                          <span className="mp-vis-badge collab" style={{ left: '5.5rem' }}>
                            <Users size={12} color="#fff" /> Collab
                          </span>
                        )}
                        <div className="mp-card-actions" onClick={e => e.stopPropagation()}>
                          <button className="mp-action-btn mp-edit" onClick={() => openEditForm(proj)}>
                            <Edit size={14} color="#fff" />
                          </button>
                          {proj.user_id === user?.id && (
                            <button className="mp-action-btn mp-delete" onClick={() => handleDelete(proj.id)}>
                              <Trash2 size={14} color="#ef4444" />
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    {/* Gradient Overlay for Mobile */}
                    <div className="mp-card-gradient"></div>

                    {/* Content Overlay at bottom */}
                    <div className="mp-card-body">
                      <div className="mp-card-header">
                        <div style={{ flex: 1, paddingRight: '10px' }}>
                          <h3 className="mp-card-title">{proj.name}</h3>
                          {activeTab === 'browse' && proj.owner_name && (
                            <span className="mp-card-owner">by {proj.owner_name}</span>
                          )}
                        </div>
                        
                        {/* Collaborators moved to header to match app */}
                        <div className="mp-collab-row">
                          {proj.collaborators && proj.collaborators.length > 0 ? (
                            <>
                              {proj.collaborators.slice(0, 3).map((c: Collaborator) => (
                                <img key={c.user_id} src={c.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + c.name} alt={c.name} className="mp-collab-avatar" title={c.name} />
                              ))}
                            </>
                          ) : (
                            !proj.owner_avatar && <span className="mp-solo-badge">👤 Solo</span>
                          )}
                          {proj.owner_avatar && (
                            <img src={proj.owner_avatar} alt="owner" className="mp-collab-avatar" title={proj.owner_name + ' (Owner)'} />
                          )}
                        </div>
                      </div>

                      <p className="mp-card-desc">{proj.description || 'No description provided.'}</p>

                      <div className="mp-card-footer">
                        {/* Tech stack moved to footer left */}
                        <div className="mp-card-tech">
                          {proj.tech_stack?.slice(0, 4).map((t: string) => (
                            <span key={t} className="mp-tech-tag">
                              {getTechIcon(t) && <img src={getTechIcon(t)!} alt="" />}
                            </span>
                          ))}
                          {proj.tech_stack && proj.tech_stack.length > 4 && (
                            <span className="mp-tech-tag mp-tech-more">+{proj.tech_stack.length - 4}</span>
                          )}
                        </div>

                        {/* Links moved to footer right */}
                        <div className="mp-footer-links">
                          {proj.github && (
                            <a href={proj.github} target="_blank" rel="noopener noreferrer" className="mp-icon-link" onClick={e => e.stopPropagation()} title="GitHub">
                              <GithubIcon size={16} />
                            </a>
                          )}
                          {proj.deployed && (
                            <a href={proj.deployed} target="_blank" rel="noopener noreferrer" className="mp-icon-link deployed" onClick={e => e.stopPropagation()} title="Live Demo">
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </CarouselCard>
                )
              })
            )}
          </div>
        </div>

        <AnimatePresence>
          {detailProject && (
            <motion.div
              className="mp-detail-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailProject(null)}
            >
              <motion.div
                className="mp-detail-card"
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
              >
                <button className="mp-detail-close" onClick={() => setDetailProject(null)}><X size={20} /></button>

                <h2 className="mp-detail-title">
                  {detailProject.name}
                  {detailProject.visibility === 'personal' && <Lock size={16} style={{ marginLeft: 8, color: 'var(--text-secondary)' }} />}
                </h2>

                {detailProject.owner_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <img src={detailProject.owner_avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + detailProject.owner_name} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>by <span style={{ color: 'var(--white)', fontWeight: 500 }}>{detailProject.owner_name}</span></span>
                  </div>
                )}

                {detailProject.media && detailProject.media.length > 0 && (
                  <div className="mp-detail-gallery">
                    {detailProject.media.map((m, i) => (
                      isVideoMedia(m) ? (
                        <video key={i} src={getMediaSrc(m)} controls />
                      ) : (
                        <img key={i} src={getMediaSrc(m)} alt="" />
                      )
                    ))}
                  </div>
                )}

                <div className="mp-detail-section-title">About</div>
                <div className="mp-detail-desc">{detailProject.description || 'No description provided.'}</div>

                {detailProject.tech_stack && detailProject.tech_stack.length > 0 && (
                  <>
                    <div className="mp-detail-section-title">Tech Stack</div>
                    <div className="mp-card-tech">
                      {detailProject.tech_stack.map(t => (
                        <span key={t} className="mp-tech-tag">
                          {getTechIcon(t) && <img src={getTechIcon(t)!} alt="" />} {t}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {detailProject.collaborators && detailProject.collaborators.length > 0 && (
                  <>
                    <div className="mp-detail-section-title">Team</div>
                    <div className="mp-detail-collabs">
                      {detailProject.collaborators.map(c => (
                        <div key={c.user_id} className="mp-detail-collab-item">
                          <img src={c.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + c.name} alt="" />
                          {c.name}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="mp-detail-actions">
                  {detailProject.github && (
                    <a href={detailProject.github} target="_blank" rel="noopener noreferrer" className="btn-modal btn-modal-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <GithubIcon size={16} /> GitHub Repo
                    </a>
                  )}
                  {detailProject.deployed && (
                    <a href={detailProject.deployed} target="_blank" rel="noopener noreferrer" className="btn-modal btn-modal-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Globe size={16} /> Visit Live Site
                    </a>
                  )}
                </div>

                {activeTab === 'mine' && detailProject.user_id === user?.id && (
                  <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '12px' }}>
                    <button className="btn-modal btn-modal-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => { setDetailProject(null); openEditForm(detailProject); }}>
                      <Edit size={14} /> Edit
                    </button>
                    <button className="btn-modal" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }} onClick={() => handleDelete(detailProject.id)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
