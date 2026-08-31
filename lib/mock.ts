export type Song = {
  id: string
  title: string
  artist: string
  aliases: string[]
  deezerId?: number
}

export type LeaderboardRow = {
  id: string
  name: string
  handle?: string
  photo?: string
  initials?: string
  score: number
  time: number
  streak: number
  you?: boolean
  region: 'global' | 'friends'
}

export type AchievementId =
  | 'perfect-ear'
  | 'lightning'
  | 'music-nerd'
  | 'unstoppable'
  | 'no-mercy'
  | 'never-give-up'

export type Achievement = {
  id: AchievementId
  unlocked: boolean
}

export const catalog: Song[] = [
  {
    id: 'everybody-wants-to-rule-the-world',
    title: 'Everybody Wants to Rule the World',
    artist: 'Tears for Fears',
    aliases: ['everybody wants to rule', 'rule the world', 'everybody wants to rule the world'],
  },
  { id: 'blinding-lights', title: 'Blinding Lights', artist: 'The Weeknd', aliases: ['blinding light', 'blinding'] },
  { id: 'midnight-city', title: 'Midnight City', artist: 'M83', aliases: ['midnight'] },
  { id: 'instant-crush', title: 'Instant Crush', artist: 'Daft Punk', aliases: [] },
  { id: 'electric-feel', title: 'Electric Feel', artist: 'MGMT', aliases: [] },
  { id: 'less-i-know', title: 'The Less I Know The Better', artist: 'Tame Impala', aliases: ['the less i know'] },
  { id: 'somebody-else', title: 'Somebody Else', artist: 'The 1975', aliases: [] },
  { id: 'levitating', title: 'Levitating', artist: 'Dua Lipa', aliases: [] },
  { id: 'bad-habit', title: 'Bad Habit', artist: 'Steve Lacy', aliases: [] },
  { id: 'toxicity', title: 'Toxicity', artist: 'System Of A Down', aliases: [] },
  { id: 'sweet-disposition', title: 'Sweet Disposition', artist: 'The Temper Trap', aliases: [] },
  { id: 'around-the-world', title: 'Around the World', artist: 'Daft Punk', aliases: [] },
  { id: 'nightcall', title: 'Nightcall', artist: 'Kavinsky', aliases: [] },
  { id: 'time-to-dance', title: 'Time to Dance', artist: 'The Sounds', aliases: [] },
  { id: 'take-on-me', title: 'Take On Me', artist: 'a-ha', aliases: ['take on me'] },
  { id: 'feel-good-inc', title: 'Feel Good Inc.', artist: 'Gorillaz', aliases: ['feel good inc'] },
  {
    id: 'bones',
    title: 'Bones',
    artist: 'Imagine Dragons',
    aliases: ['bones imagine dragons', 'imagine dragons bones', 'bone'],
  },
  {
    id: 'smells-like-teen-spirit',
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    aliases: [
      'smell like teen spirit',
      'smell like a teen spirit',
      'smells like a teen spirit',
      'teen spirit',
      'smells like teen spirit nirvana',
    ],
  },
  {
    id: 'i-want-it-that-way',
    title: 'I Want It That Way',
    artist: 'Backstreet Boys',
    aliases: [
      'i wanna it that way',
      'i want it that way',
      'want it that way',
      'i want it that way backstreet boys',
    ],
  },
  {
    id: 'scream-and-shout',
    title: 'Scream & Shout',
    artist: 'Britney Spears',
    deezerId: 62439051,
    aliases: [
      'scream and shout',
      'scream shout',
      'scream and shout britney',
      'scream and shout britney spears',
      'scream and shout will i am',
      'scream and shout will.i.am',
    ],
  },
]
