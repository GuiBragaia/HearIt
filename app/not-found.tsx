import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Not found',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <section className="mx-auto w-full max-w-[720px] px-6 pb-24 pt-20">
      <p className="m-0 text-sm text-muted-foreground">404</p>
      <h1 className="display mt-4 mb-0 text-[clamp(40px,8vw,72px)]">This page isn’t here.</h1>
      <p className="mt-5 max-w-md text-muted-foreground">Go back to today’s song and try your ear again.</p>
      <Link
        href="/daily"
        className="mt-8 inline-grid h-11 min-w-[140px] place-items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground no-underline"
      >
        Today’s song
      </Link>
    </section>
  )
}
