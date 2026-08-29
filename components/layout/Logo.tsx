import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Waveform bars that read as H I — (H)ear (I)t */
export function LogoMark({ className, size = 30 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
    >
      <title>hear it</title>
      <rect x="2.2" y="7" width="2.6" height="18" rx="1.3" fill="var(--primary)" />
      <rect x="5.3" y="8.6" width="2.2" height="14.8" rx="1.1" fill="var(--primary)" opacity="0.82" />
      <rect x="8.4" y="13.2" width="2.2" height="5.6" rx="1.1" fill="var(--primary)" />
      <rect x="11.1" y="12" width="2.4" height="8" rx="1.2" fill="var(--primary)" />
      <rect x="14" y="13.2" width="2.2" height="5.6" rx="1.1" fill="var(--primary)" />
      <rect x="17.1" y="8.6" width="2.2" height="14.8" rx="1.1" fill="var(--primary)" opacity="0.82" />
      <rect x="19.8" y="7" width="2.6" height="18" rx="1.3" fill="var(--primary)" />
      <rect x="26" y="7" width="3.2" height="18" rx="1.5" fill="var(--primary)" />
    </svg>
  )
}

export function Logo({ href = '/', className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn('logo', className)} aria-label="hear it">
      <LogoMark />
      <span className="logo-word">
        hear <em>it</em>
      </span>
    </Link>
  )
}
