import { motion } from 'framer-motion'
import { Hammer } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
}

/**
 * Placeholder page used during migration for routes not yet built.
 * Will be replaced with real pages in subsequent chunks.
 */
export function PlaceholderPage({ title, subtitle, icon = <Hammer size={64} style={{ color: "var(--primary)" }} /> }: PlaceholderPageProps) {
  return (
    <motion.div
      className="container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: '1rem',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>{icon}</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--white)' }}>{title}</h1>
      {subtitle && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 400 }}>
          {subtitle}
        </p>
      )}
      <div
        className="badge badge-primary"
        style={{ marginTop: '1rem', fontSize: '0.85rem' }}
      >
        Coming in Chunk 2+
      </div>
    </motion.div>
  )
}
