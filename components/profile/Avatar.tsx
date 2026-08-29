import { cn } from '@/lib/utils'

export function Avatar({
  src,
  initials,
  size = 'md',
  className,
}: {
  src?: string
  initials: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  return (
    <span className={cn('profile-photo', src && 'has-img', size !== 'md' && `is-${size}`, className)}>
      {src ? <img src={src} alt="" /> : <span>{initials}</span>}
      <i aria-hidden />
    </span>
  )
}
