'use client'

import { useI18n } from '@/lib/i18n'

export function Pager({
  page,
  pages,
  onPage,
}: {
  page: number
  pages: number
  onPage: (next: number) => void
}) {
  const { t } = useI18n()
  if (pages <= 1) return null
  return (
    <div className="profile-pager">
      <button type="button" disabled={page <= 0} onClick={() => onPage(page - 1)}>
        {t.profile.pagerPrev}
      </button>
      <span>
        {page + 1} / {pages}
      </span>
      <button type="button" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
        {t.profile.pagerNext}
      </button>
    </div>
  )
}