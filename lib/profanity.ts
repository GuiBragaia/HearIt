const SHORT = new Set([
  'ass',
  'cock',
  'cu',
  'cunt',
  'dick',
  'fck',
  'fcuk',
  'fdp',
  'fuck',
  'fuk',
  'fvck',
  'kct',
  'krl',
  'nazi',
  'pau',
  'porn',
  'pqp',
  'puta',
  'puto',
  'sex',
  'shit',
  'slut',
  'vsf',
  'vtnc',
])

const LONG = [
  'arrombado',
  'asshole',
  'bastard',
  'bicha',
  'bitch',
  'bosta',
  'buceta',
  'cacete',
  'caralho',
  'crioulo',
  'cuzao',
  'desgracado',
  'desgraca',
  'faggot',
  'filhadaputa',
  'filhodaputa',
  'hitler',
  'merda',
  'mongoloide',
  'nigga',
  'nigger',
  'otario',
  'pinto',
  'porra',
  'pussy',
  'putinha',
  'retard',
  'retardado',
  'viado',
  'whore',
  'xoxota',
]

function fold(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[@4àáâã]/g, 'a')
    .replace(/[0òóôõ]/g, 'o')
    .replace(/[1!íìî]/g, 'i')
    .replace(/[3éèê]/g, 'e')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/ç/g, 'c')
}

function letters(value: string) {
  return fold(value).replace(/[^a-z]/g, '')
}

function tokens(value: string) {
  return fold(value)
    .replace(/[^a-z]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

export function isOffensiveName(value: string) {
  const compact = letters(value)
  if (!compact) return false
  if (SHORT.has(compact) || LONG.includes(compact)) return true
  if (tokens(value).some((token) => SHORT.has(token) || LONG.includes(token))) return true
  return LONG.some((word) => compact.includes(word))
}
