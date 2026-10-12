export interface DaySchedule {
  isOpen: boolean
  format: string // e.g. "Grand High Tea Buffet", "Afternoon Tea Platter", "Brunch & Coffee"
  time: string // e.g. "3:00 PM - 6:00 PM"
  price: string // e.g. "LKR 5,500 nett"
  note?: string // Special note for this type of day
}

export interface PlaceScheduleRules {
  daysOpen?: number[] // 0 = Sun, 1 = Mon, ..., 6 = Sat
  weekendDays?: number[] // defaults to [5, 6, 0] (Fri, Sat, Sun) for places with Fri-Sun buffets
  weekday?: DaySchedule
  weekend?: DaySchedule
  customDays?: Record<number, DaySchedule>
  reservationRequired?: boolean
}

export interface Place {
  id: string
  name: string
  subtitle: string
  time: string
  days: string
  price: string
  desc: string
  ambiance: string
  type: string
  image: string
  themeClass: string
  accentClass: string
  buttonClass: string
  scheduleRules?: PlaceScheduleRules
  isCustom?: boolean
}

export const places: Place[] = [
  {
    id: 'churros',
    name: 'The Churros',
    subtitle: 'The Kingsbury Hotel',
    time: '3:00 PM - 6:00 PM',
    days: 'Mon-Thu (Platter), Fri-Sun (Buffet)',
    price: 'LKR 3,800 - 5,500',
    desc: 'Elegant luxury pâtisserie high tea.',
    ambiance: 'Opulent, luxurious, and grand. Gold accents and plush seating make it perfect for a premium celebration.',
    type: 'High Tea',
    image: 'https://pulse.lk/wp-content/uploads/2024/04/Churros-Kingsbury.jpg',
    themeClass: 'bg-[#2A1C14] text-[#F3E5D8]',
    accentClass: 'bg-[#4A3222] text-[#F3E5D8] border-[#8C6D53]',
    buttonClass: 'bg-[#8C6D53] hover:bg-[#A68365] text-white',
    scheduleRules: {
      daysOpen: [0, 1, 2, 3, 4, 5, 6],
      weekendDays: [5, 6, 0], // Fri, Sat, Sun
      weekday: {
        isOpen: true,
        format: 'High Tea Platter Service',
        time: '3:00 PM - 6:00 PM',
        price: 'LKR 3,800 per person',
        note: 'Tiered artisan sweet & savory high tea platter served at your table.'
      },
      weekend: {
        isOpen: true,
        format: 'Grand High Tea Buffet',
        time: '3:00 PM - 6:00 PM',
        price: 'LKR 5,500 nett per person',
        note: 'Weekend High Tea Buffet with live dessert & pastry stations.'
      }
    }
  },
  {
    id: 'mandarina',
    name: 'Mandarina Colombo',
    subtitle: 'Hotel High Tea',
    time: '3:30 PM - 5:30 PM',
    days: 'Fri-Sun (Buffet), Mon-Thu (Platter/A la carte)',
    price: 'LKR 3,500 nett',
    desc: 'Classic hotel high tea with a popular weekend buffet.',
    ambiance: 'Breezy, modern, and comfortable. A relaxing atmosphere with a fantastic view of the city skyline.',
    type: 'High Tea Buffet',
    image: 'https://d3tfak2ngprx5z.cloudfront.net/2016/02/Main-Gallery-and-Snippet-image-12.jpg',
    themeClass: 'bg-[#0F172A] text-[#F1F5F9]',
    accentClass: 'bg-[#1E293B] text-[#E2E8F0] border-[#3B82F6]',
    buttonClass: 'bg-[#3B82F6] hover:bg-[#60A5FA] text-white',
    scheduleRules: {
      daysOpen: [0, 1, 2, 3, 4, 5, 6],
      weekendDays: [5, 6, 0], // Fri, Sat, Sun
      weekday: {
        isOpen: true,
        format: 'Weekday Afternoon Platter / A la carte',
        time: '3:30 PM - 5:30 PM',
        price: 'LKR 3,000 approx',
        note: 'Note: Full buffet spread runs Fri–Sun; intimate platter service is available on weekdays.'
      },
      weekend: {
        isOpen: true,
        format: 'Weekend High Tea Buffet',
        time: '3:30 PM - 5:30 PM',
        price: 'LKR 3,500 nett per person',
        note: 'Full weekend buffet with live tea counters and skyline view.'
      }
    }
  },
  {
    id: 'beira',
    name: 'Beira Kitchen',
    subtitle: 'Courtyard by Marriott',
    time: '3:30 PM - 5:30 PM',
    days: 'Daily',
    price: 'LKR 4,300 - 4,500 nett',
    desc: 'Vibrant tea time affair with live action stations & gelato.',
    ambiance: 'Energetic, contemporary, and incredibly fun. Features live cooking stations and an endless gelato bar!',
    type: 'High Tea Buffet',
    image: 'https://cache.marriott.com/is/image/marriotts7prod/cy-cmbcy-beira-kitchen-22484-90801:Wide-Hor?wid=1336&fit=constrain',
    themeClass: 'bg-[#431407] text-[#FFEDD5]',
    accentClass: 'bg-[#7C2D12] text-[#FFEDD5] border-[#F97316]',
    buttonClass: 'bg-[#EA580C] hover:bg-[#F97316] text-white',
    scheduleRules: {
      daysOpen: [0, 1, 2, 3, 4, 5, 6],
      weekendDays: [5, 6, 0],
      weekday: {
        isOpen: true,
        format: 'Daily Tea Time Buffet & Gelato Bar',
        time: '3:30 PM - 5:30 PM',
        price: 'LKR 4,300 nett per person',
        note: 'Weekday action stations with hot savories and endless gelato.'
      },
      weekend: {
        isOpen: true,
        format: 'Weekend Grand Tea Time Buffet',
        time: '3:30 PM - 5:30 PM',
        price: 'LKR 4,500 nett per person',
        note: 'Expanded weekend buffet with live cooking stations and dessert bar.'
      }
    }
  },
  {
    id: 'thegrind',
    name: 'The Grind',
    subtitle: 'Coffeehouse',
    time: '8:00 AM - 10:00 PM',
    days: 'Daily',
    price: 'A la carte',
    desc: 'Aesthetic, upscale vibe with specialty coffee & bagels.',
    ambiance: 'Minimalist, earthy, and Pinterest-perfect. The ultimate cozy brunch spot with incredible lighting and artisan bagels.',
    type: 'Brunch/Cafe',
    image: 'https://spiceup.lk/wp-content/uploads/2025/10/instagram-cafe-2-1.jpg',
    themeClass: 'bg-[#FDF8F5] text-[#4A3F35]',
    accentClass: 'bg-[#F2E8E0] text-[#5C4F43] border-[#D1BFAe]',
    buttonClass: 'bg-[#8E7C68] hover:bg-[#A3917C] text-white',
    scheduleRules: {
      daysOpen: [0, 1, 2, 3, 4, 5, 6],
      weekendDays: [6, 0],
      weekday: {
        isOpen: true,
        format: 'All-Day Brunch & Specialty Coffee',
        time: '8:00 AM - 10:00 PM',
        price: 'A la carte (~LKR 2,000 - 3,500)',
        note: 'Artisan bagels, specialty coffees, and cozy intimate vibes.'
      },
      weekend: {
        isOpen: true,
        format: 'Weekend Brunch Specials',
        time: '8:00 AM - 10:00 PM',
        price: 'A la carte (~LKR 2,500 - 4,000)',
        note: 'Lively weekend brunch atmosphere with fresh bakeries.'
      }
    }
  },
  {
    id: 'radicle',
    name: 'Radicle Cafe',
    subtitle: 'Colombo Fort',
    time: '8:00 AM - 6:00 PM',
    days: 'Daily',
    price: 'A la carte',
    desc: 'Tranquil oasis inside a 100+ year-old colonial building.',
    ambiance: 'Historic, peaceful, and artistic. Located in an old colonial building housing an art gallery—perfect for quiet, intimate conversations.',
    type: 'Specialty Cafe',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy2AuPqwbYFZ-hX9v9hDI59OotytuyLSi69_BrU91QQg&s=10',
    themeClass: 'bg-[#1C2C24] text-[#E8EFE9]',
    accentClass: 'bg-[#283D33] text-[#D1DDD5] border-[#557A66]',
    buttonClass: 'bg-[#436452] hover:bg-[#557A66] text-white',
    scheduleRules: {
      daysOpen: [0, 1, 2, 3, 4, 5, 6],
      weekday: {
        isOpen: true,
        format: 'Art Gallery Cafe & Coffee',
        time: '8:00 AM - 6:00 PM',
        price: 'A la carte (~LKR 1,800 - 3,200)',
        note: 'Closes at 6:00 PM. Perfect for a quiet afternoon date.'
      },
      weekend: {
        isOpen: true,
        format: 'Art Gallery Weekend Coffee',
        time: '8:00 AM - 6:00 PM',
        price: 'A la carte (~LKR 1,800 - 3,200)',
        note: 'Quiet weekend atmosphere surrounded by art and heritage architecture.'
      }
    }
  },
  {
    id: 'teaavenue',
    name: 'Tea Avenue',
    subtitle: 'Barnes Place / Jawatte',
    time: '7:00 AM - 11:00 PM',
    days: 'Daily',
    price: 'LKR 1,800 - 3,500',
    desc: 'Upscale, cozy aesthetic perfect for a relaxed Halal brunch.',
    ambiance: 'Highly popular, Muslim-owned café. Features a warm, vibrant aesthetic known for artisanal teas and lavish breakfast platters.',
    type: 'Halal Brunch',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThrQkXVAZtLiK1ZHkUdG7HviCU6nG4Un7ZWpZdfSizHA&s=10',
    themeClass: 'bg-[#1A1C29] text-[#F8F9FA]',
    accentClass: 'bg-[#2A2D40] text-[#E9ECEF] border-[#4A4D60]',
    buttonClass: 'bg-[#E5B300] hover:bg-[#FFC800] text-gray-900',
    scheduleRules: {
      daysOpen: [0, 1, 2, 3, 4, 5, 6],
      weekday: {
        isOpen: true,
        format: 'Halal All-Day Dining & Artisan Tea',
        time: '7:00 AM - 11:00 PM',
        price: 'LKR 1,800 - 3,500 per person',
        note: 'Lavish tea platters, waffles, and full halal food menu.'
      },
      weekend: {
        isOpen: true,
        format: 'Weekend Halal Brunch & High Tea Platters',
        time: '7:00 AM - 11:00 PM',
        price: 'LKR 2,000 - 4,000 per person',
        note: 'Popular weekend brunch spot with cozy corners for two.'
      }
    }
  },
  {
    id: 'javalounge',
    name: 'Java Lounge',
    subtitle: 'Premium Coffeehouse',
    time: '7:00 AM - 10:00 PM',
    days: 'Daily',
    price: 'LKR 1,500 - 3,200',
    desc: 'Spacious, contemporary Halal-certified coffeehouse chain.',
    ambiance: 'Premium, spacious, and contemporary setting with comfortable seating. Ideal for both a casual meetup and a cozy date.',
    type: 'Halal Cafe',
    image: 'https://media-cdn.tripadvisor.com/media/photo-m/1280/15/f1/20/0a/java-lounge-in-fort.jpg',
    themeClass: 'bg-[#3E2723] text-[#EFEBE9]',
    accentClass: 'bg-[#4E342E] text-[#D7CCC8] border-[#5D4037]',
    buttonClass: 'bg-[#795548] hover:bg-[#8D6E63] text-white',
    scheduleRules: {
      daysOpen: [0, 1, 2, 3, 4, 5, 6],
      weekday: {
        isOpen: true,
        format: 'Halal Specialty Coffee & Dining',
        time: '7:00 AM - 10:00 PM',
        price: 'LKR 1,500 - 3,200',
        note: 'Relaxed weekday ambiance with gourmet pastries and coffees.'
      },
      weekend: {
        isOpen: true,
        format: 'Weekend Halal Coffee & Desserts',
        time: '7:00 AM - 10:00 PM',
        price: 'LKR 1,800 - 3,500',
        note: 'Vibrant weekend atmosphere with artisan drinks.'
      }
    }
  },
  {
    id: 'tlounge',
    name: 'The t-Lounge by Dilmah',
    subtitle: 'Chatham St / Horton Pl',
    time: '11:00 AM - 6:00 PM',
    days: 'Daily (Prior Reservation)',
    price: 'LKR 4,400 nett',
    desc: 'Elegant, sophisticated Halal-certified high tea experience.',
    ambiance: 'Luxurious High Tea pairing world-class Ceylon tea with gourmet treats in a very quiet, refined afternoon setting.',
    type: 'Halal High Tea',
    image: 'https://media-cdn.tripadvisor.com/media/photo-m/1280/30/eb/7f/36/front-entrance-view.jpg',
    themeClass: 'bg-[#004D40] text-[#E0F2F1]',
    accentClass: 'bg-[#00695C] text-[#B2DFDB] border-[#00796B]',
    buttonClass: 'bg-[#00897B] hover:bg-[#26A69A] text-white',
    scheduleRules: {
      daysOpen: [0, 1, 2, 3, 4, 5, 6],
      reservationRequired: true,
      weekday: {
        isOpen: true,
        format: 'Gourmet Ceylon Tea Pairing & High Tea',
        time: '11:00 AM - 6:00 PM',
        price: 'LKR 4,400 nett per person',
        note: 'Prior reservation recommended. Refined, quiet afternoon tea.'
      },
      weekend: {
        isOpen: true,
        format: 'Weekend Ceylon High Tea Experience',
        time: '11:00 AM - 6:00 PM',
        price: 'LKR 4,400 nett per person',
        note: 'Prior reservation required. Exclusive artisan tea pairings.'
      }
    }
  },
  {
    id: 'kingsbury-lunch',
    name: 'Harbour Court',
    subtitle: 'The Kingsbury (Unlimited Lunch)',
    time: '12:00 PM - 3:00 PM',
    days: 'Mon-Sat (Lunch Buffet), Sun (Grand Sunday Brunch)',
    price: 'LKR 5,400 - 6,900 nett',
    desc: 'Lavish oceanfront international buffet with live sushi, seafood & carving stations.',
    ambiance: 'Grand oceanfront luxury overlooking the Indian Ocean and Colombo Port. Features live sushi counters, roasted meats, fresh seafood, and an extensive dessert island.',
    type: 'Unlimited Lunch Buffet',
    image: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/139151623.jpg?k=8db541bd72fa8bfa376c1fbfeaba63fe676a91ea87024fba9e82429e806aec19&o=',
    themeClass: 'bg-[#0B1528] text-[#E8F0FE]',
    accentClass: 'bg-[#15243F] text-[#D0E2FF] border-[#25467A]',
    buttonClass: 'bg-[#1D4ED8] hover:bg-[#2563EB] text-white',
    scheduleRules: {
      daysOpen: [0, 1, 2, 3, 4, 5, 6],
      weekendDays: [0], // Sunday is Grand Sunday Brunch
      weekday: {
        isOpen: true,
        format: 'International Lunch Buffet',
        time: '12:00 PM - 3:00 PM',
        price: 'LKR 5,400 nett per person',
        note: 'Unlimited international lunch buffet with live culinary stations, sushi & ocean views.'
      },
      weekend: {
        isOpen: true,
        format: 'Grand Sunday Brunch / Weekend Feast',
        time: '12:00 PM - 3:00 PM',
        price: 'LKR 6,900 nett per person',
        note: 'Grand weekend lunch spread with roast carving stations, fresh seafood bar, and artisan desserts.'
      }
    }
  },
  {
    id: 'cityofdreams-lunch',
    name: 'Quizine Lunch Buffet',
    subtitle: 'City of Dreams (Cinnamon Life)',
    time: '12:00 PM - 3:00 PM',
    days: 'Daily (International Culinary Theatre)',
    price: 'LKR 6,900 - 8,000 nett',
    desc: 'Spectacular global culinary theatre with live interactive counters across world cuisines.',
    ambiance: 'Ultra-modern 5-star integrated resort luxury. An interactive culinary showcase featuring authentic Western, Asian, Indian, live sushi bar, carving stations, and a decadent dessert gallery.',
    type: 'Grand Lunch Buffet',
    image: 'https://d18slle4wlf9ku.cloudfront.net/www.cinnamonhotels.com-1754953340/cms/cache/v2/670e6d1788d59.jpg/1920x1080/fit/80/0da55743ce9536d37a9513834e23b03e.jpg',
    themeClass: 'bg-[#1B0F2B] text-[#F3E8FF]',
    accentClass: 'bg-[#2D1A45] text-[#E9D5FF] border-[#6B21A8]',
    buttonClass: 'bg-[#7C3AED] hover:bg-[#8B5CF6] text-white',
    scheduleRules: {
      daysOpen: [0, 1, 2, 3, 4, 5, 6],
      weekendDays: [5, 6, 0],
      weekday: {
        isOpen: true,
        format: 'Grand International Lunch Buffet',
        time: '12:00 PM - 3:00 PM',
        price: 'LKR 6,900 nett per person',
        note: 'Lavish international lunch spread featuring live cooking counters across Western, Asian, and Sri Lankan cuisines.'
      },
      weekend: {
        isOpen: true,
        format: 'Weekend Grand Luxury Buffet',
        time: '12:00 PM - 3:00 PM',
        price: 'LKR 8,000 nett per person',
        note: 'Premier weekend culinary showcase with live sushi, seafood grills, artisan carveries & pastry gallery.'
      }
    }
  },
  {
    id: 'cityofdreams-hightea',
    name: 'Afternoon Bliss High Tea',
    subtitle: 'City of Dreams (Nüwa Level 25)',
    time: '3:00 PM - 6:00 PM',
    days: 'Daily (Platter for Two & Sunset Specials)',
    price: 'LKR 4,000 / person (LKR 8,000 for two)',
    desc: 'Rooftop poolside luxury high tea platter with handcrafted sweets, savories & Ceylon teas.',
    ambiance: 'Stunning 25th-floor open-air rooftop poolside view overlooking the Colombo skyline and Beira Lake. Intimate tiered luxury platter featuring gourmet savoury canapés, artisanal macarons, and premium Ceylon tea pairings.',
    type: 'High Tea Platter',
    image: 'https://www.cityofdreamssrilanka.com/sites/g/files/codsrilanka/files/2026-07/Afternoon%20bliss%20Thumbnail.png',
    themeClass: 'bg-[#2A0F1D] text-[#FCE7F3]',
    accentClass: 'bg-[#42172F] text-[#FBCFE8] border-[#9D174D]',
    buttonClass: 'bg-[#BE185D] hover:bg-[#DB2777] text-white',
    scheduleRules: {
      daysOpen: [0, 1, 2, 3, 4, 5, 6],
      weekendDays: [5, 6, 0],
      reservationRequired: true,
      weekday: {
        isOpen: true,
        format: 'Rooftop High Tea Platter for Two',
        time: '3:00 PM - 6:00 PM',
        price: 'LKR 8,000 nett for two (~LKR 4,000 / person)',
        note: 'Luxury 3-tier tiered platter with savories & sweets at Level 25 Poolside. Reservation recommended before 12 PM.'
      },
      weekend: {
        isOpen: true,
        format: 'Weekend Sunset High Tea Experience',
        time: '3:00 PM - 6:00 PM',
        price: 'LKR 8,000 nett for two (~LKR 4,000 / person)',
        note: 'Romantic sunset high tea on Level 25 overlooking the city. Prior reservation required.'
      }
    }
  },
  {
    id: 'cinnamonlife-sweetlab',
    name: 'Sweet Lab Afternoon Tea',
    subtitle: 'City of Dreams (Cinnamon Life)',
    time: '3:00 PM - 6:00 PM',
    days: 'Thu-Sun (High Tea & Dessert Lounge)',
    price: 'LKR 4,500 - 5,500 nett for two',
    desc: 'Chic modern pâtisserie lounge with afternoon tea platters & artisan desserts.',
    ambiance: 'Vibrant, playful, and Instagrammable confectionery cafe inside Cinnamon Life. Signature artisan pastries, gourmet savory bites, and fine teas.',
    type: 'High Tea & Patisserie',
    image: 'https://www.cityofdreamssrilanka.com/sites/g/files/codsrilanka/files/2025-07/NuwaSL-Main1_mobbanner560x560-guide.jpg',
    themeClass: 'bg-[#2D1B28] text-[#FDF2F8]',
    accentClass: 'bg-[#44273C] text-[#FCE7F3] border-[#831843]',
    buttonClass: 'bg-[#DB2777] hover:bg-[#F472B6] text-white',
    scheduleRules: {
      daysOpen: [4, 5, 6, 0], // Thursday to Sunday
      weekendDays: [5, 6, 0],
      weekday: {
        isOpen: true,
        format: 'Artisan Afternoon Tea Platter',
        time: '3:00 PM - 6:00 PM',
        price: 'LKR 4,500 nett for two (~LKR 2,250 / person)',
        note: 'Curated 3-tier sweet & savory selection with signature Ceylon brews.'
      },
      weekend: {
        isOpen: true,
        format: 'Weekend High Tea & Patisserie Spread',
        time: '3:00 PM - 6:00 PM',
        price: 'LKR 5,500 nett for two (~LKR 2,750 / person)',
        note: 'Weekend special featuring live dessert counters and artisanal delicacies.'
      }
    }
  }
]

