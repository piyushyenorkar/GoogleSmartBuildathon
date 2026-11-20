import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  GraduationCap, Search, Building2, Globe, Mail, X, Code2, Link, Trophy, Sparkles, Briefcase, ExternalLink, ChevronDown, Code
} from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/authStore'
import { useAllStudents, usePortfolio, useMyProjects, type Project } from '@/hooks/usePortfolio'
import { getInitials } from '@/lib/utils'
import './StudentProfile.css'
import '../pages/Portfolio.css'
import InstitutionCapImg from '@/assets/Institutioncap.png'
import { INDIAN_STATES_CITIES } from '@/lib/constants'

type TabFilter = 'my-college' | 'all'

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
    'Go': 'go/go-original.svg',
    'Rust': 'rust/rust-plain.svg',
    'C++': 'cplusplus/cplusplus-original.svg',
    'C#': 'csharp/csharp-original.svg',
    'Ruby': 'ruby/ruby-original.svg',
    'PHP': 'php/php-original.svg',
    'Laravel': 'laravel/laravel-plain.svg',
    'PostgreSQL': 'postgresql/postgresql-original.svg',
    'MongoDB': 'mongodb/mongodb-original.svg',
    'MySQL': 'mysql/mysql-original.svg',
    'Redis': 'redis/redis-original.svg',
    'Docker': 'docker/docker-original.svg',
    'Kubernetes': 'kubernetes/kubernetes-plain.svg',
    'AWS': 'amazonwebservices/amazonwebservices-original-wordmark.svg',
    'GCP': 'googlecloud/googlecloud-original.svg',
    'Azure': 'azure/azure-original.svg',
    'Firebase': 'firebase/firebase-plain.svg',
    'Supabase': 'supabase/supabase-original.svg',
    'Tailwind': 'tailwindcss/tailwindcss-original.svg',
    'Figma': 'figma/figma-original.svg'
  };
  const path = map[name] || map[name.toLowerCase()];
  return path ? `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${path}` : null;
}

