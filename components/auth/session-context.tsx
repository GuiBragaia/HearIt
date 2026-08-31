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
import { sanitizeSavedTracks } from '@/lib/saved-tracks'
import { friendStatus } from '@/lib/friends'
import {
  acceptFriend as acceptRemote,
  applyOauthProfile,
  dropFriendship,
  loadSessionUser,
  patchProfile,
  persistSavedTracks,
  requestFriend as requestRemote,
  uploadAvatar,
  waitForSessionUser,
} from '@/lib/db'
import { isOauthMessage, markOauthPopup, OAUTH_SOURCE } from '@/lib/oauth'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { claimGuestDailyRun } from '@/lib/daily-run'

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
  | 'oauth'
  | 'closed'
  | 'taken'
  | 'rate'

type SessionValue = {
  user: SessionUser | null
  ready: boolean
  configured: boolean
  join: (input: { username: string; displayName: string; email: string; password: string }) => Promise<AuthError | null>
  login: (input: { email: string; password: string }) => Promise<AuthError | null>
  joinWith: (provider: 'apple' | 'google', popup?: Window | null) => Promise<AuthError | null>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  updateProfile: (patch: Partial<Pick<SessionUser, 'photo' | 'favorites' | 'name'>>) => Promise<AuthError | null>
  saveLibrary: (tracks: SessionUser['savedTracks']) => Promise<boolean>
  requestFriend: (id: string) => Promise<void>
  cancelRequest: (id: string) => Promise<void>
  acceptFriend: (id: string) => Promise<void>
  declineFriend: (id: string) => Promise<void>
  removeFriend: (id: string) => Promise<void>
}

const SessionContext = createContext<SessionValue | null>(null)

async function hydrate(userId: string, email: string) {
  const next = await waitForSessionUser(userId, email)
  if (!next) return null
  const claimed = await claimGuestDailyRun(userId)
  if (!claimed) return next
  return (await loadSessionUser(userId, email)) ?? next
}

function waitForOauthPopup(db: NonNullable<ReturnType<typeof getSupabase>>, popup: Window) {
  return new Promise<AuthError | null>((resolve) => {
    let settled = false
    let sawClosed = false
    let channel: BroadcastChannel | undefined
    let sub: { unsubscribe: () => void } | undefined

    const finish = (result: AuthError | null) => {
      if (settled) return
      settled = true
      window.removeEventListener('message', onMessage)
      window.clearInterval(timer)
      sub?.unsubscribe()
      channel?.close()
      resolve(result)
    }

    const takeSession = async (code?: string) => {
      let { data } = await db.auth.getSession()
      if (!data.session && code) {
        await db.auth.exchangeCodeForSession(code)
        data = (await db.auth.getSession()).data
      }
      if (data.session) finish(null)
      else finish('oauth')
    }

    const onPayload = (data: { ok: boolean; code?: string }) => {
      if (!data.ok) {
        finish('oauth')
        return
      }
      void takeSession(data.code)
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (!isOauthMessage(event.data)) return
      onPayload(event.data)
    }

    try {
      channel = new BroadcastChannel(OAUTH_SOURCE)
      channel.onmessage = (event) => {
        if (isOauthMessage(event.data)) onPayload(event.data)
      }
    } catch {
      // Ignore.
    }

    const auth = db.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        finish(null)
      }
    })
    sub = auth.data.subscription

    window.addEventListener('message', onMessage)
    const timer = window.setInterval(() => {
      if (sawClosed) return
      let closed = false
      try {
        closed = popup.closed
      } catch {
        return
      }
      if (!closed) return
      sawClosed = true
      window.setTimeout(() => {
        void db.auth.getSession().then(({ data }) => {
          finish(data.session ? null : 'closed')
        })
      }, 280)
    }, 400)
  })
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
        if (live && next) setUser(next)
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
        if (taken) return 'taken'
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
          const status = 'status' in error ? Number(error.status) : 0
          if (status === 429 || text.includes('rate') || text.includes('too many')) return 'rate'
          if (text.includes('already') || text.includes('registered')) return 'exists'
          if (text.includes('handle')) return 'taken'
          return 'email'
        }
        if (!data.user) return 'missing'
        if (!data.session) return 'confirm'
        const next = await hydrate(data.user.id, data.user.email ?? email)
        if (next) setUser(next)
        return null
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
        if (next) setUser(next)
        return null
      },
      joinWith: async (provider, popup) => {
        const db = getSupabase()
        if (!db) return 'config'
        const { data, error } = await db.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            skipBrowserRedirect: true,
            ...(provider === 'google' ? { queryParams: { prompt: 'select_account' } } : {}),
          },
        })
        if (error || !data.url) {
          popup?.close()
          return 'oauth'
        }
        if (!popup || popup.closed) {
          window.location.assign(data.url)
          return null
        }
        const waiting = waitForOauthPopup(db, popup)
        markOauthPopup()
        try {
          popup.location.assign(data.url)
        } catch {
          window.location.assign(data.url)
          return null
        }
        const result = await waiting
        if (result) return result
        const { data: sessionData } = await db.auth.getSession()
        const authUser = sessionData.session?.user
        if (!authUser) return 'oauth'
        await applyOauthProfile(authUser.id, authUser.user_metadata as Record<string, unknown>)
        const next = await hydrate(authUser.id, authUser.email ?? '')
        setUser(next)
        return next ? null : 'missing'
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
        setUser({ ...user, name, photo, favorites })
        const row = await patchProfile(user.id, {
          display_name: name,
          favorites,
          photo_url: photo ?? null,
        })
        if (!row) {
          setUser(user)
          return 'missing'
        }
        const next = await loadSessionUser(user.id, user.email)
        if (next) setUser(next)
        return null
      },
      saveLibrary: async (tracks) => {
        if (!user) return false
        const savedTracks = sanitizeSavedTracks(tracks)
        setUser({ ...user, savedTracks })
        const ok = await persistSavedTracks(user.id, savedTracks)
        if (!ok) {
          setUser(user)
          return false
        }
        return true
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