export interface DateAvailability {
  dayName: string
  formattedDate: string
  isOpen: boolean
  isWeekend: boolean
  format: string
  time: string
  price: string
  badge: string
  note?: string
  statusMessage?: string
  reservationRequired?: boolean
}

export function evaluatePlaceForDate(place: Place, dateStr: string): DateAvailability {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  let dayOfWeek = 0
  let formattedDate = dateStr

  if (dateStr) {
    const parts = dateStr.split('-').map(Number)
    if (parts.length === 3) {
      const year = parts[0]
      const month = parts[1] - 1
      const day = parts[2]
      const d = new Date(year, month, day)
      dayOfWeek = d.getDay()
      formattedDate = `${dayNames[dayOfWeek]}, ${monthNames[month]} ${day}, ${year}`
    }
  }

  const dayName = dayNames[dayOfWeek]
  const rules = place.scheduleRules

  if (!rules) {
    return {
      dayName,
      formattedDate,
      isOpen: true,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      format: place.type,
      time: place.time,
      price: place.price,
      badge: `${place.type} Available`,
      note: place.desc
    }
  }

  const daysOpen = rules.daysOpen || [0, 1, 2, 3, 4, 5, 6]
  const isOpen = daysOpen.includes(dayOfWeek)
  const weekendDays = rules.weekendDays || [5, 6, 0] // Default Fri, Sat, Sun
  const isWeekend = weekendDays.includes(dayOfWeek)

  let activeSchedule: DaySchedule | undefined

  if (rules.customDays && rules.customDays[dayOfWeek]) {
    activeSchedule = rules.customDays[dayOfWeek]
  } else if (isWeekend && rules.weekend) {
    activeSchedule = rules.weekend
  } else if (!isWeekend && rules.weekday) {
    activeSchedule = rules.weekday
  }

  const format = activeSchedule?.format || place.type
  const time = activeSchedule?.time || place.time
  const price = activeSchedule?.price || place.price
  const note = activeSchedule?.note || place.desc
  const reservationRequired = rules.reservationRequired || false

  let badge = `${dayName} Special`
  if (!isOpen) {
    badge = 'Closed on this day'
  } else if (isWeekend && format.toLowerCase().includes('buffet')) {
    badge = `✨ ${dayName} Buffet Active!`
  } else if (isWeekend) {
    badge = `✨ Weekend Experience`
  } else {
    badge = `Weekday ${format}`
  }

  let statusMessage = undefined
  if (!isOpen) {
    statusMessage = `Please note: ${place.name} is usually closed on ${dayName}s. We recommend confirming beforehand!`
  } else if (reservationRequired) {
    statusMessage = `Prior reservation recommended for ${dayName} seating.`
  }

  return {
    dayName,
    formattedDate,
    isOpen,
    isWeekend,
    format,
    time,
    price,
    badge,
    note,
    statusMessage,
    reservationRequired
  }
}

export function findBestBuffetAlternative(
  allPlaces: Place[],
  currentPlaceId: string,
  dateStr: string
): { place: Place; availability: DateAvailability } | null {
  const candidates = allPlaces.filter(p => p.id !== currentPlaceId)

  const buffetMatches = candidates
    .map(p => {
      const avail = evaluatePlaceForDate(p, dateStr)
      const isBuffet = avail.isOpen && (
        avail.format.toLowerCase().includes('buffet') ||
        p.type.toLowerCase().includes('buffet')
      )
      return { place: p, availability: avail, isBuffet }
    })
    .filter(item => item.isBuffet)

  if (buffetMatches.length === 0) return null

  // Smart ranking: prioritize top-rated hotel buffets with daily live stations
  const ranked = [...buffetMatches].sort((a, b) => {
    const priority = ['cityofdreams-lunch', 'kingsbury-lunch', 'beira', 'mandarina', 'churros']
    const aIndex = priority.indexOf(a.place.id)
    const bIndex = priority.indexOf(b.place.id)
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return 0
  })

  return {
    place: ranked[0].place,
    availability: ranked[0].availability
  }
}

