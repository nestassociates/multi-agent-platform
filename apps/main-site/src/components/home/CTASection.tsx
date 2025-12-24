import Link from 'next/link'
import { Home, Users, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Home,
    title: 'Free Valuation',
    description:
      'Get an accurate valuation of your property from our local experts.',
    href: '/sell',
    cta: 'Get Valuation',
  },
  {
    icon: Users,
    title: 'Meet Our Agents',
    description:
      'Find a local property expert in your area who knows the market.',
    href: '/agents',
    cta: 'Find Agent',
  },
  {
    icon: FileText,
    title: 'Property Guides',
    description:
      'Expert advice and tips for buying, selling, and renting properties.',
    href: '/journal',
    cta: 'Read More',
  },
]

export function CTASection() {
  return (
    <section className="border-t bg-muted/30 py-16 lg:py-24">
      <div className="container-wide">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">How Can We Help?</h2>
          <p className="mt-2 text-muted-foreground">
            Whether you're buying, selling, or letting, we're here to support
            you.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border bg-card p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {feature.description}
              </p>
              <Button variant="outline" asChild>
                <Link href={feature.href}>{feature.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
