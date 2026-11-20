export interface User {
  id: string
  email: string
  name: string
  college?: string
  college_id?: string
  course?: string
  department?: string
  year?: string
  section?: string
  avatar_url?: string
  admin_type?: 'pluto_hq' | 'college_admin' | 'department_admin'
  roles: string[]
  bio?: string
  state?: string
  city?: string
  username?: string
  socials?: {
    instagram?: string
    twitter?: string
    linkedin?: string
    github?: string
    portfolio?: string
  }
  payouts?: {
    bank_name?: string
    account_name?: string
    account_number?: string
    ifsc_code?: string
    upi_id?: string
  }
  created_at?: string
}
export interface UserSettings {
  theme: 'dark' | 'light'
  notifications_enabled: boolean
}
