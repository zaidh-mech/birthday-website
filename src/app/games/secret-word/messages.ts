/**
 * Little love notes for each secret word. Every default word in
 * src/data/love.ts (DEFAULT_SECRET_WORDS) has its own line; custom words
 * added from the admin studio fall back to a generic sweet line.
 */
export const WORD_MESSAGES: Record<string, string> = {
  HEART: 'You have all of mine.',
  SMILE: 'Yours is my favourite thing in the world.',
  CUTIE: 'Also known as: you. Obviously.',
  BUBBY: "That's you. Always you.",
  HONEY: "Sweeter than honey, and that's just your good-morning texts.",
  SWEET: "Just like you, the sweetest person I've ever known.",
  ADORE: 'Which is exactly what I do. Every single day.',
  BLISS: "Lazy days next to you. That's what bliss means to me.",
  CHARM: 'You charmed me five years ago and you still do, every day.',
  DREAM: "You're the dream I never want to wake up from.",
  ANGEL: 'My angel, my favourite person, my home.',
  PEACH: "You're a peach. A cute, sweet, perfect little peach.",
  CANDY: 'Every moment with you is a little treat.',
  TEDDY: 'Your favourite cuddle buddy… after me, of course.',
  SUGAR: 'Sugar, spice and everything you.',
  ROSES: "I'd fill every room you walk into with roses.",
  STARS: "I'd pull every single one down for you.",
  BLUSH: 'Made you blush? Good. That was the plan all along.',
  FLIRT: 'Five years in and I still flirt with you like day one.',
  TULIP: 'Soft, bright and lovely. Just like you.',
  MAGIC: "That's what being with you feels like.",
  DANCE: 'Kitchen dances with you are my favourite dates.',
  PARTY: "It's your birthday, so the whole week is a party.",
  GIFTS: 'The best gift I ever got is you.',
  CAKES: 'Birthday cake for the birthday girl, and the first slice is yours.',
}

export function getWordMessage(word: string): string {
  return WORD_MESSAGES[word.toUpperCase()] ?? 'Another little piece of us, and you found it. I love you.'
}

/** Win headline, depending on how quickly she solved it. */
export function winTitle(tries: number, name: string): string {
  const n = name ? `, ${name}` : ''
  switch (tries) {
    case 1:
      return 'First try?! 🤯'
    case 2:
      return `Genius${n}!`
    case 3:
      return `Brilliant${n}!`
    case 4:
      return `You got it${n}!`
    case 5:
      return `Nicely done${n}!`
    default:
      return 'Phew, just in time!'
  }
}

const LOSE_LINES = [
  "Don't worry, you'll always be my winner.",
  "That one was tricky. You're still the smartest girl I know.",
  'Words are hard. Loving you is the easiest thing I do.',
  "No word could ever beat you anyway.",
]

export function loseLine(seed: number): string {
  return LOSE_LINES[Math.abs(Math.floor(seed)) % LOSE_LINES.length]
}

/** Picks what to call her: her name if set, otherwise one of her nicknames. */
export function pickName(herName: string, nicknames: readonly string[], random: () => number = Math.random): string {
  if (herName.trim()) return herName.trim()
  if (nicknames.length === 0) return 'my love'
  return nicknames[Math.floor(random() * nicknames.length)]
}
