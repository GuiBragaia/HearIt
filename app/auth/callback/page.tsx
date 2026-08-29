'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthHello, type AuthHelloKind } from '@/components/auth/AuthHello'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { LogoMark } from '@/components/layout/Logo'
import { applyOauthProfile, waitForSessionUser } from '@/lib/db'
import { useI18n } from '@/lib/i18n'
import { consumeOauthPopupMark, isOauthPopup, notifyOauthOpener, oauthHelloKind } from '@/lib/oauth'
import { profileTitle } from '@/lib/session'
import { getSupabase } from '@/lib/supabase'

type HelloState = { kind: AuthHelloKind; name: string; handle: string }

function oauthFailUrl() {
  return '/login?oauth=1'
}

export default function AuthCallbackPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [hello, setHello] = useState<HelloState | null>(null)
  const [popupDone, setPopupDone] = useState(false)

  useEffect(() => {
    let live = true

    const failPopup = () => {
      notifyOauthOpener(false)
      window.close()
      if (live) setPopupDone(true)
    }

    const finish = async () => {
      const popup = isOauthPopup() || consumeOauthPopupMark()
      const db = getSupabase()
      if (!db) {
        if (popup) failPopup()
        else router.replace(oauthFailUrl())
        return
      }

      const url = new URL(window.location.href)
      const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
      const denied =
        url.searchParams.get('error_description') ||
        url.searchParams.get('error') ||
        hash.get('error_description') ||
        hash.get('error')
      const code = url.searchParams.get('code') ?? undefined

      if (denied) {
        if (popup) failPopup()
        else router.replace(oauthFailUrl())
        return
      }

      if (popup) {
        notifyOauthOpener(true, code)
        window.close()
        if (live) setPopupDone(true)
        return
      }

      let { data } = await db.auth.getSession()
      if (!data.session) {
        if (!code) {
          router.replace(oauthFailUrl())
          return
        }
        const exchanged = await db.auth.exchangeCodeForSession(code)
        if (exchanged.error) {
          router.replace(oauthFailUrl())
          return
        }
        data = (await db.auth.getSession()).data
      }

      const authUser = data.session?.user
      if (!authUser) {
        router.replace(oauthFailUrl())
        return
      }

      window.history.replaceState({}, '', '/auth/callback')
      await applyOauthProfile(authUser.id, authUser.user_metadata as Record<string, unknown>)
      const account = await waitForSessionUser(authUser.id, authUser.email ?? '')
      if (!live) return
      if (!account) {
        router.replace('/profile')
        return
      }

      setHello({
        kind: oauthHelloKind(authUser),
        name: profileTitle(account),
        handle: account.handle,
      })
    }

    void finish()
    return () => {
      live = false
    }
  }, [router])

  return (
    <section className="auth-screen">
      <div className="auth-mark" aria-hidden>
        <i className="auth-mark-bloom" />
        <LogoMark size={420} className="auth-mark-ghost" />
        <LogoMark size={420} className="auth-mark-core" />
      </div>
      <ViewportWaveform />
      {!hello ? (
        <div className="auth-stage">
          <p className="m-0 text-sm text-muted-foreground">{popupDone ? t.auth.popupClose : t.auth.connecting}</p>
        </div>
      ) : null}
      <AuthHello
        open={Boolean(hello)}
        kind={hello?.kind ?? 'login'}
        name={hello?.name ?? ''}
        handle={hello?.handle}
        onDone={() => router.replace('/profile')}
      />
    </section>
  )
}
