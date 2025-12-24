import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface CTABannerProps {
  heading: string
  buttonText: string
  buttonHref: string
}

export function CTABanner({ heading, buttonText, buttonHref }: CTABannerProps) {
  return (
    <section className="relative my-12 overflow-hidden bg-nest-pink">
      {/* Texture overlay */}
      <div className="cta-texture absolute -inset-[10px] bg-[url('/images/cta-texture.png')] bg-cover bg-center" />

      {/* Content */}
      <div className="relative z-10 p-6 md:px-16 md:py-16">
        <h2 className="max-w-[65%] text-[30px] font-normal uppercase leading-[38px] text-black md:max-w-[65%] md:text-[51px] md:leading-[63px]">
          {heading}
        </h2>

        <div className="mt-6 md:mt-8">
          <Button
            variant="outline"
            className="w-full border-black bg-transparent px-6 py-3 text-[12px] uppercase tracking-[1.5px] text-black hover:bg-black hover:text-white md:w-auto"
            asChild
          >
            <Link href={buttonHref}>{buttonText}</Link>
          </Button>
        </div>
      </div>

      {/* Monstera plant - Desktop: full height */}
      <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[45%] md:block">
        <Image
          src="/images/cta-monstera.png"
          alt=""
          fill
          className="object-cover object-left-top"
          sizes="45vw"
          priority
        />
      </div>

      {/* Monstera plant - Mobile: top right corner */}
      <div className="pointer-events-none absolute -right-[7px] top-0 h-full w-[50%] md:hidden">
        <Image
          src="/images/cta-monstera-mobile.png"
          alt=""
          fill
          className="object-cover object-right-top"
          sizes="50vw"
          priority
        />
      </div>
    </section>
  )
}
