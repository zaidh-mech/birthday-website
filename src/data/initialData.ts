export interface Letter {
  id: string
  title: string
  content: string
  occasion: string
  date: string
}

export interface Memory {
  id: string
  title: string
  imagePath: string
  caption: string
  date: string
}

export const initialLetters: Letter[] = [
  {
    id: 'letter-1',
    title: 'Happy 5 Years & Happy Birthday, My Love',
    occasion: 'Anniversary & Birthday',
    date: new Date().toISOString(),
    content: `Happy 5 Years & Happy Birthday! 🎉\n\nI wanted to create something special, a little corner of the world that exists just for you. Every moment of the past 5 years we have spent together has made life brighter and warmer.\n\nThank you for being yourself, for your laughter, and for all the little everyday adventures over these 5 beautiful years. I hope this year brings you as much happiness, peace, and excitement as you bring to everyone around you.\n\nWith all my love, always.`
  },
  {
    id: 'letter-2',
    title: 'A Little Reminder',
    occasion: 'Just Because',
    date: new Date(Date.now() - 86400000 * 7).toISOString(),
    content: `Just in case you needed a reminder today: you are capable of extraordinary things.\n\nNever forget how resilient you are, and how much you inspire me every single day. Keep shining.`
  }
]

export const initialMemories: Memory[] = [
  {
    id: 'memory-1',
    title: 'Starry Night',
    imagePath: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    caption: 'Underneath a sky full of stars and endless dreams.',
    date: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 'memory-2',
    title: 'Golden Hour Moments',
    imagePath: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    caption: 'Sunsets that remind us of how beautiful simple days can be.',
    date: new Date(Date.now() - 86400000 * 60).toISOString()
  }
]
