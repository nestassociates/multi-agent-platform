'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type SearchTab = 'buy' | 'rent' | 'agents'

export function PropertySearch() {
  const [activeTab, setActiveTab] = useState<SearchTab>('buy')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (activeTab === 'agents') {
      // Navigate to agents page with search
      router.push("/agents" + (searchQuery ? "?search=" + encodeURIComponent(searchQuery) : ""))
    } else {
      // Navigate to buy/rent page with location search
      const path = activeTab === 'buy' ? '/buy' : '/rent'
      router.push(path + (searchQuery ? "?location=" + encodeURIComponent(searchQuery) : ""))
    }
  }

  return (
    <div className="w-full">
      {/* Tabs - left justified, touching search bar */}
      <div className="flex justify-start">
        {(['buy', 'rent', 'agents'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'text-sm uppercase tracking-[0.15em] transition-all px-5 py-3',
              activeTab === tab
                ? 'text-white bg-nest-brown font-normal'
                : 'text-white/80 hover:text-white font-semibold'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Input with dark button - border only here */}
      <form onSubmit={handleSubmit} className="flex border-2 border-nest-brown">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'agents' ? 'SEARCH FOR AN AGENT...' : 'WHERE WOULD YOU LIKE TO LIVE?'}
          className="flex-1 bg-white px-6 py-4 text-[15px] font-medium tracking-[0.1em] text-black placeholder:text-black/50 placeholder:uppercase focus:outline-none"
        />
        <button
          type="submit"
          className="bg-nest-brown px-6 flex items-center justify-center hover:bg-nest-brown/90 transition-colors"
          aria-label="Search"
        >
          <Search className="h-6 w-6 text-white" />
        </button>
      </form>
    </div>
  )
}
