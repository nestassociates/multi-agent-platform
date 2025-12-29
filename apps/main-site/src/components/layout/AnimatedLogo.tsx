'use client'

import { useEffect, useRef, useCallback } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import logoAnimation from '../../../public/animations/nest-logo.json'
import logoAnimationWhite from '../../../public/animations/nest-logo-white.json'

interface AnimatedLogoProps {
  variant?: 'dark' | 'white'
  className?: string
  width?: number
  height?: number
  pauseDuration?: number // Duration to pause on first frame (ms)
}

export function AnimatedLogo({
  variant = 'dark',
  className,
  width,
  height,
  pauseDuration = 5000,
}: AnimatedLogoProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const animationData = variant === 'white' ? logoAnimationWhite : logoAnimation

  const playAfterDelay = useCallback(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Wait pauseDuration then play
    timerRef.current = setTimeout(() => {
      lottieRef.current?.play()
    }, pauseDuration)
  }, [pauseDuration])

  const handleComplete = useCallback(() => {
    // Go back to first frame
    lottieRef.current?.goToAndStop(0, true)
    // Schedule next play
    playAfterDelay()
  }, [playAfterDelay])

  useEffect(() => {
    // Start the first cycle after component mounts
    playAfterDelay()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [playAfterDelay])

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop={false}
      autoplay={false}
      onComplete={handleComplete}
      className={className}
      style={{
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
      }}
    />
  )
}
