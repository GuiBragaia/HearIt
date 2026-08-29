'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  cleanDisplayName,
  displayNameIssue,
  isValidEmail,
  isValidUsername,
  sanitizeFavoriteIds,
  type SessionUser,
} from '@/lib/session'
import { friendStatus } from '@/lib/friends'
import {
  acceptFriend as acceptRemote,
  dropFriendship,
  loadSessionUser,
  patchProfile,
  requestFriend as requestRemote,
  uploadAvatar,
} from '@/lib/db'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

type AuthError =
  | 'name'
  | 'display'
  | 'offensive'
  | 'email'
  | 'password'
  | 'exists'
  | 'missing'
  | 'login'
  | 'config'
  | 'confirm'

type SessionValue = {
  user: SessionUser | null
  ready: boolean
  configured: boolean
  join: (input: { username: string; displayName: string; email: string; password: string }) => Promise<AuthError | null>
  login: (input: { email: string; password: string }) => Promise<AuthError | null>
  joinWith: (provider: 'apple' | 'google') => Promise<AuthError | null>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  updateProfile: (patch: Partial<Pick<SessionUser, 'photo' | 'favorites' | 'name'>>) => Promise<AuthError | null>
  requestFriend: (id: string) => Promise<void>
  cancelRequest: (id: string) => Promise<void>
  acceptFriend: (id: string) => Promise<void>
  declineFriend: (id: string) => Promise<void>
  removeFriend: (id: string) => Promise<void>
}

const SessionContext = createContext<SessionValue | null>(null)

async function hydrate(userId: string, email: string) {
  for (let i = 0; i < 6; i += 1) {
    const profile = await loadSessionUser(userId, email)
    if (profile) return profile
    await new Promise((resolve) => window.setTimeout(resolve, 250 * (i + 1)))
  }
  return null
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [ready, setReady] = useState(false)
  const configured = isSupabaseConfigured()

  const refresh = useCallback(async () => {
    const db = getSupabase()
    if (!db) {
      setUser(null)
      return
    }
    const { data } = await db.auth.getUser()
    const authUser = data.user
    if (!authUser) {
      setUser(null)
      return
    }
    const next = await loadSessionUser(authUser.id, authUser.email ?? '')
    setUser(next)
  }, [])

  useEffect(() => {
    const db = getSupabase()
    if (!db) {
      setReady(true)
      return
    }
    let live = true
    void db.auth.getSession().then(async ({ data }) => {
      const authUser = data.session?.user
      if (authUser) {
        const next = await hydrate(authUser.id, authUser.email ?? '')
        if (live) setUser(next)
      }
      if (live) setReady(true)
    })
    const { data: sub } = db.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user
      if (!authUser) {
        setUser(null)
        return
      }
      void hydrate(authUser.id, authUser.email ?? '').then((next) => {
        if (live) setUser(next)
      })
    })
    return () => {
      live = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const applyLists = useCallback((lists: { friends: string[]; outgoing: string[]; incoming: string[] }) => {
    setUser((current) => (current ? { ...current, ...lists } : current))
  }, [])

  const value = useMemo<SessionValue>(
    () => ({
      user,
      ready,
      configured,
      join: async ({ username, displayName, email, password }) => {
        const db = getSupabase()
        if (!db) return 'config'
        if (!isValidUsername(username)) return 'name'
        const nameIssue = displayNameIssue(displayName)
        if (nameIssue) return nameIssue
        if (!isValidEmail(email)) return 'email'
        if (password.length < 6) return 'password'
        const handle = username.trim().toLowerCase()
        const { data: taken } = await db.from('profiles').select('id').eq('handle', handle).maybeSingle()
        if (taken) return 'name'
        const { data, error } = await db.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              handle,
              display_name: cleanDisplayName(displayName),
            },
          },
        })
        if (error) {
          const text = error.message.toLowerCase()
          if (text.includes('already') || text.includes('registered')) return 'exists'
          if (text.includes('handle')) return 'name'
          return 'email'
        }
        if (!data.user) return 'missing'
        if (!data.session) return 'confirm'
        const next = await hydrate(data.user.id, data.user.email ?? email)
        setUser(next)
        return next ? null : 'missing'
      },
      login: async ({ email, password }) => {
        const db = getSupabase()
        if (!db) return 'config'
        if (!isValidEmail(email)) return 'email'
        if (!password) return 'password'
        const { data, error } = await db.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })
        if (error || !data.user) return 'login'
        const next = await hydrate(data.user.id, data.user.email ?? email)
        setUser(next)
        return next ? null : 'missing'
      },
      joinWith: async (provider) => {
        const db = getSupabase()
        if (!db) return 'config'
        const { error } = await db.auth.signInWithOAuth({
          provider,
          options: { redirectTo: `${window.location.origin}/profile` },
        })
        return error ? 'missing' : null
      },
      logout: async () => {
        const db = getSupabase()
        if (db) await db.auth.signOut()
        setUser(null)
      },
      refresh,
      updateProfile: async (patch) => {
        if (!user) return 'missing'
        if (patch.name !== undefined) {
          const issue = displayNameIssue(patch.name)
          if (issue) return issue
        }
        let photo = user.photo
        if (patch.photo !== undefined) {
          if (patch.photo) {
            const uploaded = await uploadAvatar(user.id, patch.photo)
            if (!uploaded) return 'missing'
            photo = uploaded
          } else {
            photo = undefined
          }
        }
        const name = patch.name !== undefined ? cleanDisplayName(patch.name) : user.name
        const favorites = patch.favorites !== undefined ? sanitizeFavoriteIds(patch.favorites) : user.favorites
        const row = await patchProfile(user.id, {
          display_name: name,
          favorites,
          photo_url: photo ?? null,
        })
        if (!row) return 'missing'
        const next = await loadSessionUser(user.id, user.email)
        if (next) setUser(next)
        return null
      },
      requestFriend: async (id) => {
        if (!user) return
        if (friendStatus(user, id) === 'incoming') {
          applyLists(await acceptRemote(user.id, id))
          return
        }
        if (friendStatus(user, id) !== 'none') return
        applyLists(await requestRemote(user.id, id))
      },
      cancelRequest: async (id) => {
        if (!user) return
        applyLists(await dropFriendship(user.id, id))
      },
      acceptFriend: async (id) => {
        if (!user) return
        applyLists(await acceptRemote(user.id, id))
      },
      declineFriend: async (id) => {
        if (!user) return
        applyLists(await dropFriendship(user.id, id))
      },
      removeFriend: async (id) => {
        if (!user) return
        applyLists(await dropFriendship(user.id, id))
      },
    }),
    [user, ready, configured, refresh, applyLists],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
