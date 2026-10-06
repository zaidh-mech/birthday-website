'use client'

import { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { motion, AnimatePresence } from 'framer-motion'
import { Memory } from '@/data/initialData'
import { fetchMemories } from '@/lib/storage'
import { Check, X, MapPin, Clock, CalendarDays, Wallet, Info, MessageCircle, Download, Loader2 } from 'lucide-react'

export default function GiftInteractive() {
  const [step, setStep] = useState(0)
  const [date, setDate] = useState('')
  const [color, setColor] = useState('')
  const [place, setPlace] = useState('')
  const [cuteFellaPhoto, setCuteFellaPhoto] = useState<string | null>(null)
  
  // State for expanded place modal
  const [activePlace, setActivePlace] = useState<any | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const ticketRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadPhoto() {
      const memories = await fetchMemories()
      const giftPhoto = memories.find(m => m.title === '[GIFT_PHOTO]')
      if (giftPhoto) {
        setCuteFellaPhoto(giftPhoto.imagePath)
      }
    }
    loadPhoto()
  }, [])

  const nextStep = () => setStep(s => s + 1)
  const handleYes = () => setStep(3)
  const handleNo1 = () => setStep(1)
  const handleNo2 = () => setStep(2)

  const handleWhatsAppSend = () => {
    const phoneNumber = "94741999926" 
    const baseText = `Hey my love! ❤️\n\nI'm so excited for our 5-Year Anniversary! 🥰\nI've chosen our perfect spot:\n📍 *Where:* ${place}\n📅 *When:* ${date}\n\n`
    const finalMessage = customMessage.trim() ? `${baseText}*My message to you:* ${customMessage}` : `${baseText}I can't wait to see you! 😘`
    const encodedMessage = encodeURIComponent(finalMessage)
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank')
  }

  const handleDownloadPDF = async () => {
    if (!ticketRef.current || isDownloading) return
    setIsDownloading(true)
    try {
      // Small delay
      await new Promise(r => setTimeout(r, 150))
      
      const canvas = await html2canvas(ticketRef.current, { 
        backgroundColor: null, 
        scale: 2,
        useCORS: true,
        logging: false
      })
      
      const imgData = canvas.toDataURL('image/png', 1.0)
      
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      const xOffset = 0
      const yOffset = 10 // slightly down from top
      
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, pdfWidth, pdfHeight)
      pdf.save('5-Year-Anniversary-Ticket.pdf')
      
    } catch (e: any) {
      console.error("PDF generation failed", e)
      alert("Failed to generate PDF. Error: " + (e?.message || String(e)))
    } finally {
      setIsDownloading(false)
    }
  }

  const colors = [
    { name: 'Rose', class: 'bg-rose-400' },
    { name: 'Lavender', class: 'bg-purple-400' },
    { name: 'Sky Blue', class: 'bg-sky-400' },
    { name: 'Mint', class: 'bg-teal-400' },
    { name: 'Buttercup', class: 'bg-amber-300' },
    { name: 'Midnight', class: 'bg-slate-800' },
  ]

  const places = [
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

  

  const variants: any = {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.3 } }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[80vh] w-full">
      <div className="w-full max-w-4xl mx-auto relative min-h-[500px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          
          {step === 0 && (
            <motion.div key="step0" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8 w-full px-4">
              <div className="space-y-4">
                <p className="text-rose-400 dark:text-purple-300 font-semibold text-sm sm:text-base uppercase tracking-[0.2em]">
                  To celebrate our 5 Years & Your Birthday
                </p>
                <h2 className="font-serif text-3xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
                  May I take you out on a date with me?
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <button onClick={handleYes} className="w-full sm:w-auto px-10 py-4 bg-rose-400 text-white rounded-full font-medium hover:bg-rose-500 hover:scale-105 transition-all shadow-md">
                  Yes!
                </button>
                <button onClick={handleNo1} className="w-full sm:w-auto px-10 py-4 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-full font-medium hover:bg-gray-200 transition-colors">
                  No
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8 w-full px-4">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
                Oh come on, you know you want to! 🙄<br/>
                <span className="text-rose-400">But I really want to take you...</span> so will you come please?
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <button onClick={handleYes} className="w-full sm:w-auto px-10 py-4 bg-rose-400 text-white rounded-full font-medium hover:bg-rose-500 hover:scale-105 transition-all shadow-md">
                  Fine, Yes!
                </button>
                <button onClick={handleNo2} className="w-full sm:w-auto px-10 py-4 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-full font-medium hover:bg-gray-200 transition-colors">
                  Still No
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-6 w-full px-4 flex flex-col items-center">
              {cuteFellaPhoto ? (
                <img src={cuteFellaPhoto} alt="Cute fella" className="w-48 h-48 sm:w-56 sm:h-56 object-cover rounded-2xl shadow-lg rotate-3" />
              ) : (
                <div className="w-48 h-48 sm:w-56 sm:h-56 bg-rose-100 rounded-2xl shadow-lg rotate-3 flex items-center justify-center border-2 border-dashed border-rose-300">
                  <span className="text-rose-400 font-medium px-4 text-center">Admin: Please upload cute fella photo</span>
                </div>
              )}
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
                Won't you change your mind for this cute fella? 🥺
              </h2>
              <p className="text-gray-500 dark:text-gray-400 italic max-w-md mx-auto">
                I know you won't say no for this, that is why "No" is not an option now.
              </p>
              <div className="flex items-center justify-center gap-6 pt-4 w-full sm:w-auto">
                <button onClick={handleYes} className="w-full sm:w-auto px-12 py-5 bg-rose-400 text-white rounded-full font-bold text-lg hover:bg-rose-500 hover:scale-110 transition-all shadow-xl animate-bounce">
                  YES! ❤️
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8 w-full px-4 bg-white/60 dark:bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-rose-100 dark:border-white/10 shadow-sm max-w-2xl mx-auto">
              <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-gray-100">
                Give me a date that you want to enjoy your day with me!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                If a weekday is the plan, inform beforehand so 'your babyboy' can take a leave. <br/>
                <span className="text-rose-400 italic">But if it's weekend, it's fineeee!</span>
              </p>
              
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full max-w-xs p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-rose-300 text-center font-medium"
              />

              <div>
                <button 
                  disabled={!date}
                  onClick={nextStep} 
                  className="px-10 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md w-full sm:w-auto"
                >
                  Next step
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-8 w-full px-4">
              <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-gray-100">
                Before moving to the 'where'...
              </h2>
              <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                Choose a colour. <span className="text-rose-400 italic">It's a secret.</span> 🤫
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 max-w-sm mx-auto">
                {colors.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    className={`w-16 h-16 rounded-full shadow-sm hover:scale-110 transition-transform ${c.class} ${color === c.name ? 'ring-4 ring-offset-4 ring-gray-900' : ''}`}
                    title={c.name}
                  />
                ))}
              </div>

              <div className="pt-8">
                <button 
                  disabled={!color}
                  onClick={nextStep} 
                  className="px-10 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md w-full sm:w-auto"
                >
                  Next step
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" variants={variants} initial="initial" animate="animate" exit="exit" className="w-full">
              <div className="text-center mb-10 px-4">
                <h2 className="font-serif text-3xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Where should I take you?
                </h2>
                <p className="text-gray-600 dark:text-gray-300 font-medium max-w-lg mx-auto">
                  I've picked out a few perfect spots for us. Tap on any card to explore the vibe, check the ambiance, and select your favorite!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                {places.map(p => (
                  <motion.div 
                    layout
                    key={p.id}
                    layoutId={`card-${p.id}`}
                    onClick={() => setActivePlace(p)}
                    className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all"
                  >
                    <img src={p.image} alt={p.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    
                    {place === p.name && (
                      <div className="absolute top-4 right-4 bg-rose-500 text-white p-2 rounded-full shadow-lg">
                        <Check className="w-5 h-5" />
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                      <span className="text-xs font-bold tracking-wider uppercase mb-2 block text-white/80">{p.type}</span>
                      <h3 className="font-serif text-2xl font-bold mb-1">{p.name}</h3>
                      <p className="text-sm text-white/90 font-light line-clamp-2">{p.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-12 text-center px-4">
                <button 
                  disabled={!place}
                  onClick={nextStep} 
                  className="px-12 py-5 bg-gray-900 text-white rounded-full font-bold text-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xl w-full sm:w-auto"
                >
                  {place ? `Lock in ${place}!` : 'Select a place above'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="step6" variants={variants} initial="initial" animate="animate" exit="exit" className="text-center space-y-6 w-full px-4">
              <div className="text-6xl animate-bounce mb-4">🎉</div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
                It&apos;s a Date!
              </h2>
              
              {/* ELEGANT GOLDEN TICKET */}
              <div className="py-4">
                <div 
                  ref={ticketRef} 
                  className="w-full max-w-lg mx-auto bg-gradient-to-br from-[#FFF9E6] to-[#FFF0C2] dark:from-[#1c1810] dark:to-[#0a0805] rounded-xl shadow-2xl p-2 relative overflow-hidden"
                >
                  {/* Outer Border */}
                  <div className="border-[3px] border-[#D4AF37] border-double rounded-lg p-6 relative h-full flex flex-col justify-center">
                    
                    {/* Corner Decorations */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#D4AF37]" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#D4AF37]" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#D4AF37]" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#D4AF37]" />

                    <div className="text-center space-y-2 mb-8 mt-2">
                      <p className="tracking-[0.4em] uppercase text-[10px] text-[#A67C00] dark:text-[#D4AF37] font-bold">Admit One • VIP Access</p>
                      <h3 className="font-serif text-3xl md:text-4xl text-[#D4AF37] font-bold">5-Year Anniversary</h3>
                    </div>

                    <div className="space-y-5 bg-white/50 dark:bg-black/40 p-6 rounded-md border border-[#D4AF37]/30">
                       <div className="flex justify-between items-end border-b border-[#D4AF37]/20 pb-3">
                         <span className="text-xs uppercase tracking-widest text-[#8C6900] dark:text-[#D4AF37]/80">Date</span>
                         <span className="font-serif font-bold text-gray-900 dark:text-gray-100 text-xl">{date}</span>
                       </div>
                       <div className="flex justify-between items-end border-b border-[#D4AF37]/20 pb-3">
                         <span className="text-xs uppercase tracking-widest text-[#8C6900] dark:text-[#D4AF37]/80">Location</span>
                         <span className="font-serif font-bold text-gray-900 dark:text-gray-100 text-xl text-right max-w-[65%]">{place}</span>
                       </div>
                       <div className="flex justify-between items-end pb-1">
                         <span className="text-xs uppercase tracking-widest text-[#8C6900] dark:text-[#D4AF37]/80">Dress Theme</span>
                         <span className="font-serif font-bold text-[#D4AF37] text-xl">{color}</span>
                       </div>
                    </div>

                    <div className="mt-10 mb-2 text-center">
                      <p className="font-cursive text-4xl text-[#A67C00] dark:text-[#D4AF37]">I can&apos;t wait to celebrate with you!</p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="mx-auto mt-6 py-4 px-10 bg-gradient-to-r from-[#D4AF37] to-[#A67C00] hover:from-[#C5A059] hover:to-[#8C6900] text-white rounded-full font-bold flex items-center justify-center gap-2 shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {isDownloading ? "Generating PDF..." : "Download VIP Ticket (PDF)"}
              </button>

              <div className="mt-12 bg-white/80 dark:bg-black/20 p-6 sm:p-8 rounded-[2rem] border border-rose-100 dark:border-white/10 shadow-lg shadow-rose-900/5 dark:shadow-none max-w-xl mx-auto backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-300 via-rose-400 to-rose-300" />
                <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Send your RSVP...
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                  Add a cute message for me! It will be sent straight to my WhatsApp along with your RSVP so I know you are ready! ❤️
                </p>
                <textarea 
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="I can't wait! 🥰"
                  className="w-full p-4 rounded-xl border border-rose-100 dark:border-white/20 bg-white dark:bg-[#111218] focus:ring-2 focus:ring-rose-300 outline-none mb-6 min-h-[100px] text-gray-800 dark:text-gray-200 custom-scrollbar resize-none"
                />
                <button 
                  onClick={handleWhatsAppSend}
                  className="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all hover:-translate-y-1"
                >
                  <MessageCircle className="w-5 h-5" />
                  Send to my WhatsApp
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expanded Place Modal Backdrop */}
      <AnimatePresence>
        {activePlace && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePlace(null)}
            className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      {/* Expanded Place Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <AnimatePresence>
          {activePlace && (
            <motion.div
              layout
              key={`modal-${activePlace.id}`}
              layoutId={`card-${activePlace.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              className={`relative w-full max-w-3xl rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row z-10 pointer-events-auto ${activePlace.themeClass}`}
            >
              <button 
                onClick={() => setActivePlace(null)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full z-20 transition-colors backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                 <img 
                   src={activePlace.image} 
                   alt={activePlace.name}
                   className="absolute inset-0 w-full h-full object-cover"
                 />
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold tracking-[0.2em] uppercase mb-2 block opacity-70">
                    {activePlace.type}
                  </span>
                  <h2 className="font-serif text-3xl md:text-4xl font-bold mb-1">
                    {activePlace.name}
                  </h2>
                  <p className="text-sm font-medium opacity-80 mb-6">
                    {activePlace.subtitle}
                  </p>

                  <div className="space-y-4 mb-8">
                    <p className="text-base leading-relaxed italic opacity-90">
                      "{activePlace.ambiance}"
                    </p>
                    
                    <div className={`p-4 rounded-2xl border space-y-3 ${activePlace.accentClass}`}>
                      <div className="flex items-center gap-3 text-sm">
                        <CalendarDays className="w-4 h-4 opacity-70" />
                        <span>{activePlace.days}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="w-4 h-4 opacity-70" />
                        <span>{activePlace.time}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Wallet className="w-4 h-4 opacity-70" />
                        <span>{activePlace.price}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setPlace(activePlace.name)
                    setActivePlace(null)
                  }}
                  className={`w-full py-4 rounded-full font-bold text-lg shadow-md transition-all hover:scale-105 flex items-center justify-center gap-2 ${activePlace.buttonClass}`}
                >
                  {place === activePlace.name ? (
                    <>Selected <Check className="w-5 h-5" /></>
                  ) : (
                    'Select this place'
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
