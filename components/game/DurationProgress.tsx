'use client'

import { CLIP_LENGTHS, formatDuration } from '@/lib/game'
import { cn } from '@/lib/utils'

export function DurationProgress({ level }: { level: number }) {
  return (
    <div className="flex w-full items-center gap-1 overflow-hidden" aria-label="Clip duration">
      {CLIP_LENGTHS.map((clip, index) => (
        <span
          key={clip}
          className={cn(
            'mono flex-1 rounded-sm px-1 py-1.5 text-center text-[9px] sm:text-[10px]',
            index < level && 'bg-[#829d35] text-[#12180d]',
            index === level && 'bg-primary text-primary-foreground shadow-[0_0_16px_rgba(200,243,90,0.35)]',
            index > level && 'bg-[#10140f] text-[#5f6758]',
          )}
        >
          {formatDuration(clip)}
        </span>
      ))}
    </div>
  )
}
