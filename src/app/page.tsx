import HomeShell from '@/components/home/HomeShell'
import HeroSection from '@/components/home/HeroSection'
import TogetherSection from '@/components/home/TogetherSection'
import WishCakeSection from '@/components/home/WishCakeSection'
import ReasonsJarSection from '@/components/home/ReasonsJarSection'
import PhotoOfTheDaySection from '@/components/home/PhotoOfTheDaySection'
import ExploreSection from '@/components/home/ExploreSection'
import HomeSignoff from '@/components/home/HomeSignoff'

export default function Home() {
  return (
    <HomeShell>
      <HeroSection nextId="together" />
      <TogetherSection id="together" />
      <WishCakeSection />
      <ReasonsJarSection />
      <PhotoOfTheDaySection />
      <ExploreSection />
      <HomeSignoff />
    </HomeShell>
  )
}
