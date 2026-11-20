import type { Metadata } from 'next'
import LoveCouponsGame from './LoveCouponsGame'

export const metadata: Metadata = {
  title: 'Love Coupons',
  description: 'Scratch off the foil to reveal love coupons you can redeem anytime. No expiry.',
}

export default function LoveCouponsPage() {
  return <LoveCouponsGame />
}
