import type { Metadata } from 'next'
import SecretWordGame from './SecretWordGame'

export const metadata: Metadata = {
  title: 'Secret Word',
  description: 'Guess the hidden love word in six tries.',
}

export default function SecretWordPage() {
  return <SecretWordGame />
}
