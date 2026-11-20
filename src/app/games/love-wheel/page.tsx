import type { Metadata } from 'next'
import LoveWheelGame from './LoveWheelGame'

export const metadata: Metadata = {
  title: 'Wheel of Love',
  description: 'Spin the Wheel of Love and win a little something from me. Every prize is real and never expires.',
}

export default function LoveWheelPage() {
  return <LoveWheelGame />
}
