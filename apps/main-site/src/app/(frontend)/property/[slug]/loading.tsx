export default function PropertyLoading() {
  return (
    <div className="container-wide py-8">
      <div className="space-y-8">
        {/* Main Content - Full Width */}
        <div>
          {/* Gallery Skeleton */}
          <div className="grid gap-2 lg:grid-cols-4">
            <div className="col-span-full aspect-[4/3] animate-pulse bg-nest-gray lg:col-span-3" />
            <div className="hidden flex-col gap-2 lg:flex">
              <div className="aspect-[4/3] animate-pulse bg-nest-gray" />
              <div className="aspect-[4/3] animate-pulse bg-nest-gray" />
              <div className="aspect-[4/3] animate-pulse bg-nest-gray" />
            </div>
          </div>

          {/* Price and Location */}
          <div className="mt-6 flex items-start justify-between">
            <div>
              <div className="h-8 w-40 animate-pulse rounded bg-nest-gray" />
              <div className="mt-2 h-4 w-24 animate-pulse rounded bg-nest-gray" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-10 animate-pulse rounded bg-nest-gray" />
              <div className="h-10 w-10 animate-pulse rounded bg-nest-gray" />
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-6 grid grid-cols-3 gap-4 md:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="hidden md:block">
                <div className="mx-auto h-6 w-6 animate-pulse rounded bg-nest-gray" />
                <div className="mx-auto mt-2 h-4 w-16 animate-pulse rounded bg-nest-gray" />
              </div>
            ))}
            {[1, 2, 3].map((i) => (
              <div key={i} className="md:hidden">
                <div className="mx-auto h-6 w-6 animate-pulse rounded bg-nest-gray" />
                <div className="mx-auto mt-2 h-4 w-16 animate-pulse rounded bg-nest-gray" />
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="mt-8">
            <div className="h-12 w-40 animate-pulse rounded bg-nest-gray" />
          </div>

          {/* Description Skeleton */}
          <div className="mt-12 border-t border-nest-gray pt-8">
            <div className="h-6 w-48 animate-pulse rounded bg-nest-gray" />
            <div className="mt-6 space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-nest-gray" />
              <div className="h-4 w-full animate-pulse rounded bg-nest-gray" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-nest-gray" />
              <div className="h-4 w-full animate-pulse rounded bg-nest-gray" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-nest-gray" />
            </div>
          </div>

          {/* Details Grid Skeleton */}
          <div className="mt-12 border-t border-nest-gray pt-8">
            <div className="h-6 w-40 animate-pulse rounded bg-nest-gray" />
            <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-4 w-20 animate-pulse rounded bg-nest-gray" />
                  <div className="mt-2 h-5 w-24 animate-pulse rounded bg-nest-gray" />
                </div>
              ))}
            </div>
          </div>

          {/* Accordions Skeleton */}
          <div className="mt-12 space-y-4 border-t border-nest-gray pt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-nest-gray pb-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-32 animate-pulse rounded bg-nest-gray" />
                  <div className="h-5 w-5 animate-pulse rounded bg-nest-gray" />
                </div>
              </div>
            ))}
          </div>

          {/* Map Skeleton */}
          <div className="mt-12 border-t border-nest-gray pt-8">
            <div className="h-6 w-40 animate-pulse rounded bg-nest-gray" />
            <div className="mt-6 aspect-[16/9] animate-pulse rounded bg-nest-gray" />
          </div>
        </div>

      </div>
    </div>
  )
}
