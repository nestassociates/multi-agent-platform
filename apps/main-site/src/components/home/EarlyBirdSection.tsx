'use client'

import Link from 'next/link'

export function EarlyBirdSection() {
  return (
    <section className="grid lg:grid-cols-2">
      {/* Left Column - Green Background with Content */}
      <div className="flex bg-nest-olive">
        {/* Content container - constrained width, right-aligned on large screens */}
        <div className="w-full px-8 py-16 text-center lg:text-left xl:ml-auto xl:max-w-[600px] xl:pl-0 xl:pr-12 lg:py-24">
          {/* Heading */}
          <h2 className="mb-6 text-[28px] font-normal uppercase tracking-[2px] text-white lg:text-[32px]">
            Early Bird
          </h2>

          {/* Body Copy */}
          <div className="space-y-6 text-[15px] leading-relaxed text-white/90">
            <p>
              As the famous saying suggests, you have to be quick if you want to get ahead
              of your competition! Here at Nest Associates, we have a unique social media
              launch strategy where our &apos;Early Bird&apos; followers and subscribers will get
              exclusive access to our upcoming listings before they are released to the open market.
            </p>
            <p>
              Make sure you follow your local agent on Facebook and Instagram to put yourself
              to the front of the queue.
            </p>
          </div>

          {/* CTA Button - Outlined White */}
          <Link
            href="/agents"
            className="mt-10 inline-block border-2 border-white px-8 py-4 text-[13px] font-medium uppercase tracking-[2px] text-white transition-colors hover:bg-white hover:text-nest-olive"
          >
            Find Your Local Agent
          </Link>
        </div>
      </div>

      {/* Right Column - Pink Background with Phone Mockup */}
      <div className="relative flex min-h-[400px] items-center justify-center bg-nest-pink lg:min-h-0">
        {/* Placeholder for phone mockup - replace with actual image */}
        <div className="relative h-[400px] w-[300px] lg:h-[500px] lg:w-[350px]">
          <div className="flex h-full w-full items-center justify-center rounded-3xl bg-gray-300 text-gray-500">
            <p className="text-center text-sm">Phone mockup<br />image needed</p>
          </div>
        </div>
      </div>
    </section>
  )
}
