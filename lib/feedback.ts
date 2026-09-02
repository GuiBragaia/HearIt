import { getSupabase } from '@/lib/supabase'

export const FEEDBACK_MIN_POINTS = 5000
export const FEEDBACK_MIN_CHARS = 12
export const FEEDBACK_MAX_CHARS = 800

export type FeedbackKind = 'note' | 'idea'
export type FeedbackError = 'auth' | 'points' | 'body' | 'rate' | 'config' | 'fail'

export async function submitFeedback(kind: FeedbackKind, body: string): Promise<FeedbackError | null> {
  const note = body.trim()
  if (note.length < FEEDBACK_MIN_CHARS || note.length > FEEDBACK_MAX_CHARS) return 'body'
  const db = getSupabase()
  if (!db) return 'config'
  const { error } = await db.rpc('submit_feedback', { p_kind: kind, p_body: note })
  if (!error) return null
  const msg = (error.message ?? '').toLowerCase()
  if (msg.includes('auth')) return 'auth'
  if (msg.includes('points')) return 'points'
  if (msg.includes('rate')) return 'rate'
  if (msg.includes('body') || msg.includes('kind')) return 'body'
  return 'fail'
}
