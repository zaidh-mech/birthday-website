/**
 * Default words for the interactive parts of the site.
 *
 * Everything here can be changed without touching code from
 * Admin Studio → "Site & Games" (saved to the cloud), or edited right here.
 */

export interface Coupon {
  id: string
  emoji: string
  title: string
  description: string
}

export interface WheelPrize {
  id: string
  emoji: string
  label: string
  detail: string
}

export interface SiteConfig {
  /** What the site calls her in greetings. Leave empty to rotate through nicknames. */
  herName: string
  /** How he signs off. */
  fromName: string
  /** YYYY-MM-DD — when you got together. Powers the live "together for…" counter. Empty hides it. */
  anniversaryDate: string
  /** YYYY-MM-DD — her birthday (year optional, e.g. 2000-05-14). Powers the birthday countdown. Empty hides it. */
  birthdayDate: string
  /** Shown in headlines like "Happy 5 Years". */
  yearsTogether: number
  nicknames: string[]
  reasons: string[]
  coupons: Coupon[]
  wheelPrizes: WheelPrize[]
  /** 5-letter words for the Secret Word game (letters only). */
  secretWords: string[]
  /** International format without "+" — used for WhatsApp links (RSVP, coupon redemptions). */
  whatsappNumber: string
}

export const DEFAULT_NICKNAMES = ['baby', 'baba', 'sweetheart', 'cutie', 'bubby']

export const DEFAULT_REASONS = [
  'The way your whole face lights up when you laugh.',
  'You make ordinary days feel like little adventures.',
  'You believe in me even when I forget to believe in myself.',
  'How safe and at home I feel when I am next to you.',
  'Your kindness — to me, to everyone, to stray cats.',
  'You remember the tiny things I say and surprise me with them later.',
  'The cute, sleepy voice you have in the morning.',
  'You are my favourite person to do absolutely nothing with.',
  'You make me want to be a better man every single day.',
  'Your hugs fix things words can\'t.',
  'The way you look at me when you think I am not looking.',
  'You are strong, even on the days you feel like you are not.',
  'You turn my bad days around with one message.',
  'Your terrible jokes that somehow always make me laugh.',
  'You are beautiful — on the inside even more than the outside.',
  'Every plan sounds better when it has you in it.',
  'You chose me, and you keep choosing me.',
  'Five years in and you still give me butterflies.',
  'The way you care for your family.',
  'Your patience with me (I know I test it).',
  'You make every place feel like home.',
  'Because you are you — and there is nobody else like you.',
  'Our silly inside jokes that nobody else understands.',
  'I can be completely myself around you.',
]

export const DEFAULT_COUPONS: Coupon[] = [
  { id: 'breakfast', emoji: '🥞', title: 'Breakfast in Bed', description: 'Your favourite breakfast, served to you. No getting up allowed.' },
  { id: 'movie', emoji: '🎬', title: 'You Pick the Movie', description: 'Any movie, any genre. Zero complaints from me. Snacks included.' },
  { id: 'massage', emoji: '💆‍♀️', title: '30-Minute Massage', description: 'Shoulders, back, feet — your choice. Redeemable anytime.' },
  { id: 'dessert', emoji: '🍰', title: 'Dessert Date', description: 'I take you out for whatever sweet thing you are craving.' },
  { id: 'win', emoji: '🏳️', title: 'Win Any Argument', description: 'Use this to instantly win one argument. I will say "you\'re right" and mean it.' },
  { id: 'hug', emoji: '🤗', title: 'Unlimited Hugs Day', description: 'One full day of hugs on demand. Valid forever.' },
  { id: 'drive', emoji: '🚗', title: 'Late Night Drive', description: 'Music on, windows down, your playlist only.' },
  { id: 'chores', emoji: '🧺', title: 'I\'ll Do It', description: 'Hand me any one chore or errand and consider it done.' },
  { id: 'surprise', emoji: '🎁', title: 'Mystery Surprise', description: 'Redeem it and wait… something special is coming your way.' },
]

export const DEFAULT_WHEEL_PRIZES: WheelPrize[] = [
  { id: 'kiss', emoji: '💋', label: '10 Kisses', detail: 'Redeemable at our next date. No negotiations.' },
  { id: 'icecream', emoji: '🍦', label: 'Ice Cream Run', detail: 'I owe you your favourite ice cream, extra toppings.' },
  { id: 'compliment', emoji: '🌹', label: 'Compliment Shower', detail: 'Ask me for 10 compliments and I will deliver them in person.' },
  { id: 'picnic', emoji: '🧺', label: 'Picnic Date', detail: 'A cute little picnic, planned by me, wherever you want.' },
  { id: 'song', emoji: '🎤', label: 'I Sing for You', detail: 'One song, sung terribly but with all my heart.' },
  { id: 'photo', emoji: '📸', label: 'Photo Day', detail: 'A whole date where I am your personal photographer.' },
  { id: 'cook', emoji: '🍝', label: 'I Cook Dinner', detail: 'Chef babyboy is in the kitchen tonight.' },
  { id: 'wish', emoji: '🌠', label: 'One Wish', detail: 'Anything you want (within reason… mostly).' },
  { id: 'shopping', emoji: '🛍️', label: 'Shopping Trip', detail: 'I carry the bags and say everything looks amazing on you.' },
  { id: 'cuddle', emoji: '🧸', label: 'Cuddle Session', detail: 'An hour of cuddles, phones away.' },
]

export const DEFAULT_SECRET_WORDS = [
  'HEART', 'SMILE', 'CUTIE', 'BUBBY', 'HONEY', 'SWEET', 'ADORE', 'BLISS', 'CHARM', 'DREAM',
  'ANGEL', 'PEACH', 'CANDY', 'TEDDY', 'SUGAR', 'ROSES', 'STARS', 'BLUSH', 'FLIRT', 'TULIP',
  'MAGIC', 'DANCE', 'PARTY', 'GIFTS', 'CAKES',
]

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  herName: '',
  fromName: 'Your babyboy',
  anniversaryDate: '',
  birthdayDate: '',
  yearsTogether: 5,
  nicknames: DEFAULT_NICKNAMES,
  reasons: DEFAULT_REASONS,
  coupons: DEFAULT_COUPONS,
  wheelPrizes: DEFAULT_WHEEL_PRIZES,
  secretWords: DEFAULT_SECRET_WORDS,
  whatsappNumber: '94741999926',
}
