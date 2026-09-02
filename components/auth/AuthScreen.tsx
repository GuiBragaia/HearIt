'use client'

import { useEffect, useId, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { ViewportWaveform } from '@/components/audio/ViewportWaveform'
import { AuthHello, type AuthHelloKind } from '@/components/auth/AuthHello'
import { useSession } from '@/components/auth/session-context'
import { LogoMark } from '@/components/layout/Logo'
import { pickOffensiveLine, useI18n } from '@/lib/i18n'
import { handleFromUsername, profileTitle } from '@/lib/session'
import { waitForSessionUser } from '@/lib/db'
import { getSupabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const NEXT_PATHS = new Set(['/plays', '/daily', '/play', '/profile'])

function destPath() {
  if (typeof window === 'undefined') return '/profile'
  const raw = new URLSearchParams(window.location.search).get('next')
  if (raw && NEXT_PATHS.has(raw)) return raw
  return '/profile'
}

type AuthFieldName = 'username' | 'display' | 'email' | 'password'
type HelloState = { kind: AuthHelloKind; name: string; handle: string }

export function AuthScreen({ mode }: { mode: 'join' | 'login' }) {
  const { t } = useI18n()
  const router = useRouter()
  const { user, join, login } = useSession()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorField, setErrorField] = useState<AuthFieldName | null>(null)
  const [hello, setHello] = useState<HelloState | null>(null)
  const [formBusy, setFormBusy] = useState(false)
  const [created, setCreated] = useState(false)
  const [nextSuffix, setNextSuffix] = useState('')
  const uid = useId()

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('next')
    if (raw && NEXT_PATHS.has(raw)) setNextSuffix(`?next=${encodeURIComponent(raw)}`)
  }, [])

  useEffect(() => {
    if (user && !hello && !formBusy) router.replace(destPath())
  }, [user, hello, router, formBusy])

  useEffect(() => {
    setError(null)
    setErrorField(null)
    setShowPassword(false)
    setFormBusy(false)
    setCreated(false)
  }, [mode])

  const fail = (result: NonNullable<Awaited<ReturnType<typeof join>>>) => {
    const messages = {
      name: t.auth.errorName,
      display: t.auth.errorDisplay,
      offensive: pickOffensiveLine(t.auth.errorOffensive),
      email: t.auth.errorEmail,
      password: t.auth.errorPassword,
      exists: t.auth.errorExists,
      missing: t.auth.errorMissing,
      login: t.auth.errorLogin,
      config: t.auth.errorConfig,
      confirm: t.auth.errorConfirm,
      oauth: t.auth.errorOAuth,
      closed: t.auth.oauthCancel,
      taken: t.auth.errorTaken,
      rate: t.auth.errorRate,
    }
    const fields: Record<typeof result, AuthFieldName | null> = {
      name: 'username',
      display: 'display',
      offensive: 'display',
      email: 'email',
      password: 'password',
      exists: 'email',
      missing: 'email',
      login: 'email',
      config: null,
      confirm: 'email',
      oauth: null,
      closed: null,
      taken: 'username',
      rate: 'email',
    }
    setError(messages[result])
    setErrorField(fields[result])
  }

  const write = (field: AuthFieldName, next: string) => {
    if (field === 'username') setUsername(next.replace(/^@+/, ''))
    if (field === 'display') setDisplayName(next)
    if (field === 'email') setEmail(next)
    if (field === 'password') setPassword(next)
    if (errorField === field) {
      setError(null)
      setErrorField(null)
    }
  }

  const greet = async (kind: AuthHelloKind, fallback?: { name: string; handle: string }) => {
    const db = getSupabase()
    const authUser = db ? (await db.auth.getUser()).data.user : null
    const account = authUser ? await waitForSessionUser(authUser.id, authUser.email ?? '') : null
    if (account) {
      setHello({
        kind,
        name: profileTitle(account),
        handle: account.handle,
      })
      return
    }
    if (fallback) {
      setHello({
        kind,
        name: fallback.name,
        handle: fallback.handle,
      })
      return
    }
    router.push(destPath())
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (formBusy) return
    setFormBusy(true)
    setError(null)
    setErrorField(null)
    const result =
      mode === 'join' ? await join({ username, displayName, email, password }) : await login({ email, password })
    if (result === 'confirm') {
      setCreated(true)
      setFormBusy(false)
      return
    }
    if (result) {
      setFormBusy(false)
      fail(result)
      return
    }
    const handle = username ? handleFromUsername(username) : `@${email.split('@')[0] || 'player'}`
    await greet(mode, {
      name: displayName.trim() || handle,
      handle,
    })
    setFormBusy(false)
  }

  return (
    <section className="auth-screen">
      <div className="auth-mark" aria-hidden>
        <i className="auth-mark-bloom" />
        <LogoMark size={420} className="auth-mark-ghost" />
        <LogoMark size={420} className="auth-mark-core" />
      </div>
      <ViewportWaveform />

      <div className="auth-stage">
        <div className="auth-intro">
          <p className="enter enter-1 m-0 text-xs text-muted-foreground">
            {mode === 'join' ? t.auth.joinKicker : t.auth.signIn}
          </p>
          <h1 className="enter enter-2 display mt-3 mb-0 text-[clamp(40px,8vw,72px)]">
            {mode === 'join' ? t.auth.joinTitle : t.auth.loginTitle}
            <br />
            <em className="text-primary not-italic">
              {mode === 'join' ? t.auth.joinTitleb : t.auth.loginTitleb}
            </em>
          </h1>
          <p className="enter enter-3 mt-5 max-w-md text-[16px] leading-7 text-muted-foreground">
            {mode === 'join' ? t.auth.joinLead : t.auth.loginLead}
          </p>
          {mode === 'join' ? (
            <ul className="enter enter-4 auth-perks">
              <li>{t.auth.benefitPoints}</li>
              <li>{t.auth.benefitBoard}</li>
              <li>{t.auth.benefitLive}</li>
            </ul>
          ) : null}
          <p className="enter enter-5 auth-rule">{t.auth.dailyRule}</p>
        </div>

        <div className="auth-panel">
          {created ? (
            <div className="enter enter-4 auth-created">
              <p className="auth-created-kicker">{t.auth.createdKicker}</p>
              <h2 className="auth-created-title">{t.auth.createdTitle}</h2>
              <p className="auth-created-lead">{t.auth.createdLead}</p>
              <Link href={`/login${nextSuffix}`} className="land-play auth-submit no-underline">
                {t.auth.signIn}
              </Link>
            </div>
          ) : (
          <form className="enter enter-4 auth-form" onSubmit={submit}>
            <div className="auth-fields">
              {mode === 'join' ? (
                <>
                  <AuthField
                    id={`${uid}-username`}
                    name="username"
                    label={t.auth.name}
                    value={username}
                    prefix="@"
                    autoComplete="username"
                    autoCapitalize="off"
                    spellCheck={false}
                    invalid={errorField === 'username'}
                    onChange={(value) => write('username', value)}
                  />
                  <AuthField
                    id={`${uid}-display`}
                    name="name"
                    label={t.auth.displayName}
                    value={displayName}
                    autoComplete="nickname"
                    invalid={errorField === 'display'}
                    describedBy={`${uid}-display-hint`}
                    onChange={(value) => write('display', value)}
                  />
                  <p id={`${uid}-display-hint`} className="auth-hint">
                    {t.auth.displayHint}
                  </p>
                </>
              ) : null}
              <AuthField
                id={`${uid}-email`}
                name="email"
                type="email"
                label={t.auth.email}
                value={email}
                autoComplete="email"
                invalid={errorField === 'email'}
                onChange={(value) => write('email', value)}
              />
              <AuthField
                id={`${uid}-password`}
                name="password"
                type={showPassword ? 'text' : 'password'}
                label={t.auth.password}
                value={password}
                autoComplete={mode === 'join' ? 'new-password' : 'current-password'}
                invalid={errorField === 'password'}
                describedBy={mode === 'join' ? `${uid}-password-hint` : undefined}
                onChange={(value) => write('password', value)}
              >
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPassword((open) => !open)}
                  aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </AuthField>
              {mode === 'join' ? (
                <p id={`${uid}-password-hint`} className="auth-hint">
                  {t.auth.passwordPh}
                </p>
              ) : null}
            </div>
            {error ? <p className="auth-error">{error}</p> : null}
            <button type="submit" className="land-play auth-submit" disabled={formBusy}>
              {formBusy
                ? mode === 'join'
                  ? t.auth.creating
                  : t.auth.signingIn
                : mode === 'join'
                  ? t.auth.submit
                  : t.auth.loginSubmit}
            </button>
          </form>
          )}

          <div className="enter enter-7 auth-links">
            <Link href="/daily">{t.auth.playFree}</Link>
            {mode === 'join' ? (
              <p>
                {t.auth.hasAccount} <Link href={`/login${nextSuffix}`}>{t.auth.signIn}</Link>
              </p>
            ) : (
              <p>
                {t.auth.noAccount} <Link href={`/join${nextSuffix}`}>{t.auth.create}</Link>
              </p>
            )}
          </div>
        </div>
      </div>

      <AuthHello
        open={Boolean(hello)}
        kind={hello?.kind ?? 'login'}
        name={hello?.name ?? ''}
        handle={hello?.handle}
        onDone={() => {
          setHello(null)
          router.push(destPath())
        }}
      />
    </section>
  )
}

function AuthField({
  id,
  name,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  autoCapitalize,
  spellCheck,
  prefix,
  invalid,
  describedBy,
  children,
}: {
  id: string
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
  autoCapitalize?: string
  spellCheck?: boolean
  prefix?: string
  invalid?: boolean
  describedBy?: string
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'auth-field',
        value && 'is-filled',
        prefix && 'has-prefix',
        children && 'has-action',
        invalid && 'is-error',
      )}
    >
      {prefix ? (
        <span className="auth-field-prefix" aria-hidden>
          {prefix}
        </span>
      ) : null}
      <input
        id={id}
        name={name}
        type={type}
        placeholder=" "
        value={value}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        spellCheck={spellCheck}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
      />
      <label htmlFor={id} className="auth-field-label">
        {label}
      </label>
      {children}
    </div>
  )
}
