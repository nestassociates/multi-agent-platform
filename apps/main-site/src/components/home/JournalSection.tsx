'use client'

import Image from 'next/image'
import Link from 'next/link'

export function JournalSection() {
  return (
    <section className="flex flex-col lg:flex-row">
      {/* Left Column - Image (shows below text on mobile, first on desktop) */}
      <div className="relative order-2 min-h-[400px] w-full overflow-hidden lg:order-1 lg:w-1/2">
        <Image
          src="/images/home/journal-magazine.jpg"
          alt="Nest Living magazine on a wicker tray"
          fill
          className="object-cover scale-[1.02]"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {/* Right Column - Green Background with Content (shows first on mobile) */}
      <div className="order-1 flex w-full bg-nest-olive lg:order-2 lg:w-1/2">
        {/* Content container - constrained width, left-aligned on large screens */}
        <div className="w-full px-8 py-16 text-center lg:text-left xl:mr-auto xl:max-w-[600px] xl:pr-0 xl:pl-12 lg:py-24">
          {/* Heading */}
          <h2 className="mb-6 text-[28px] font-normal uppercase tracking-[2px] text-white lg:text-[32px]">
            Nest Journal
          </h2>

          {/* Body Copy */}
          <div className="space-y-6 text-[15px] leading-relaxed text-white/90">
            <p>
              We believe a home is more than bricks and mortar, it&apos;s where life unfolds.
              Our Journal is here to help you make the most of every step on your property journey.
            </p>
            <p>
              You&apos;ll find expert advice on buying, selling, and renting, along with local insights,
              home inspiration, and lifestyle tips. Whether you&apos;re moving, settling in, or simply
              dreaming about your next chapter, our journal is your guide to living beautifully,
              the Nest way.
            </p>
          </div>

          {/* CTA Button - Outlined White */}
          <Link
            href="/journal"
            className="mt-10 inline-block border-2 border-white px-8 py-4 text-[13px] font-medium uppercase tracking-[2px] text-white transition-colors hover:bg-white hover:text-nest-olive"
          >
            Read Here
          </Link>
        </div>
      </div>
    </section>
  )
}
