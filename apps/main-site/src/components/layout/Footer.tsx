'use client'

import Link from 'next/link'
import Image from 'next/image'

const footerNavigation = [
  { name: 'SELL MY PROPERTY', href: '/sell' },
  { name: 'LET MY PROPERTY', href: '/landlords' },
  { name: 'REGISTER', href: '/register' },
  { name: 'JOIN US', href: '/join' },
  { name: 'CONTACT', href: '/contact' },
]

const legalLinks = [
  { name: 'Privacy Policy', href: '/policies/privacy' },
  { name: 'Cookie Policy', href: '/policies/cookies' },
  { name: 'CMP', href: '/policies/cmp' },
  { name: 'CMP Rules', href: '/policies/cmp-rules' },
  { name: 'Tenant Fees', href: '/policies/tenant-fees' },
  { name: 'Complaints Process', href: '/policies/complaints' },
  { name: 'Client Portal', href: '/client-portal' },
  { name: "T & C's", href: '/policies/terms' },
]

// Sample reviews - these would come from an API
const reviews = [
  {
    id: 1,
    rating: 5,
    text: "\"Sue has been an absolute super star and guided us through each step of selling our house. Sue has given us advice and support as needed and always kept us up to date with the process. We are most grateful for her care and attention and have no hesitation whatsoever to recommend her.\"",
  },
  {
    id: 2,
    rating: 5,
    text: "\"Why would you not choose a single committed agent to work for you, when the high street alternative is being 1 of 170 properties listed and reliance on the website ? Great advice, helpful conversations and an excellent sale outcome. We really appreciate all the work put in by Lyn and Matt's support.\"",
  },
  {
    id: 3,
    rating: 5,
    text: "\"We recently sold our house through Nest. Libby was brilliant from start to finish, we can't speak highly enough of her. She spent a whole morning at the house putting together the photos and particulars, so much better than other estate agents we have used. She was on top of everything, keeping us updated with... Best estate agent ever.\"",
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex justify-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-9 w-9 ${i < rating ? 'text-nest-olive' : 'text-nest-gray'}`}
          fill={i < rating ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      ))}
    </div>
  )
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer>
      {/* Reviews Section - WHITE background */}
      <section className="bg-white py-12 md:py-16">
        <div className="container-wide">
          {/* Reviews Heading */}
          <h2 className="mb-8 text-center text-[20px] font-normal uppercase tracking-[2.8px] text-black md:mb-12 md:text-[25px]">
            Reviews
          </h2>

          {/* Mobile: Single review carousel */}
          <div className="md:hidden">
            <div className="mb-6 flex justify-center">
              <StarRating rating={5} />
            </div>
            <div className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide">
              {reviews.map((review) => (
                <div key={review.id} className="min-w-full snap-center px-4">
                  <p className="text-left text-[16px] font-light italic leading-[26px] text-black">
                    {review.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: Grid with fade edges */}
          <div className="relative hidden md:block">
            {/* Left fade gradient */}
            <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
            {/* Right fade gradient */}
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />

            <div className="grid gap-8 md:grid-cols-3">
              {reviews.map((review) => (
                <div key={review.id}>
                  <div className="mb-4 flex justify-center">
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="text-left text-[16px] font-light italic leading-[26px] text-black">
                    {review.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Top Button - Triangular Tab with TOP text inside */}
      <div className="relative bg-nest-olive">
        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-full">
          <button
            onClick={scrollToTop}
            className="relative flex flex-col items-center"
            aria-label="Scroll to top"
          >
            {/* Mobile: smaller triangle */}
            <svg
              className="h-[40px] w-[63px] md:h-[60px] md:w-[121px]"
              viewBox="0 0 121 60"
              fill="none"
              preserveAspectRatio="none"
            >
              <polygon points="60.5,0 121,60 0,60" fill="#54714B" />
            </svg>
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-[10px] font-medium uppercase tracking-[1px] text-white md:text-[14px]">
              TOP
            </span>
          </button>
        </div>
        <div className="h-4" />
      </div>

      {/* Main Footer Navigation */}
      <div className="bg-nest-olive pb-6 pt-10 md:py-6">
        <div className="container-wide">
          {/* Mobile: Stacked vertically */}
          <nav className="flex flex-col items-center gap-4 md:hidden">
            {footerNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-[18px] uppercase tracking-[5px] text-white transition-colors hover:text-white/80"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop: Horizontal with dividers */}
          <nav className="hidden flex-wrap items-center justify-center md:flex">
            {footerNavigation.map((item, index) => (
              <span key={item.name} className="flex items-center">
                <Link
                  href={item.href}
                  className="text-[25px] uppercase tracking-[3px] text-white transition-colors hover:text-white/80"
                >
                  {item.name}
                </Link>
                {index < footerNavigation.length - 1 && (
                  <span className="mx-4 text-[25px] text-white">|</span>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>

      {/* Trust Badges - On Olive */}
      <div className="bg-nest-olive py-8 md:py-10">
        <div className="container-wide">
          {/* Mobile: Horizontal scroll carousel with larger logos */}
          <div className="flex snap-x snap-mandatory gap-8 overflow-x-auto pb-4 scrollbar-hide md:hidden">
            <div className="flex min-w-full snap-center items-center justify-center">
              <Image
                src="/images/badges/tpo-property-ombudsman.png"
                alt="The Property Ombudsman"
                width={160}
                height={50}
                className="h-[50px] w-auto"
              />
            </div>
            <div className="flex min-w-full snap-center items-center justify-center">
              <Image
                src="/images/badges/naea-propertymark-protected.png"
                alt="NAEA Propertymark Protected"
                width={160}
                height={58}
                className="h-[58px] w-auto"
              />
            </div>
            <div className="flex min-w-full snap-center items-center justify-center">
              <Image
                src="/images/badges/arla-propertymark-protected.png"
                alt="ARLA Propertymark Protected"
                width={160}
                height={58}
                className="h-[58px] w-auto"
              />
            </div>
            <div className="flex min-w-full snap-center items-center justify-center">
              <Image
                src="/images/badges/trading-standards-approved.png"
                alt="Trading Standards Approved Code"
                width={130}
                height={67}
                className="h-[67px] w-auto"
              />
            </div>
          </div>

          {/* Desktop: All badges in a row */}
          <div className="hidden flex-wrap items-center justify-center gap-20 md:flex">
            <Image
              src="/images/badges/tpo-property-ombudsman.png"
              alt="The Property Ombudsman"
              width={111}
              height={35}
              className="h-[35px] w-auto"
            />
            <Image
              src="/images/badges/naea-propertymark-protected.png"
              alt="NAEA Propertymark Protected"
              width={110}
              height={40}
              className="h-[40px] w-auto"
            />
            <Image
              src="/images/badges/arla-propertymark-protected.png"
              alt="ARLA Propertymark Protected"
              width={109}
              height={40}
              className="h-[40px] w-auto"
            />
            <Image
              src="/images/badges/trading-standards-approved.png"
              alt="Trading Standards Approved Code"
              width={90}
              height={46}
              className="h-[46px] w-auto"
            />
          </div>
        </div>
      </div>

      {/* Copyright & Legal - STILL ON OLIVE */}
      <div className="bg-nest-olive px-6 py-8 md:py-6">
        <div className="container-wide">
          <div className="flex flex-col items-center space-y-3 text-center md:space-y-2">
            {/* Company Info */}
            <p className="text-[9px] font-medium uppercase leading-[16px] tracking-[0.8px] text-white md:text-[10px] md:leading-[14px]">
              Copyright &copy; {currentYear}. Nest Associates is a trading name of Nest Associates Ltd. Registered in England and Wales Number 12847489. Registered Office: Glebe Cottage, Cheddon Fitzpaine, Taunton, Somerset, TA2 8JU.
            </p>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-y-1">
              {legalLinks.map((link, index) => (
                <span key={link.name} className="flex items-center">
                  <Link
                    href={link.href}
                    className="text-[9px] font-medium uppercase leading-[16px] tracking-[0.8px] text-white hover:text-white/80 md:text-[10px] md:leading-[14px]"
                  >
                    {link.name}
                  </Link>
                  {index < legalLinks.length - 1 && (
                    <span className="mx-1.5 text-[9px] text-white md:mx-2 md:text-[10px]">|</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
