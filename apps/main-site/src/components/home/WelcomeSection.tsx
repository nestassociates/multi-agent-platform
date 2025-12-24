'use client'

import Image from 'next/image'
import Link from 'next/link'

export function WelcomeSection() {
  return (
    <section className="grid lg:grid-cols-2">
      {/* Left Column - Pink Background with Content */}
      <div className="flex bg-nest-pink">
        {/* Content container - constrained width, right-aligned on large screens */}
        <div className="w-full px-8 py-16 text-center lg:text-left xl:ml-auto xl:max-w-[600px] xl:pl-0 xl:pr-12 lg:py-24">
          {/* Leaf Icon */}
          <div className="mb-8 flex justify-center lg:justify-start">
            <Image
              src="/images/home/leaf-icon.png"
              alt=""
              width={80}
              height={50}
              className="h-12 w-auto"
            />
          </div>

          {/* Heading */}
          <h2 className="mb-6 text-[28px] font-normal uppercase tracking-[2px] text-nest-brown lg:text-[32px]">
            Welcome to Nest
          </h2>

          {/* Body Copy */}
          <div className="space-y-6 text-[15px] leading-relaxed text-nest-brown/90">
            <p>
              Estate agency is a simple business, often over complicated by estate agents!
              We don&apos;t follow the crowd, we keep it simple, taking time to get to know you,
              your property and understand your situation so we can create a bespoke moving
              strategy individually tailored to you.
            </p>
            <p>
              Get in touch to discuss how our unique marketing plan can help sell or let
              your property quickly and at the best price in the current market.
            </p>
          </div>

          {/* CTA Button - Outlined */}
          <Link
            href="/valuation"
            className="mt-10 inline-block border-2 border-nest-brown px-8 py-4 text-[13px] font-medium uppercase tracking-[2px] text-nest-brown transition-colors hover:bg-nest-brown hover:text-white"
          >
            Request a Valuation
          </Link>
        </div>
      </div>

      {/* Right Column - Image stretches full width */}
      <div className="relative min-h-[400px] lg:min-h-0">
        <Image
          src="/images/home/welcome-lifestyle.jpg"
          alt="A child running through a stylish home interior"
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
    </section>
  )
}
