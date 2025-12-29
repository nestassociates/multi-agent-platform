'use client'

import { useEffect, useRef } from 'react'
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
  const animationData = variant === 'white' ? logoAnimationWhite : logoAnimation

  useEffect(() => {
    const lottie = lottieRef.current
    if (!lottie) return

    // Get animation duration in ms (getDuration returns seconds)
    const getAnimationDuration = () => {
      const duration = lottie.getDuration()
      return duration ? duration * 1000 : 2000 // fallback to 2s
    }

    let pauseTimeoutId: NodeJS.Timeout
    let playTimeoutId: NodeJS.Timeout
    let isActive = true

    const runCycle = () => {
      if (!isActive) return

      // Immediately jump to first frame (resting bird position)
      lottie.goToAndStop(0, true)

      // Wait pauseDuration, then play the animation
      pauseTimeoutId = setTimeout(() => {
        if (!isActive) return

        lottie.play()

        // After animation completes, start next cycle
        const animDuration = getAnimationDuration()
        playTimeoutId = setTimeout(() => {
          if (!isActive) return
          runCycle()
        }, animDuration)
      }, pauseDuration)
    }

    // Start the cycle
    runCycle()

    return () => {
      isActive = false
      clearTimeout(pauseTimeoutId)
      clearTimeout(playTimeoutId)
    }
  }, [pauseDuration])

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop={false}
      autoplay={false}
      className={className}
      style={{
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
      }}
    />
  )
}
