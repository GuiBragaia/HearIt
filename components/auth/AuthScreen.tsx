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
import { profileTitle } from '@/lib/session'
import { loadSessionUser } from '@/lib/db'
import { getSupabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type AuthFieldName = 'username' | 'display' | 'email' | 'password'
type HelloState = { kind: AuthHelloKind; name: string; handle: string }

export function AuthScreen({ mode }: { mode: 'join' | 'login' }) {
  const { t } = useI18n()
  const router = useRouter()
  const { user, join, login, joinWith } = useSession()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorField, setErrorField] = useState<AuthFieldName | null>(null)
  const [hello, setHello] = useState<HelloState | null>(null)
  const uid = useId()

  useEffect(() => {
    if (user && !hello) router.replace('/profile')
  }, [user, hello, router])

  useEffect(() => {
    setError(null)
    setErrorField(null)
    setShowPassword(false)
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

  const greet = async (kind: AuthHelloKind) => {
    const db = getSupabase()
    const authUser = db ? (await db.auth.getUser()).data.user : null
    const account = authUser ? await loadSessionUser(authUser.id, authUser.email ?? '') : null
    if (!account) {
      router.push('/profile')
      return
    }
    setHello({
      kind,
      name: profileTitle(account),
      handle: account.handle,
    })
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const result =
      mode === 'join' ? await join({ username, displayName, email, password }) : await login({ email, password })
    if (result) {
      fail(result)
      return
    }
    await greet(mode)
  }

  const social = async (provider: 'apple' | 'google') => {
    const result = await joinWith(provider)
    if (result) fail(result)
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
          <div className="enter enter-4 auth-social">
            <button type="button" className="auth-apple" onClick={() => social('apple')}>
              <AppleMark />
              {t.auth.continueApple}
            </button>
            <button type="button" className="auth-google" onClick={() => social('google')}>
              <GoogleMark />
              {t.auth.continueGoogle}
            </button>
          </div>

          <p className="enter enter-5 auth-or">
            <span>{t.auth.orEmail}</span>
          </p>

          <form className="enter enter-6 auth-form" onSubmit={submit}>
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
            <button type="submit" className="land-play auth-submit">
              {mode === 'join' ? t.auth.submit : t.auth.loginSubmit}
            </button>
          </form>

          <div className="enter enter-7 auth-links">
            <Link href="/daily">{t.auth.playFree}</Link>
            {mode === 'join' ? (
              <p>
                {t.auth.hasAccount} <Link href="/login">{t.auth.signIn}</Link>
              </p>
            ) : (
              <p>
                {t.auth.noAccount} <Link href="/join">{t.auth.create}</Link>
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
          router.push('/profile')
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

function AppleMark() {
  return (
    <svg width="15" height="18" viewBox="0 0 14 17" aria-hidden>
      <path
        fill="currentColor"
        d="M11.4 8.9c0-2 1.6-3 1.7-3.1-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.7-.7-1.4 0-2.7.8-3.4 2.1-1.5 2.5-.4 6.3 1 8.3.7 1 1.5 2.1 2.6 2.1 1 0 1.4-.7 2.7-.7s1.6.7 2.7.7c1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.2s-2.1-.8-2.3-3.6Zm-2.2-6.4c.6-.7 1-1.7.9-2.7-1 .1-2.1.7-2.8 1.5-.6.7-1.1 1.7-.9 2.6 1 0 2-.6 2.8-1.4Z"
      />
    </svg>
  )
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.8 2-1.8 2.6v2.1h2.9c1.7-1.6 2.7-3.9 2.7-6.3Z" />
      <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.1c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.2C2.4 16.1 5.5 18 9 18Z" />
      <path fill="#FBBC05" d="M3.9 10.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V5H.9C.3 6.2 0 7.6 0 9s.3 2.8.9 4l3-2.2Z" />
      <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.5-2.5C13.5.9 11.4 0 9 0 5.5 0 2.4 1.9.9 5l3 2.2C4.6 5.2 6.6 3.6 9 3.6Z" />
    </svg>
  )
}
