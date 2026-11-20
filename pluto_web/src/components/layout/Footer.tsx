import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LegalModal } from '../ui/LegalModal'
import { useAuthStore } from '../../stores/authStore'
import './Footer.css'

export function Footer() {
  const { user } = useAuthStore()
  const isPureOrganizer = user?.roles?.includes('organizer') && !user?.roles?.includes('user') && !user?.roles?.includes('student') && !user?.roles?.includes('admin') && !user?.roles?.includes('staff')
  const isStaff = user?.roles?.includes('staff')

  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | 'refund' | 'contact' | null>(null)
  return (
    <footer className="footer hide-mobile">
      <div className="container">
        <div className="footer-content">
          {/* Brand */}
          <div className="footer-section">
            <h3>PLUTO CAMPUS</h3>
            <p className="footer-tagline">
              Your campus event platform. Discover, create, and Collaborate across colleges.
            </p>
          </div>

          {/* Quick Links */}
          {(!isPureOrganizer && !isStaff) && (
            <div className="footer-section">
              <h3>Quick Links</h3>
              <ul>
                <li><Link to="/explore">Explore Events</Link></li>
                <li><Link to="/community">Community</Link></li>
                <li><Link to="/portfolio">Portfolio</Link></li>
                <li><Link to="/dashboard">My Applications</Link></li>
              </ul>
            </div>
          )}

          {/* Legal & Support */}
          <div className="footer-section">
            <h3>Legal & Support</h3>
            <ul>
              <li>
                <button className="footer-btn-link" onClick={() => setLegalModalType('terms')}>Terms & Conditions</button>
              </li>
              <li>
                <button className="footer-btn-link" onClick={() => setLegalModalType('privacy')}>Privacy Policy</button>
              </li>
              <li>
                <button className="footer-btn-link" onClick={() => setLegalModalType('refund')}>Refund Policy</button>
              </li>
              <li>
                <button className="footer-btn-link" onClick={() => setLegalModalType('contact')}>Contact Us</button>
              </li>
            </ul>
          </div>

          {/* Organizer */}
          <div className="footer-section">
            <h3>For Organizers</h3>
            <ul>
              <li><Link to="/create-event">Create Event</Link></li>
              <li><Link to="/organizer">Dashboard</Link></li>
              <li><Link to="/organizer/events">My Events</Link></li>
              <li><Link to="/organizer/bookings">Bookings</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} PLUTO CAMPUS. Built for campus communities.</p>
        </div>
      </div>

      <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
    </footer>
  )
}