export default function StudentProfile() {
  const { id: viewUserId } = useParams()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [tabFilter, setTabFilter] = useState<TabFilter>('my-college')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(viewUserId || null)
  const [stateFilter, setStateFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')

  const { data: students = [], isLoading } = useAllStudents()

  // Check if current user has a portfolio
  const { data: myPortfolio, isLoading: portfolioLoading } = usePortfolio(user?.id)

  // Get portfolio and projects for selected student
  const activeStudentId = selectedStudentId || user?.id
  const { data: studentPortfolio } = usePortfolio(activeStudentId)
  const { data: studentProjects = [] } = useMyProjects(activeStudentId)

  const selectedStudent = useMemo(() => {
    if (selectedStudentId) return students.find(s => s.id === selectedStudentId)
    return null
  }, [selectedStudentId, students])

  const uniqueDepartments = useMemo(() => {
    const depts = students.map(s => s.department).filter(Boolean) as string[]
    return Array.from(new Set(depts)).sort()
  }, [students])

  const uniqueStates = Object.keys(INDIAN_STATES_CITIES)

  const filteredStudents = useMemo(() => {
    let list = students

    // Tab filter
    if (tabFilter === 'my-college' && user?.college_id) {
      list = list.filter(s => s.college_id === user.college_id)
    }

    // Department filter
    if (departmentFilter) {
      list = list.filter(s => s.department === departmentFilter)
    }

    // State filter
    if (stateFilter) {
      list = list.filter((s: any) => s.state === stateFilter)
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.college?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
      )
    }

    // Sort by score descending
    list.sort((a, b) => (b.score || 0) - (a.score || 0))

    return list
  }, [students, tabFilter, searchQuery, user, departmentFilter, stateFilter])

  const publicProjects = studentProjects.filter((p: Project) => p.visibility === 'public')

  if (!user) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
        <GraduationCap size={64} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.6 }} />
        <h2 style={{ marginTop: '1rem', color: 'var(--white)' }}>Login Required</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Sign in to explore student profiles.</p>
      </div>
    )
  }

  // Portfolio gate - require portfolio before accessing student profiles
  if (!portfolioLoading && !myPortfolio) {
    return (
      <>
        <Helmet><title>Students | PLUTO</title></Helmet>
        <div className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="portfolio-gate">
            <div className="portfolio-gate-icon" style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.6)', isolation: 'isolate', position: 'relative', zIndex: 10 }}>
              <img src={InstitutionCapImg} alt="Portfolio" style={{ width: '32px', height: '32px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            </div>
            <h2>Create Your Portfolio First</h2>
            <p>You need to set up your PLUTO portfolio before you can explore and connect with other students.</p>
            <a href="/portfolio" className="btn btn-primary">
              <svg width="15" height="15" viewBox="0 0 28 28">
                <path d="M14 0C14 7.73 20.27 14 28 14C20.27 14 14 20.27 14 28C14 20.27 7.73 14 0 14C7.73 14 14 7.73 14 0Z" fill="white" />
              </svg>
              Create Portfolio
            </a>
          </div>
        </div>

        {/* Premium Running Marquee Strip */}
        <div className="sp-gate-marquee-wrapper">
          <div className="sp-gate-marquee-content">
            {/* Repeated twice for seamless loop */}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="sp-gate-marquee-group">
                <div className="sp-gate-marquee-item">
                  <Sparkles size={16} /> <span>Discover Peers</span>
                </div>
                <div className="sp-gate-marquee-item">
                  <Globe size={16} /> <span>Build Your Network</span>
                </div>
                <div className="sp-gate-marquee-item">
                  <Building2 size={16} /> <span>Find Collaborators</span>
                </div>
                <div className="sp-gate-marquee-item">
                  <Trophy size={16} /> <span>Showcase Skills</span>
                </div>
                <div className="sp-gate-marquee-item">
                  <Briefcase size={16} /> <span>Unlock Opportunities</span>
                </div>
                <div className="sp-gate-marquee-item">
                  <Code2 size={16} /> <span>Join Projects</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet><title>Students | PLUTO</title></Helmet>

      <div className="container sp-container">

        {/* Top Controls */}
        <div className="sp-top-bar">
          <div className="sp-top-left">
            <div className="sp-tabs-wrap">
              <button className={`sp-tab ${tabFilter === 'my-college' ? 'active' : ''}`} onClick={() => setTabFilter('my-college')}>
                <Building2 size={16} /> My College
              </button>
              <button className={`sp-tab ${tabFilter === 'all' ? 'active' : ''}`} onClick={() => setTabFilter('all')}>
                <Globe size={16} /> All Colleges
              </button>
            </div>
          </div>

          <div className="sp-top-right">
            <div className="sp-search-bar">
              <Search size={18} className="sp-search-icon" />
              <input
                type="text"
                placeholder="Search by name, skill, college"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button className="btn-primary sp-search-btn">
                Search
              </button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className={`sp-filter-select ${stateFilter ? 'active-filter' : ''}`}>
                {stateFilter || 'All States'}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStateFilter('')}>All States</DropdownMenuItem>
                {uniqueStates.map(st => (
                  <DropdownMenuItem key={st} onClick={() => setStateFilter(st)}>{st}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className={`sp-filter-select ${departmentFilter ? 'active-filter' : ''}`}>
                {departmentFilter || 'All Departments'}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setDepartmentFilter('')}>All Departments</DropdownMenuItem>
                {uniqueDepartments.map(dept => (
                  <DropdownMenuItem key={dept} onClick={() => setDepartmentFilter(dept)}>{dept}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Modal Backdrop */}
        <div className={`sp-mobile-backdrop ${selectedStudent ? 'show' : ''}`} onClick={() => setSelectedStudentId(null)}></div>

        {/* Split Layout */}
        <div className={`sp-layout ${selectedStudent ? 'panel-open' : ''}`}>

          {/* LEFT: Student List */}
          <div className="sp-directory">
            <div className="sp-student-list">
              {isLoading ? (
                [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="sp-row sp-skeleton-row">
                    <div className="sp-skeleton-left">
                      <div className="sp-skeleton-avatar" />
                      <div className="sp-skeleton-info">
                        <div className="sp-skeleton-line" />
                        <div className="sp-skeleton-line short" />
                      </div>
                    </div>
                    <div className="sp-skeleton-right">
                      <div className="sp-skeleton-college" />
                      <div className="sp-skeleton-score" />
                    </div>
                  </div>
                ))
              ) : filteredStudents.length === 0 ? (
                <div className="sp-no-results">
                  <Sparkles size={32} opacity={0.5} />
                  <p>No students found</p>
                </div>
              ) : (
                filteredStudents.map((student, idx) => (
                  <div
                    key={student.id}
                    className={`sp-row ${selectedStudentId === student.id ? 'active' : ''}`}
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    <div className="sp-row-left">
                      <div className="sp-row-avatar">
                        {student.avatar_url ? <img src={student.avatar_url} alt={student.name} /> : getInitials(student.name)}
                      </div>
                      <div className="sp-row-info">
                        <div className="sp-row-name">
                          {student.name}
                          {student.id === user.id && <span className="sp-badge-you">YOU</span>}
                        </div>
                        <div className="sp-row-dept">{student.department || 'Student'}</div>
                      </div>
                    </div>
                    
                    <div className="sp-row-middle" style={{ flex: 1, padding: '0 1rem', display: 'flex', alignItems: 'center' }}>
                      {student.bio ? (
                        <div className="sp-row-bio" style={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '0.85rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.4'
                        }}>
                          {student.bio}
                        </div>
                      ) : (
                        <div className="sp-row-bio" style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                          No bio provided
                        </div>
                      )}
                    </div>

                    <div className="sp-row-right">
                      <div className="sp-row-college" title={student.college || student.email}>{student.college || student.email}</div>
                      {idx < 3 && student.score > 0 && (
                        <div className={`sp-css-trophy rank-${idx + 1}`}>
                          <div className="cup-bowl">
                            <div className="cup-inside"></div>
                            <div className="cup-number">{idx + 1}</div>
                          </div>
                          <div className="cup-handle left"></div>
                          <div className="cup-handle right"></div>
                          <div className="cup-stem"></div>
                          <div className="cup-base"></div>
                        </div>
                      )}
                      <div className="sp-row-score">
                        <span className="score-val">{student.score || 0}</span>
                        <span className="score-lbl">SCORE</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Profile Details */}
          {selectedStudent && (
            <div className="sp-profile-panel">
              <button className="sp-panel-close" onClick={() => setSelectedStudentId(null)}>
                <X size={20} />
              </button>

              <div className="sp-panel-scroll-content">
                <div className="sp-panel-header">
                  <div className="sp-identity-group" key={selectedStudent.id}>
                    <div className="sp-panel-avatar">
                      {selectedStudent.avatar_url ? (
                        <img src={selectedStudent.avatar_url} alt={selectedStudent.name} />
                      ) : (
                        <span>{getInitials(selectedStudent.name)}</span>
                      )}
                    </div>
                    <div className="sp-name-container">
                      <h2>{selectedStudent.name}</h2>
                    </div>
                  </div>
                  <div className="sp-panel-meta">
                    {selectedStudent.college && <span><Building2 size={14} /> {selectedStudent.college}</span>}
                    {selectedStudent.department && <span><GraduationCap size={14} /> {selectedStudent.department}</span>}
                    {selectedStudent.bio && <p className="sp-bio-text">{selectedStudent.bio}</p>}
                    {selectedStudent.socials?.portfolio && (
                      <a href={selectedStudent.socials.portfolio} target="_blank" rel="noreferrer" className="sp-portfolio-main-btn">
                        VIEW PORTFOLIO <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>

                <div className="sp-panel-section">
                  <h3>SOCIAL & CONNECTION LINKS</h3>
                  <div className="sp-social-links">
                    <a href={`mailto:${selectedStudent.email}`} className="sp-social-btn">
                      <img src="/icons/gmail.svg" alt="Email" className="sp-social-icon-img" /> Email
                    </a>
                    {selectedStudent.socials?.github && (
                      <a href={selectedStudent.socials.github} target="_blank" rel="noreferrer" className="sp-social-btn">
                        <svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor" className="sp-social-icon-img">
                          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                        </svg>
                        GitHub
                      </a>
                    )}
                    {selectedStudent.socials?.linkedin && (
                      <a href={selectedStudent.socials.linkedin} target="_blank" rel="noreferrer" className="sp-social-btn">
                        <img src="/icons/linkedin.png" alt="LinkedIn" className="sp-social-icon-img" />
                        LinkedIn
                      </a>
                    )}
                    {selectedStudent.socials?.twitter && (
                      <a href={selectedStudent.socials.twitter} target="_blank" rel="noreferrer" className="sp-social-btn">
                        <img src="/icons/Twitter.png" alt="Twitter" className="sp-social-icon-img" />
                        Twitter
                      </a>
                    )}
                    {selectedStudent.socials?.instagram && (
                      <a href={selectedStudent.socials.instagram} target="_blank" rel="noreferrer" className="sp-social-btn">
                        <img src="/icons/Instagram.webp" alt="Instagram" className="sp-social-icon-img" />
                        Instagram
                      </a>
                    )}
                  </div>
                </div>

                <div className="sp-panel-section">
                  <h3><Briefcase size={14} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} /> RECENT WORKS</h3>
                  {publicProjects.length > 0 ? (
                    <div className="sp-works-list">
                      {publicProjects.map((p: Project) => (
                        <div key={p.id} className="sp-work-card">
                          <h4>{p.name}</h4>
                          <p>{p.description}</p>

                          {p.tech_stack && p.tech_stack.length > 0 && (
                            <div className="sp-work-tech">
                              {p.tech_stack.slice(0, 3).map((t: string) => (
                                <span key={t}>
                                  {getTechIcon(t) ? (
                                    <img src={getTechIcon(t)!} alt={t} style={{ width: 12, height: 12, marginRight: 2 }} />
                                  ) : (
                                    <Code size={12} color="#a1a1aa" style={{ marginRight: 2 }} />
                                  )}
                                  {t}
                                </span>
                              ))}
                              {p.tech_stack.length > 3 && (
                                <span>+{p.tech_stack.length - 3}</span>
                              )}
                            </div>
                          )}

                          <div className="sp-work-footer">
                            {(p.github || p.deployed) ? (
                              <div className="sp-work-links">
                                {p.github && (
                                  <a href={p.github} target="_blank" rel="noreferrer" title="GitHub Repository">
                                    <svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor">
                                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                                    </svg> GitHub
                                  </a>
                                )}
                                {p.deployed && (
                                  <a href={p.deployed} target="_blank" rel="noreferrer" title="Live Preview">
                                    <ExternalLink size={14} /> Preview
                                  </a>
                                )}
                              </div>
                            ) : <div></div>}

                            {(p.owner_avatar || (p.collaborators && p.collaborators.length > 0)) && (
                              <div className="sp-collab-avatars">
                                {p.owner_avatar && (
                                  <img
                                    src={p.owner_avatar}
                                    alt={p.owner_name}
                                    title={`Owner: ${p.owner_name}`}
                                    className="sp-collab-avatar"
                                  />
                                )}
                                {(p.collaborators || [])
                                  .filter((c: any) => c.user_id !== p.user_id)
                                  .map((c: any) => (
                                    <img
                                      key={c.user_id}
                                      src={c.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'}
                                      alt={c.name}
                                      title={c.name}
                                      className="sp-collab-avatar"
                                    />
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="sp-no-works">No public projects yet.</p>
                  )}
                </div>

              </div> {/* End of sp-panel-scroll-content */}

            </div>
          )}
        </div>

      </div>
    </>
  )
}
