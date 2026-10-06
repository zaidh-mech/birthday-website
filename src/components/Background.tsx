export default function Background() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50 bg-[#fdfbf7]">
      {/* Decorative static glowing orbs */}
      <div
        className="absolute top-[10%] left-[10%] w-[60vw] h-[60vw] rounded-full hidden md:block"
        style={{ background: 'radial-gradient(circle, rgba(255, 228, 230, 0.6) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[0%] right-[0%] w-[50vw] h-[50vw] rounded-full hidden md:block"
        style={{ background: 'radial-gradient(circle, rgba(254, 243, 199, 0.6) 0%, transparent 70%)' }}
      />
    </div>
  )
}
