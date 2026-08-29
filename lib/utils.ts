import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number, locale: 'en' | 'pt') {
  return value.toLocaleString(locale === 'pt' ? 'pt-BR' : 'en-US')
}
