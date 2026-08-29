export type FriendStatus = 'none' | 'sent' | 'incoming' | 'friends'

export function friendStatus(
  user: { friends?: string[]; outgoing?: string[]; incoming?: string[] } | null | undefined,
  id: string,
): FriendStatus {
  if (!user) return 'none'
  if ((user.friends ?? []).includes(id)) return 'friends'
  if ((user.incoming ?? []).includes(id)) return 'incoming'
  if ((user.outgoing ?? []).includes(id)) return 'sent'
  return 'none'
}
