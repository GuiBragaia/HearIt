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
  rank: number
  you?: boolean
  region: 'global' | 'friends'
}

export type AchievementId =
  | 'first-blood'
  | 'perfect-ear'
  | 'lightning'
  | 'ten-club'
  | 'never-give-up'
  | 'week-streak'
  | 'sharp'
  | 'music-nerd'
  | 'echo'
  | 'no-mercy'
  | 'century'
  | 'clutch-ten'
  | 'unstoppable'
  | 'one-shot-king'
  | 'two-hundred'
  | 'gold-ear'
  | 'ghost-ear'
  | 'year-one'
  | 'mythic'
  | 'vinyl'

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
  {
    id: 'mulher-de-fases',
    title: 'Mulher de Fases',
    artist: 'Raimundos',
    deezerId: 761220,
    aliases: [
      'mulher de fases',
      'mulher de fase',
      'mulher das fases',
      'mulher de fases raimundos',
      'raimundos mulher de fases',
    ],
  },
  {
    id: 'serenata-existencialista',
    title: 'Serenata Existencialista',
    artist: 'O Grilo',
    deezerId: 437561702,
    aliases: [
      'serenata existencialista',
      'serenata existencialista o grilo',
      'o grilo serenata existencialista',
      'serenata existencial',
    ],
  },
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
    id: 'lithium',
    title: 'Lithium',
    artist: 'Nirvana',
    deezerId: 13791934,
    aliases: ['lithium nirvana', 'nirvana lithium'],
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
  {
    id: 'back-to-black',
    title: 'Back To Black',
    artist: 'Amy Winehouse',
    deezerId: 2176856,
    aliases: [
      'back to black',
      'back 2 black',
      'back to black amy',
      'back to black amy winehouse',
      'back to black winehouse',
    ],
  },
  {
    id: 'she-wolf',
    title: 'She Wolf',
    artist: 'Shakira',
    deezerId: 3018798101,
    aliases: [
      'she wolf',
      'shewolf',
      'loba',
      'she wolf shakira',
      'loba shakira',
    ],
  },
  {
    id: 'gummy-bear',
    title: 'I Am a Gummy Bear',
    artist: 'Gummibär',
    deezerId: 3241542621,
    aliases: [
      'i am a gummy bear',
      'i am gummy bear',
      "i'm a gummy bear",
      'im a gummy bear',
      'gummy bear',
      'the gummy bear song',
      'ursinho gummy',
      'osito gominola',
      'eu sou o gummy bear',
    ],
  },
  {
    id: 'andei-so',
    title: 'Andei Só',
    artist: 'Natiruts',
    deezerId: 518473662,
    aliases: [
      'andei so',
      'andei só',
      'andei so natiruts',
      'andei só natiruts',
      'andei sozinho',
    ],
  },
  {
    id: 'killer-queen',
    title: 'Killer Queen',
    artist: 'Queen',
    deezerId: 4091936641,
    aliases: ['killer queen queen', 'queen killer queen'],
  },
  {
    id: 'hey-jude',
    title: 'Hey Jude',
    artist: 'The Beatles',
    deezerId: 126848613,
    aliases: ['hey jude beatles', 'heyjude'],
  },
  {
    id: 'the-chain',
    title: 'The Chain',
    artist: 'Fleetwood Mac',
    deezerId: 63480992,
    aliases: ['the chain fleetwood mac', 'chain fleetwood', 'the chain fleetwood'],
  },
  {
    id: 'back-in-black',
    title: 'Back in Black',
    artist: 'AC/DC',
    deezerId: 92720046,
    aliases: [
      'back in black',
      'back in black acdc',
      'back in black ac/dc',
      'back to black acdc',
    ],
  },
  {
    id: 'alright',
    title: 'Alright',
    artist: 'Kendrick Lamar',
    deezerId: 97206068,
    aliases: ['all right', 'alright kendrick', 'kendrick alright', 'alright kendrick lamar'],
  },
  {
    id: 'bye-bye-bye',
    title: 'Bye Bye Bye',
    artist: '*NSYNC',
    deezerId: 632447,
    aliases: [
      'bye bye',
      'bye bye bye',
      'bye bye bye nsync',
      'bye bye nsync',
      'nsync bye bye bye',
    ],
  },
  {
    id: 'judas',
    title: 'Judas',
    artist: 'Lady Gaga',
    deezerId: 11747933,
    aliases: ['judas lady gaga', 'lady gaga judas', 'judas gaga'],
  },
  {
    id: 'borboletas',
    title: 'Borboletas',
    artist: 'Victor & Leo',
    deezerId: 13245343,
    aliases: [
      'borboletas',
      'borboletas victor e leo',
      'borboletas victor & leo',
      'victor e leo borboletas',
      'victor leo borboletas',
    ],
  },
  {
    id: 'night-fever',
    title: 'Night Fever',
    artist: 'Bee Gees',
    deezerId: 405255092,
    aliases: [
      'night fever',
      'night fever bee gees',
      'night fever beegees',
      'bee gees night fever',
      'bee gee night fever',
    ],
  },
  {
    id: 'dont-stop-the-music',
    title: "Don't Stop The Music",
    artist: 'Rihanna',
    deezerId: 925108,
    aliases: [
      'dont stop the music',
      "don't stop the music",
      'dont stop the music rihanna',
      "don't stop the music rihanna",
      'rihanna dont stop the music',
    ],
  },
  {
    id: 'glamorous',
    title: 'Glamorous',
    artist: 'Fergie',
    deezerId: 882293,
    aliases: [
      'glamorous',
      'glamorous fergie',
      'fergie glamorous',
      'glamorous ludacris',
      'glamorous fergie ludacris',
    ],
  },
  {
    id: 'metamorfose-ambulante',
    title: 'Metamorfose Ambulante',
    artist: 'Raul Seixas',
    deezerId: 4676600,
    aliases: [
      'metamorfose ambulante',
      'metamorfoso ambulante',
      'metamorfose ambulante raul seixas',
      'raul seixas metamorfose ambulante',
      'maluco beleza metamorfose',
    ],
  },
  {
    id: 'aluga-se',
    title: 'Aluga-se',
    artist: 'Titãs',
    deezerId: 36362641,
    aliases: [
      'aluga-se',
      'aluga se',
      'alugase',
      'aluga-se titas',
      'aluga-se titãs',
      'titas aluga-se',
      'titãs aluga-se',
    ],
  },
  {
    id: 'duality',
    title: 'Duality',
    artist: 'Slipknot',
    deezerId: 3819908,
    aliases: ['duality', 'duality slipknot', 'slipknot duality'],
  },
  {
    id: 'break-stuff',
    title: 'Break Stuff',
    artist: 'Limp Bizkit',
    deezerId: 94613616,
    aliases: [
      'break stuff',
      'breakstuff',
      'break stuff limp bizkit',
      'limp bizkit break stuff',
    ],
  },
  {
    id: 'rock-that-body',
    title: 'Rock That Body',
    artist: 'Black Eyed Peas',
    deezerId: 4619463,
    aliases: [
      'rock that body',
      'rock that body black eyed peas',
      'black eyed peas rock that body',
      'the black eyed peas rock that body',
    ],
  },
  {
    id: 'rhinestone-eyes',
    title: 'Rhinestone Eyes',
    artist: 'Gorillaz',
    deezerId: 5490693,
    aliases: [
      'rhinestone eyes',
      'rhynestone',
      'rhinestone',
      'rhinestone eyes gorillaz',
      'gorillaz rhinestone eyes',
    ],
  },
  {
    id: 'like-him',
    title: 'Like Him',
    artist: 'Tyler, The Creator',
    deezerId: 3064010401,
    aliases: [
      'like him',
      'like him tyler',
      'like him tyler the creator',
      'tyler the creator like him',
      'like him lola young',
    ],
  },
  {
    id: 'blue-da-ba-dee',
    title: 'Blue (Da Ba Dee)',
    artist: 'Eiffel 65',
    deezerId: 89629797,
    aliases: [
      'blue',
      'blue da ba dee',
      "i'm blue",
      'im blue',
      'da ba dee',
      'blue eiffel 65',
      'eiffel 65 blue',
    ],
  },
  {
    id: 'welcome-to-the-jungle',
    title: 'Welcome To The Jungle',
    artist: "Guns N' Roses",
    deezerId: 518457252,
    aliases: [
      'welcome to the jungle',
      'welcome to the jungle guns n roses',
      'welcome to the jungle gnr',
      'guns n roses welcome to the jungle',
      'guns and roses welcome to the jungle',
    ],
  },
]
