import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Trash2, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

export default function DeleteAccount() {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const handleDelete = async () => {
    if (!user) {
      setError('You must be logged in to delete your account.')
      // Optional: trigger auth modal here if needed
      return
    }

    // We are now using the React modal for confirmation
    setShowConfirmModal(false)

    setLoading(true)
    setError('')
    
    try {
      const { error: rpcError } = await supabase.rpc('delete_user_account')
      if (rpcError) throw rpcError

      setSuccess(true)
      await signOut()
    } catch (err: any) {
      console.error('Delete account error:', err)
      setError(err.message || 'Failed to delete account. Please try again or contact support.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1rem', marginTop: '-1rem', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ 
        maxWidth: '600px', 
        width: '100%', 
        backgroundColor: '#1e1e1e', 
        borderRadius: '24px', 
        padding: '3rem 2rem', 
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      }}>
        <div>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '50%', marginBottom: '1rem' }}>
              <Trash2 size={48} color="white" />
            </div>
            <h1 className="legal-title" style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 'bold' }}>Delete Account</h1>
            <p style={{ color: '#a1a1aa' }}>Permanently remove your account and all associated data.</p>
          </div>

          {success ? (
            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: '16px', border: '1px solid rgba(34,197,94,0.2)' }}>
              <h2 style={{ color: '#4ade80', marginBottom: '1rem' }}>Account Deleted</h2>
              <p style={{ color: '#e4e4e7', marginBottom: '1.5rem' }}>Your account has been successfully and permanently deleted.</p>
              <button 
                onClick={() => navigate('/')}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Return to Home
              </button>
            </div>
          ) : (
            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '2.5rem', borderRadius: '20px' }}>
              {!user ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#e4e4e7', marginBottom: '1.5rem' }}>You must be logged in to delete your account.</p>
                  <button 
                    onClick={() => useUIStore.getState().openAuthModal('login')}
                    style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Log In to Continue
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem' }}>Warning: This is permanent!</h3>
                    <ul style={{ color: '#e4e4e7', fontSize: '0.9rem', marginLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <li>All your profile information will be deleted.</li>
                      <li>Any events you have created will be removed.</li>
                      <li>Any teams you have joined or created will be affected.</li>
                      <li>Your tickets and transaction history will be lost.</li>
                    </ul>
                  </div>

                  {error && (
                    <div style={{ color: '#ef4444', fontSize: '0.9rem', padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>
                      {error}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button 
                      style={{ flex: 1, padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: '#e4e4e7', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }} 
                      onClick={() => navigate(-1)} 
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button 
                      style={{ flex: 1, padding: '0.75rem 1.5rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                      onClick={() => setShowConfirmModal(true)}
                      disabled={loading}
                    >
                      {loading ? (
                        'Deleting...'
                      ) : (
                        <>
                          <Trash2 size={18} style={{ marginRight: '8px' }} />
                          Delete Permanently
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && user && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#18181b',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: 'white', fontSize: '1.25rem' }}>Confirm Deletion</h2>
            
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.03)', 
              borderRadius: '16px', 
              padding: '1.5rem', 
              marginBottom: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" style={{ width: '64px', height: '64px', borderRadius: '32px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '64px', height: '64px', borderRadius: '32px', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>{user.name || 'Anonymous User'}</div>
                <div style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>{user.email}</div>
              </div>
            </div>

            <p style={{ color: 'white', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Are you sure? This will instantly and permanently erase this account.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={loading}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
