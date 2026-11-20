/**
 * userService.ts — PLUTO
 * Full 1:1 port of userService.js
 * Wraps all user-profile DB operations against the production Supabase schema.
 */

import { supabase } from '@/lib/supabase'
import { getCdnUrl } from '@/utils/cdn'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  name: string
  email: string
  college: string
  roles: string[]
  createdAt: string
}

export interface UserSettings {
  id: string
  email: string
  firstName: string
  lastName: string
  username: string
  bio: string
  avatar: string
  college: string
  collegeId: string | null
  roles: string[]
  socials: {
    instagram: string
    twitter: string
    linkedin: string
    github: string
    portfolio: string
  }
  preferences: {
    language: string
    notifications: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface PaymentDetails {
  razorpay_account_id: string
  account_holder_name: string
  account_number: string
  ifsc_code: string
  upi_vpa: string
  account_type: string
  updated_at: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const USER_TABLE = 'users'
const COLLEGE_TABLE = 'colleges'

const PROFILE_SELECT = `
  id, name, email, roles, college_id, created_at,
  college:${COLLEGE_TABLE}!college_id ( id, name )
`.trim()

const SETTINGS_SELECT = `
  id, name, email, roles, college_id,
  username, bio, profile_avatar, socials, preferences, profile_data,
  created_at, updated_at,
  college:${COLLEGE_TABLE}!college_id ( id, name )
`.trim()

// ─── Internal Helpers ────────────────────────────────────────────────────────

function _rowToProfile(row: any, email?: string): UserProfile {
  return {
    id: row.id,
    name: row.name || '',
    email: email || row.email || '',
    college: row.college?.name ?? '',
    roles: row.roles || ['student'],
    createdAt: row.created_at,
  }
}

function _rowToSettings(row: any, email?: string): UserSettings {
  const socials = row.socials || {}
  const prefs = row.preferences || {}

  const nameParts = (row.name || '').trim().split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  return {
    id: row.id,
    email: email || row.email || '',
    firstName,
    lastName,
    username: row.username || '',
    bio: row.bio || '',
    avatar: getCdnUrl(row.profile_avatar) || '',
    college: row.college?.name ?? '',
    collegeId: row.college_id || null,
    roles: row.roles || ['student'],
    socials: {
      instagram: socials.instagram || '',
      twitter: socials.twitter || '',
      linkedin: socials.linkedin || '',
      github: socials.github || '',
      portfolio: socials.portfolio || '',
    },
    preferences: {
      language: prefs.language || 'en',
      notifications: prefs.notifications !== false,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function _getAuthUser(): Promise<{ id: string; email: string } | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    return { id: user.id, email: user.email ?? '' }
  } catch (err) {
    console.error('[userService] _getAuthUser:', err)
    return null
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const userService = {

  async getAuthUser() {
    return _getAuthUser()
  },

  async getCurrentProfile(): Promise<UserProfile | null> {
    const authUser = await _getAuthUser()
    if (!authUser) return null

    const { data, error } = await supabase
      .from(USER_TABLE)
      .select(PROFILE_SELECT)
      .eq('id', authUser.id)
      .maybeSingle()

    if (error || !data) return null
    return _rowToProfile(data, authUser.email)
  },

  async updateProfile(updates: { name?: string; college_id?: string }): Promise<UserProfile | null> {
    const authUser = await _getAuthUser()
    if (!authUser) return null

    const patch: Record<string, unknown> = {}
    if (updates.name !== undefined) patch.name = updates.name
    if (updates.college_id !== undefined) patch.college_id = updates.college_id

    if (Object.keys(patch).length === 0) return this.getCurrentProfile()

    const { data, error } = await supabase
      .from(USER_TABLE)
      .update(patch)
      .eq('id', authUser.id)
      .select(PROFILE_SELECT)
      .single()

    if (error) { console.error('[userService.updateProfile]', error.message); return null }
    return _rowToProfile(data, authUser.email)
  },

  async getUserById(userId: string): Promise<UserProfile | null> {
    if (!userId) return null

    const { data, error } = await supabase
      .from(USER_TABLE)
      .select(PROFILE_SELECT)
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) return null
    return _rowToProfile(data)
  },

  async promoteToOrganizer(): Promise<UserProfile | null> {
    const authUser = await _getAuthUser()
    if (!authUser) return null

    const { data: current } = await supabase
      .from(USER_TABLE)
      .select('roles')
      .eq('id', authUser.id)
      .single()

    let roles = current?.roles || ['student']
    if (!roles.includes('organizer')) {
      roles = [...roles, 'organizer']
    }

    const { data, error } = await supabase
      .from(USER_TABLE)
      .update({ roles })
      .eq('id', authUser.id)
      .select(PROFILE_SELECT)
      .single()

    if (error) { console.error('[userService.promoteToOrganizer]', error.message); return null }
    return _rowToProfile(data, authUser.email)
  },

  async getSettings(): Promise<UserSettings | null> {
    const authUser = await _getAuthUser()
    if (!authUser) return null

    const { data, error } = await supabase
      .from(USER_TABLE)
      .select(SETTINGS_SELECT)
      .eq('id', authUser.id)
      .maybeSingle()

    if (error || !data) return null
    return _rowToSettings(data, authUser.email)
  },

  async saveSettings(settingsObj: Partial<UserSettings>): Promise<UserSettings | null> {
    const authUser = await _getAuthUser()
    if (!authUser) return null

    const patch: Record<string, unknown> = {}

    if (settingsObj.firstName !== undefined || settingsObj.lastName !== undefined) {
      const first = (settingsObj.firstName || '').trim()
      const last = (settingsObj.lastName || '').trim()
      patch.name = (first + ' ' + last).trim()
    }

    if (settingsObj.username !== undefined) patch.username = settingsObj.username
    if (settingsObj.bio !== undefined) patch.bio = settingsObj.bio
    if (settingsObj.avatar !== undefined) patch.profile_avatar = settingsObj.avatar
    if (settingsObj.collegeId !== undefined) patch.college_id = settingsObj.collegeId

    if (settingsObj.socials !== undefined) {
      patch.socials = {
        instagram: settingsObj.socials.instagram || '',
        twitter: settingsObj.socials.twitter || '',
        linkedin: settingsObj.socials.linkedin || '',
        github: settingsObj.socials.github || '',
        portfolio: settingsObj.socials.portfolio || '',
      }
    }

    if (settingsObj.preferences !== undefined) {
      patch.preferences = {
        language: settingsObj.preferences.language || 'en',
        notifications: settingsObj.preferences.notifications !== false,
      }
    }

    if (Object.keys(patch).length === 0) return this.getSettings()

    const { data, error } = await supabase
      .from(USER_TABLE)
      .update(patch)
      .eq('id', authUser.id)
      .select(SETTINGS_SELECT)
      .single()

    if (error) {
      console.error('[userService.saveSettings]', error.message)
      throw error
    }

    return _rowToSettings(data, authUser.email)
  },

  async savePaymentDetails(paymentObj: Partial<PaymentDetails>): Promise<PaymentDetails | null> {
    const authUser = await _getAuthUser()
    if (!authUser) return null

    const { data: current } = await supabase
      .from(USER_TABLE)
      .select('profile_data')
      .eq('id', authUser.id)
      .single()

    const existingData = (current?.profile_data as Record<string, unknown>) || {}

    const updatedData = {
      ...existingData,
      payment: {
        razorpay_account_id: paymentObj.razorpay_account_id || '',
        account_holder_name: paymentObj.account_holder_name || '',
        account_number: paymentObj.account_number || '',
        ifsc_code: paymentObj.ifsc_code || '',
        upi_vpa: paymentObj.upi_vpa || '',
        account_type: paymentObj.account_type || 'savings',
        updated_at: new Date().toISOString(),
      },
    }

    const { data, error } = await supabase
      .from(USER_TABLE)
      .update({ profile_data: updatedData })
      .eq('id', authUser.id)
      .select('profile_data')
      .single()

    if (error) {
      console.error('[userService.savePaymentDetails]', error.message)
      return null
    }

    return (data?.profile_data as any)?.payment || null
  },

  async getPaymentDetails(): Promise<PaymentDetails | null> {
    const authUser = await _getAuthUser()
    if (!authUser) return null

    const { data, error } = await supabase
      .from(USER_TABLE)
      .select('profile_data')
      .eq('id', authUser.id)
      .maybeSingle()

    if (error) return null
    return (data?.profile_data as any)?.payment || null
  },

  async uploadAvatar(userId: string, base64DataUrl: string): Promise<string | null> {
    try {
      // Extract the base64 part and content type
      const arr = base64DataUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) return null;
      
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const extension = mime.split('/')[1] || 'jpeg';
      const fileName = `${userId}-${Date.now()}.${extension}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: mime
        });

      if (error) {
        console.error('[userService.uploadAvatar] upload error:', error);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (e) {
      console.error('[userService.uploadAvatar] Exception:', e);
      return null;
    }
  },
}
