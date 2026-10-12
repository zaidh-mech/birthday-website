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
  },
  {
    id: 'mandarina',
    name: 'Mandarina Colombo',
    subtitle: 'Hotel High Tea',
    time: '3:30 PM - 5:30 PM',
    days: 'Fri-Sun',
    price: 'LKR 3,500 nett',
    desc: 'Classic hotel high tea with a popular weekend buffet.',
    ambiance: 'Breezy, modern, and comfortable. A relaxing atmosphere with a fantastic view of the city skyline.',
    type: 'Buffet',
    image: 'https://d3tfak2ngprx5z.cloudfront.net/2016/02/Main-Gallery-and-Snippet-image-12.jpg',
    themeClass: 'bg-[#0F172A] text-[#F1F5F9]',
    accentClass: 'bg-[#1E293B] text-[#E2E8F0] border-[#3B82F6]',
    buttonClass: 'bg-[#3B82F6] hover:bg-[#60A5FA] text-white',
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
    type: 'Buffet',
    image: 'https://cache.marriott.com/is/image/marriotts7prod/cy-cmbcy-beira-kitchen-22484-90801:Wide-Hor?wid=1336&fit=constrain',
    themeClass: 'bg-[#431407] text-[#FFEDD5]',
    accentClass: 'bg-[#7C2D12] text-[#FFEDD5] border-[#F97316]',
    buttonClass: 'bg-[#EA580C] hover:bg-[#F97316] text-white',
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
  },
  {
    id: 'radicle',
    name: 'Radicle Cafe',
    subtitle: 'Colombo Fort',
    time: 'Closes at 6:00 PM',
    days: 'Daily',
    price: 'A la carte',
    desc: 'Tranquil oasis inside a 100+ year-old colonial building.',
    ambiance: 'Historic, peaceful, and artistic. Located in an old colonial building housing an art gallery—perfect for quiet, intimate conversations.',
    type: 'Specialty Cafe',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy2AuPqwbYFZ-hX9v9hDI59OotytuyLSi69_BrU91QQg&s=10',
    themeClass: 'bg-[#1C2C24] text-[#E8EFE9]',
    accentClass: 'bg-[#283D33] text-[#D1DDD5] border-[#557A66]',
    buttonClass: 'bg-[#436452] hover:bg-[#557A66] text-white',
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
  }
]
