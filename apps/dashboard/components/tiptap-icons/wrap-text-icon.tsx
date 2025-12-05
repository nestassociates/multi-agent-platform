import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

export const WrapTextLeftIcon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Image placeholder on left */}
      <rect x="3" y="5" width="8" height="8" rx="1" fill="currentColor" opacity="0.3" stroke="none" />
      {/* Text lines on right */}
      <line x1="14" y1="6" x2="21" y2="6" />
      <line x1="14" y1="10" x2="21" y2="10" />
      {/* Full width lines below */}
      <line x1="3" y1="16" x2="21" y2="16" />
      <line x1="3" y1="20" x2="17" y2="20" />
    </svg>
  )
})

WrapTextLeftIcon.displayName = "WrapTextLeftIcon"

export const WrapTextRightIcon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Image placeholder on right */}
      <rect x="13" y="5" width="8" height="8" rx="1" fill="currentColor" opacity="0.3" stroke="none" />
      {/* Text lines on left */}
      <line x1="3" y1="6" x2="10" y2="6" />
      <line x1="3" y1="10" x2="10" y2="10" />
      {/* Full width lines below */}
      <line x1="3" y1="16" x2="21" y2="16" />
      <line x1="3" y1="20" x2="17" y2="20" />
    </svg>
  )
})

WrapTextRightIcon.displayName = "WrapTextRightIcon"
