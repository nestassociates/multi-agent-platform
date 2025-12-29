import { HeroSection, WelcomeSection, AgentCarousel, JournalSection, EarlyBirdSection } from '@/components/home'
import { OrganizationJsonLd } from '@/components/seo/JsonLd'
import { getAgents } from '@/lib/api'

export const metadata = {
  title: 'Nest Associates | Property Experts',
  description:
    'Find your perfect property with Nest Associates - connecting you with local property experts across the UK. Browse homes for sale and rent.',
  openGraph: {
    title: 'Nest Associates | Property Experts',
    description:
      'Find your perfect property with Nest Associates - connecting you with local property experts across the UK.',
    type: 'website',
  },
}

export default async function HomePage() {
  // Fetch agents server-side with caching
  const agents = await getAgents()

  return (
    <>
      <OrganizationJsonLd />
      <HeroSection />
      <WelcomeSection />
      <AgentCarousel agents={agents} />
      <JournalSection />
      <EarlyBirdSection />
    </>
  )
}
