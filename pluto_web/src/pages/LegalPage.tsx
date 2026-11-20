import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { FileText, ShieldCheck, RefreshCcw, Headset, Mail, MapPin, Clock, AlertCircle, CreditCard, Users, Shield, Trash2, Scale, BookOpen, Globe, Gavel, Lock, Eye, UserX, Layers, Info } from 'lucide-react'

import '@/components/ui/LegalModal.css'

export default function LegalPage() {
  const { policyType } = useParams<{ policyType: string }>()

  const getPageTitle = () => {
    switch (policyType) {
      case 'terms': return 'Terms & Conditions'
      case 'privacy': return 'Privacy Policy'
      case 'refund': return 'Refund & Cancellation Policy'
      case 'contact': return 'Contact Us'
      default: return 'Legal'
    }
  }

  const link = (text: string, href: string, isExternal = false) => (
    <a href={href} style={{ color: '#60a5fa', textDecoration: 'none' }} {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{text}</a>
  )

  const routerLink = (text: string, to: string) => (
    <Link to={to} style={{ color: '#60a5fa', textDecoration: 'none' }}>{text}</Link>
  )

  const getContent = () => {
    switch (policyType) {
      case 'terms':
        return (
          <>
            <div className="legal-header">
              <div className="legal-icon-wrap"><FileText size={32} color="#a78bfa" /></div>
              <h2>Terms &amp; Conditions</h2>
              <p className="legal-subtitle">Last Updated: 25 September 2026</p>
            </div>
            
            <div className="legal-body">
              <p className="legal-intro">
                Welcome to <strong>Pluto Campus</strong> ("Pluto", "we", "us", or "our"). These Terms &amp; Conditions ("Terms") govern your access to and use of the Pluto Campus platform, including our website at <strong>plutocampus.com</strong>, our mobile application, and all related services (collectively, the "Platform"). By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.
              </p>
              
              <div className="legal-section">
                <h3><Info size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> About Pluto Campus</h3>
                <p>Pluto Campus is a technology platform designed for the college and university ecosystem. We provide tools and services that enable:</p>
                <ul className="legal-list">
                  <li><strong>Event Discovery &amp; Ticketing:</strong> Browse, discover, and book tickets for campus events, fests, workshops, and more.</li>
                  <li><strong>Competition Hosting:</strong> Organise and participate in hackathons, coding competitions, case studies, ideathons, and other competitive events with individual or team-based registration.</li>
                  <li><strong>Team Building:</strong> Find teammates, form teams, and collaborate on projects and competitions.</li>
                  <li><strong>Student Portfolio:</strong> Build and showcase your academic and extracurricular portfolio.</li>
                  <li><strong>Community:</strong> Connect with peers, organizers, and institutions within a college network.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3><Users size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Eligibility &amp; Account Registration</h3>
                <p>To use the Platform, you must:</p>
                <ul className="legal-list">
                  <li>Be at least 16 years of age.</li>
                  <li>Be a current student, staff member, or authorized organizer affiliated with a recognized educational institution in India.</li>
                  <li>Create an account using Google OAuth (Sign in with Google) through our authentication provider, Supabase.</li>
                  <li>Complete the onboarding process by providing your college, course, department, and year of study (students) or relevant details (staff/organizers).</li>
                </ul>
                <p style={{ marginTop: '12px' }}>You are solely responsible for maintaining the confidentiality and security of your account credentials. All activities conducted under your account are your responsibility. You must notify us immediately at {link('campuspluto@gmail.com', 'mailto:campuspluto@gmail.com')} if you suspect unauthorized access to your account.</p>
              </div>

              <div className="legal-section">
                <h3><BookOpen size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Event Ticketing &amp; Bookings</h3>
                <p>Pluto Campus acts as an <strong>intermediary platform</strong> that facilitates ticket booking between users ("Attendees") and event creators ("Organizers"). By booking a ticket, you acknowledge and agree that:</p>
                <ul className="legal-list">
                  <li>The Organizer is solely responsible for the planning, execution, quality, safety, and delivery of the event.</li>
                  <li>Pluto Campus does not guarantee the occurrence, punctuality, or quality of any event listed on the Platform.</li>
                  <li>Ticket availability, pricing, and event details are set by the Organizer and may be subject to change.</li>
                  <li>Your name and email address will be shared with the Organizer for the purpose of event management, check-in, and communication.</li>
                  <li>Refund and cancellation policies as outlined in our {routerLink('Refund & Cancellation Policy', '/legal/refund')} apply to all bookings.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3><Layers size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Competition Registration</h3>
                <p>Pluto Campus enables organizers to host competitions (hackathons, coding contests, case studies, ideathons) and enables participants to register individually or as teams. By registering for a competition, you agree that:</p>
                <ul className="legal-list">
                  <li>A <strong>platform fee of 2.5%</strong> is applied on top of the entry fee (if applicable) to cover platform and payment processing costs.</li>
                  <li>Team registrations require all members to have valid Pluto Campus accounts.</li>
                  <li>The Organizer retains full authority over participant selection, judging criteria, prize distribution, and event rules.</li>
                  <li>Competition registrations are generally <strong>non-refundable</strong> unless the competition is cancelled by the Organizer.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3><CreditCard size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Payments &amp; Fees</h3>
                <p>All financial transactions on the Platform are processed securely through <strong>Razorpay</strong>, a PCI-DSS compliant payment gateway. We support UPI, credit/debit cards, net banking, and other methods available through Razorpay.</p>
                <ul className="legal-list">
                  <li>Pluto Campus does <strong>not</strong> store your card details, bank credentials, or sensitive payment information. All payment data is handled directly by Razorpay.</li>
                  <li>Ticket prices, entry fees, and any applicable taxes are displayed at the time of checkout.</li>
                  <li>All prices are listed in Indian Rupees (₹ INR).</li>
                  <li>By completing a payment, you authorize Razorpay to charge your selected payment method.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3><Scale size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Organizer Responsibilities</h3>
                <p>If you create, publish, or manage events or competitions on the Platform as an Organizer, you agree to:</p>
                <ul className="legal-list">
                  <li>Provide accurate, truthful, and complete event/competition details.</li>
                  <li>Honour all ticket purchases and registrations made through the Platform.</li>
                  <li>Comply with all applicable local, state, and national laws and regulations governing events.</li>
                  <li>Not engage in fraudulent, deceptive, or misleading practices.</li>
                  <li>Accept that Pluto Campus may remove or suspend events that violate these Terms or applicable law.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3><Shield size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> User Conduct &amp; Acceptable Use</h3>
                <p>While using the Platform, you agree <strong>not</strong> to:</p>
                <ul className="legal-list">
                  <li>Use the Platform for any unlawful, fraudulent, or malicious purpose.</li>
                  <li>Upload, post, or transmit any content that is abusive, defamatory, obscene, or otherwise objectionable.</li>
                  <li>Attempt to gain unauthorized access to other users' accounts or Platform systems.</li>
                  <li>Scrape, crawl, or use automated means to extract data from the Platform without written permission.</li>
                  <li>Interfere with or disrupt the Platform's infrastructure, security, or performance.</li>
                  <li>Create multiple accounts, impersonate another individual, or misrepresent your affiliation.</li>
                </ul>
                <p style={{ marginTop: '12px' }}>Violation of these rules may result in immediate account suspension or termination without notice.</p>
              </div>

              <div className="legal-section">
                <h3><Lock size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Intellectual Property</h3>
                <p>All content, designs, logos, trademarks, code, and materials on the Platform are the intellectual property of Pluto Campus or its licensors and are protected under applicable copyright and trademark laws. You may not reproduce, distribute, modify, or create derivative works without our express written consent.</p>
                <p style={{ marginTop: '12px' }}>Content you upload to the Platform (portfolio projects, profile information, team descriptions) remains your property. However, you grant Pluto Campus a non-exclusive, royalty-free license to display and distribute such content within the Platform for the purpose of providing our services.</p>
              </div>

              <div className="legal-section">
                <h3><Trash2 size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Account Deletion</h3>
                <p>You may request the deletion of your account and all associated personal data at any time through the <strong>Settings</strong> page or the {routerLink('Delete Account', '/delete-account')} page. Upon deletion:</p>
                <ul className="legal-list">
                  <li>Your profile, bookings, portfolio, and all personal data will be permanently removed from our systems.</li>
                  <li>Any active bookings or competition registrations will be forfeited without refund.</li>
                  <li>This action is <strong>irreversible</strong>.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3><AlertCircle size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Limitation of Liability</h3>
                <p>To the maximum extent permitted by applicable law:</p>
                <ul className="legal-list">
                  <li>Pluto Campus is provided on an <strong>"as is"</strong> and <strong>"as available"</strong> basis without warranties of any kind, express or implied.</li>
                  <li>We are not liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of the Platform.</li>
                  <li>We are not responsible for losses caused by event cancellations, no-shows, ticketing errors, or the conduct of Organizers or other users.</li>
                  <li>Our total liability to you for any claim shall not exceed the amount you paid to Pluto Campus in the twelve (12) months preceding the claim.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3><Shield size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Indemnification</h3>
                <p>You agree to indemnify, defend, and hold harmless Pluto Campus, its founders, employees, and affiliates from any claims, losses, damages, liabilities, or expenses (including legal fees) arising from your use of the Platform, violation of these Terms, or infringement of any third-party rights.</p>
              </div>

              <div className="legal-section">
                <h3><Gavel size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Governing Law &amp; Dispute Resolution</h3>
                <p>These Terms are governed by and construed in accordance with the laws of <strong>India</strong>. Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts located in <strong>Navi Mumbai, Maharashtra, India</strong>.</p>
              </div>

              <div className="legal-section">
                <h3><FileText size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Changes to These Terms</h3>
                <p>We reserve the right to modify these Terms at any time. Material changes will be communicated through the Platform or via email. Your continued use of the Platform after any changes constitutes your acceptance of the revised Terms.</p>
              </div>

              <div className="legal-section" style={{ border: '1px solid rgba(96, 165, 250, 0.2)', background: 'rgba(96, 165, 250, 0.05)' }}>
                <h3><Mail size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Contact</h3>
                <p>If you have any questions about these Terms, please contact us at {link('campuspluto@gmail.com', 'mailto:campuspluto@gmail.com')}.</p>
              </div>
            </div>
          </>
        )
      case 'privacy':
        return (
          <>
            <div className="legal-header">
              <div className="legal-icon-wrap"><ShieldCheck size={32} color="#10b981" /></div>
              <h2>Privacy Policy</h2>
              <p className="legal-subtitle">Last Updated: 25 September 2026</p>
            </div>

            <div className="legal-body">
              <p className="legal-intro">
                At <strong>Pluto Campus</strong> ("Pluto", "we", "us", or "our"), we are deeply committed to protecting your privacy and handling your personal data with transparency and care. This Privacy Policy explains what information we collect, how we use it, who we share it with, and the rights you have over your data.
              </p>

              <div className="legal-section">
                <h3><Eye size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Information We Collect</h3>
                <p>We collect the following categories of personal information:</p>
                <p style={{ marginTop: '12px' }}><strong>a) Information You Provide</strong></p>
                <ul className="legal-list">
                  <li><strong>Account Information:</strong> Name, email address, and profile picture obtained through Google OAuth sign-in.</li>
                  <li><strong>Onboarding Data:</strong> College/university name, course, department, year of study (students), and phone number.</li>
                  <li><strong>Profile Data:</strong> Bio, skills, social links, portfolio projects, and any additional information you choose to add to your profile.</li>
                  <li><strong>Event &amp; Competition Data:</strong> Event/competition details, descriptions, banners, and other content submitted by Organizers.</li>
                  <li><strong>Team Data:</strong> Team names, descriptions, member roles, and project details created via the Team Builder feature.</li>
                </ul>
                <p style={{ marginTop: '12px' }}><strong>b) Information Collected Automatically</strong></p>
                <ul className="legal-list">
                  <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the Platform, and interaction patterns.</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, device type, and screen resolution.</li>
                  <li><strong>Log Data:</strong> IP address, access timestamps, and referring URLs.</li>
                </ul>
                <p style={{ marginTop: '12px' }}><strong>c) Payment Information</strong></p>
                <ul className="legal-list">
                  <li>Payment transactions are processed entirely by <strong>Razorpay</strong>. We receive transaction confirmations (payment ID, order ID, payment status) but <strong>never</strong> receive, store, or have access to your card numbers, CVV, bank account details, or UPI PIN.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3><Layers size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> How We Use Your Information</h3>
                <p>We use your information for the following purposes:</p>
                <ul className="legal-list">
                  <li><strong>Account Management:</strong> To create, maintain, and secure your account.</li>
                  <li><strong>Service Delivery:</strong> To facilitate event bookings, competition registrations, team formation, and portfolio management.</li>
                  <li><strong>Communication:</strong> To send booking confirmations, event updates, refund notifications, and essential service communications.</li>
                  <li><strong>Platform Improvement:</strong> To analyze usage patterns, fix bugs, and improve the user experience.</li>
                  <li><strong>Safety &amp; Security:</strong> To detect and prevent fraud, abuse, and unauthorized access.</li>
                  <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3><Users size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Data Sharing &amp; Disclosure</h3>
                <p>We share your information only in the following limited circumstances:</p>
                <ul className="legal-list">
                  <li><strong>With Event Organizers:</strong> Your name, email, and booking details are shared with the Organizer of events you book or competitions you register for. This is strictly limited to event management, check-in, and participant communication.</li>
                  <li><strong>With Payment Processors:</strong> Transaction data is shared with Razorpay to process your payments securely.</li>
                  <li><strong>With College Administrators:</strong> If you are affiliated with a college that has an admin panel on Pluto, basic aggregate data (event counts, participation stats) may be visible to authorized college administrators.</li>
                  <li><strong>With Law Enforcement:</strong> We may disclose your information if required by law, court order, or government regulation.</li>
                </ul>
                <p style={{ marginTop: '12px' }}>We <strong>never</strong> sell, rent, or trade your personal data to third parties for marketing or advertising purposes.</p>
              </div>

              <div className="legal-section">
                <h3><Lock size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Data Storage &amp; Security</h3>
                <p>Your data is stored securely using <strong>Supabase</strong> (backed by PostgreSQL) with the following security measures:</p>
                <ul className="legal-list">
                  <li>All data is encrypted in transit using TLS/SSL encryption.</li>
                  <li>Data at rest is encrypted using AES-256 encryption.</li>
                  <li>Row-Level Security (RLS) policies ensure users can only access their own data.</li>
                  <li>Authentication is handled via Google OAuth with secure token management.</li>
                  <li>Regular security audits and monitoring are performed on our infrastructure.</li>
                </ul>
                <p style={{ marginTop: '12px' }}>While we implement industry-standard security measures, no method of electronic storage or transmission is 100% secure. We cannot guarantee absolute security of your data.</p>
              </div>

              <div className="legal-section">
                <h3><Clock size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Data Retention</h3>
                <ul className="legal-list">
                  <li><strong>Active Accounts:</strong> Your data is retained for as long as your account is active and you continue to use the Platform.</li>
                  <li><strong>Deleted Accounts:</strong> Upon account deletion, all personal data is permanently removed from our systems. Anonymized, aggregated data (that cannot identify you) may be retained for analytics purposes.</li>
                  <li><strong>Transaction Records:</strong> Payment and booking records may be retained for up to 7 years as required by Indian tax and financial regulations.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3><Globe size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Cookies &amp; Tracking</h3>
                <p>The Platform uses essential cookies and local storage for:</p>
                <ul className="legal-list">
                  <li>Authentication and session management.</li>
                  <li>Remembering your preferences and settings.</li>
                  <li>Maintaining a seamless user experience across sessions.</li>
                </ul>
                <p style={{ marginTop: '12px' }}>We do <strong>not</strong> use third-party advertising cookies or tracking pixels. We do not serve ads on the Platform.</p>
              </div>

              <div className="legal-section">
                <h3><Shield size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Your Rights</h3>
                <p>You have the following rights over your personal data:</p>
                <ul className="legal-list">
                  <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you.</li>
                  <li><strong>Right to Correction:</strong> Update or correct inaccurate information via your profile settings.</li>
                  <li><strong>Right to Deletion:</strong> Permanently delete your account and all associated data through the {routerLink('Delete Account', '/delete-account')} page.</li>
                  <li><strong>Right to Data Portability:</strong> Request your data in a structured, commonly used format.</li>
                  <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for non-essential data processing at any time.</li>
                </ul>
                <p style={{ marginTop: '12px' }}>To exercise any of these rights, contact us at {link('campuspluto@gmail.com', 'mailto:campuspluto@gmail.com')}. We will respond within 30 days.</p>
              </div>

              <div className="legal-section">
                <h3><UserX size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Children's Privacy</h3>
                <p>The Platform is not intended for children under 16 years of age. We do not knowingly collect personal data from children under 16. If we become aware that a child under 16 has provided us with personal data, we will take steps to delete such information promptly.</p>
              </div>

              <div className="legal-section">
                <h3><Globe size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Third-Party Services</h3>
                <p>The Platform integrates with the following third-party services:</p>
                <ul className="legal-list">
                  <li><strong>Google (OAuth):</strong> For secure authentication. Subject to {link("Google's Privacy Policy", 'https://policies.google.com/privacy', true)}.</li>
                  <li><strong>Razorpay:</strong> For payment processing. Subject to {link("Razorpay's Privacy Policy", 'https://razorpay.com/privacy/', true)}.</li>
                  <li><strong>Supabase:</strong> For database and authentication infrastructure. Subject to {link("Supabase's Privacy Policy", 'https://supabase.com/privacy', true)}.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3><FileText size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Changes to This Policy</h3>
                <p>We may update this Privacy Policy periodically. Material changes will be communicated via the Platform or email. The "Last Updated" date at the top of this page reflects the most recent revision. Your continued use of the Platform constitutes acceptance of the updated policy.</p>
              </div>

              <div className="legal-section" style={{ border: '1px solid rgba(96, 165, 250, 0.2)', background: 'rgba(96, 165, 250, 0.05)' }}>
                <h3><Mail size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Contact Our Privacy Team</h3>
                <p>For any privacy-related questions, concerns, or data requests, please contact us at {link('campuspluto@gmail.com', 'mailto:campuspluto@gmail.com')}.</p>
              </div>
            </div>
          </>
        )
      case 'refund':
        return (
          <>
            <div className="legal-header">
              <div className="legal-icon-wrap"><RefreshCcw size={32} color="#f43f5e" /></div>
              <h2>Refund &amp; Cancellation Policy</h2>
              <p className="legal-subtitle">Last Updated: 25 September 2026</p>
            </div>

            <div className="legal-body">
              <p className="legal-intro">
                At <strong>Pluto Campus</strong>, we strive to ensure a fair and transparent refund process for all users. This policy applies to all ticket bookings and competition registrations made through the Platform.
              </p>

              <div className="legal-section" style={{ border: '1px solid rgba(96, 165, 250, 0.2)', background: 'rgba(96, 165, 250, 0.05)' }}>
                <h3><Info size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Quick Summary</h3>
                <ul className="legal-list">
                  <li><strong>Cancellation Window:</strong> Within 24 hours of booking</li>
                  <li><strong>Cancellation Fee:</strong> Flat ₹30 per booking</li>
                  <li><strong>Refund Timeline:</strong> 5–7 business days</li>
                  <li><strong>Refund Method:</strong> Original payment method (UPI/Card/Net Banking)</li>
                  <li><strong>Competition Registrations:</strong> Non-refundable (unless cancelled by Organizer)</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3><BookOpen size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Event Ticket Cancellations</h3>
                <p><strong>a) Cancellation by the User</strong></p>
                <ul className="legal-list">
                  <li>You may cancel your event ticket booking and request a refund <strong>within 24 hours</strong> of the time of booking.</li>
                  <li>Cancellation requests made after 24 hours from the booking time will <strong>not</strong> be eligible for a refund, regardless of the event date.</li>
                  <li>Cancellations can be initiated directly from the Platform through the <strong>Dashboard → My Bookings</strong> section.</li>
                </ul>
                <p style={{ marginTop: '12px' }}><strong>b) Cancellation Fee</strong></p>
                <ul className="legal-list">
                  <li>A flat cancellation fee of <strong>₹30</strong> will be deducted from the refund amount for every cancellation.</li>
                  <li>This fee covers payment gateway charges and administrative processing costs incurred by Pluto Campus.</li>
                  <li>The cancellation fee is non-negotiable and applies uniformly.</li>
                </ul>
                <p style={{ marginTop: '12px' }}><strong>c) Refund Amount Calculation</strong></p>
                <p style={{ marginTop: '4px', fontStyle: 'italic' }}>Refund Amount = Total Amount Paid − ₹30 (Cancellation Fee)</p>
              </div>

              <div className="legal-section">
                <h3><Layers size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Competition Registration Refunds</h3>
                <ul className="legal-list">
                  <li>Competition registrations (hackathons, coding competitions, case studies, ideathons) are <strong>non-refundable</strong> once confirmed.</li>
                  <li>The 2.5% platform fee charged on competition registrations is <strong>non-refundable</strong> under any circumstances.</li>
                  <li>If a competition is cancelled by the Organizer, a <strong>full refund</strong> (including the platform fee) will be issued to all registered participants within 10 business days.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3><CreditCard size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Refund Processing</h3>
                <ul className="legal-list">
                  <li>Approved refunds are initiated <strong>immediately</strong> by Pluto Campus upon cancellation confirmation.</li>
                  <li>The refund is credited back to the <strong>original payment method</strong> used during the booking (UPI, credit/debit card, or net banking).</li>
                  <li>Depending on your bank or payment provider, it may take <strong>5 to 7 business days</strong> for the refund to reflect in your account.</li>
                  <li>If your refund has not been received after 7 business days, please check with your bank first, then contact us at {link('campuspluto@gmail.com', 'mailto:campuspluto@gmail.com')}.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3><AlertCircle size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Non-Refundable Scenarios</h3>
                <p>Refunds will <strong>not</strong> be issued in the following cases:</p>
                <ul className="legal-list">
                  <li>Cancellation request made <strong>after 24 hours</strong> from the time of booking.</li>
                  <li><strong>No-shows</strong> — failure to attend the event does not qualify for a refund.</li>
                  <li>Events where the Organizer has explicitly listed the event as <strong>"Non-Refundable"</strong> at the time of listing.</li>
                  <li>Free events or ₹0 bookings (as no payment was made).</li>
                  <li>Bookings made using promotional codes or discounts where the effective amount paid was ₹0.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3><RefreshCcw size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Event Cancellation by the Organizer</h3>
                <ul className="legal-list">
                  <li>If an event is <strong>cancelled by the Organizer</strong>, all ticket holders will receive a <strong>full refund</strong> of the total amount paid, without any cancellation fee deduction.</li>
                  <li>Refunds in such cases will be processed within <strong>10 business days</strong> from the date of event cancellation.</li>
                  <li>Pluto Campus will notify all affected users via email.</li>
                </ul>
              </div>

              <div className="legal-section">
                <h3><Clock size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Event Rescheduling</h3>
                <ul className="legal-list">
                  <li>If an event is <strong>rescheduled</strong> by the Organizer, your existing ticket remains valid for the new date.</li>
                  <li>If you are unable to attend on the rescheduled date, you may request a cancellation and refund (subject to the standard 24-hour cancellation policy from the time of the rescheduling announcement).</li>
                </ul>
              </div>

              <div className="legal-section" style={{ border: '1px solid rgba(96, 165, 250, 0.2)', background: 'rgba(96, 165, 250, 0.05)' }}>
                <h3><Mail size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> Disputes &amp; Escalations</h3>
                <p>If you believe a refund has been incorrectly processed or denied, you may raise a dispute by contacting our support team at {link('campuspluto@gmail.com', 'mailto:campuspluto@gmail.com')}.</p>
                <p style={{ marginTop: '12px' }}>Please include your <strong>Booking ID</strong>, registered email, and a description of the issue. We aim to resolve all disputes within <strong>48 business hours</strong>.</p>
              </div>
            </div>
          </>
        )
      case 'contact':
        return (
          <>
            <div className="legal-header">
              <div className="legal-icon-wrap"><Headset size={32} color="#3b82f6" /></div>
              <h2>Contact Us</h2>
              <p className="legal-subtitle">We're here to help</p>
            </div>

            <div className="legal-body">
              <p className="legal-intro">
                Have a question, need help with a booking, or want to report an issue? Our support team is available and ready to assist you.
              </p>
              
              <div className="contact-grid">
                <div className="contact-card">
                  <div className="contact-icon"><Mail size={24} color="#60a5fa" /></div>
                  <div className="contact-info">
                    <strong>Email Support</strong>
                    <a href="mailto:campuspluto@gmail.com">campuspluto@gmail.com</a>
                    <p style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '4px' }}>Best for detailed queries, refund requests, and account issues</p>
                  </div>
                </div>
                
                <div className="contact-card">
                  <div className="contact-icon"><MapPin size={24} color="#f43f5e" /></div>
                  <div className="contact-info">
                    <strong>Registered Office</strong>
                    <p>Navi Mumbai, Maharashtra, India</p>
                  </div>
                </div>

                <div className="contact-card">
                  <div className="contact-icon"><Clock size={24} color="#fbbf24" /></div>
                  <div className="contact-info">
                    <strong>Response Time</strong>
                    <p>We aim to respond to all inquiries within <strong>24–48 business hours</strong></p>
                  </div>
                </div>
              </div>

              <div className="legal-section" style={{ marginTop: '32px' }}>
                <h3><Info size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> When to Contact Us</h3>
                <ul className="legal-list">
                  <li><strong>Booking Issues:</strong> Problems with ticket purchases, failed payments, or missing confirmation emails.</li>
                  <li><strong>Refund Requests:</strong> Cancellation and refund queries beyond the self-service option on your dashboard.</li>
                  <li><strong>Account Problems:</strong> Login issues, account recovery, or profile-related concerns.</li>
                  <li><strong>Organizer Support:</strong> Help with creating events, managing competitions, or payout queries.</li>
                  <li><strong>Bug Reports:</strong> Technical issues, broken features, or unexpected behaviour on the Platform.</li>
                  <li><strong>Privacy &amp; Data:</strong> Data access requests, deletion requests, or privacy-related concerns.</li>
                  <li><strong>Feedback &amp; Suggestions:</strong> Ideas to improve the Platform — we love hearing from you!</li>
                </ul>
              </div>

              <div className="legal-section" style={{ marginTop: '24px' }}>
                <h3><FileText size={18} style={{ color: '#60a5fa', flexShrink: 0 }} /> For Faster Resolution</h3>
                <p>When contacting us, please include the following details where applicable:</p>
                <ul className="legal-list">
                  <li>Your registered email address</li>
                  <li>Booking ID or Registration ID (if applicable)</li>
                  <li>Screenshot of the issue (if applicable)</li>
                  <li>A clear description of the problem</li>
                </ul>
              </div>
            </div>
          </>
        )
      default:
        return (
          <div className="legal-header" style={{ textAlign: 'center', padding: '40px 0' }}>
            <h2>Policy Not Found</h2>
            <p className="legal-subtitle">The requested legal document could not be found.</p>
          </div>
        )
    }
  }

  return (
    <>
      <Helmet>
        <title>{getPageTitle()} | PLUTO Campus</title>
        <meta name="description" content={`${getPageTitle()} for Pluto Campus - India's campus event ticketing and competition hosting platform.`} />
      </Helmet>

      <div className="legal-modal-overlay">
        <div className="legal-modal-content" style={{ cursor: 'default' }}>
          <div className="legal-modal-scroll">
            {getContent()}
          </div>
        </div>
      </div>
    </>
  )
}
