import type { Metadata } from 'next'
import HeartCatcherGame from './HeartCatcherGame'

export const metadata: Metadata = {
  title: 'Heart Catcher',
  description: 'Catch all my love before it hits the ground: a little arcade game made just for you.',
}

export default function HeartCatcherPage() {
  return <HeartCatcherGame />
}
