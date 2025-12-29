'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [isPaused, setIsPaused] = useState(true)
  const animationData = variant === 'white' ? logoAnimationWhite : logoAnimation

  useEffect(() => {
    const lottie = lottieRef.current
    if (!lottie) return

    // Start paused at first frame
    lottie.goToAndStop(0, true)

    const startCycle = () => {
      // Pause for 5 seconds on first frame
      setIsPaused(true)
      lottie.goToAndStop(0, true)

      const pauseTimer = setTimeout(() => {
        setIsPaused(false)
        lottie.play()
      }, pauseDuration)

      return pauseTimer
    }

    const pauseTimer = startCycle()

    return () => {
      clearTimeout(pauseTimer)
    }
  }, [pauseDuration])

  const handleComplete = () => {
    const lottie = lottieRef.current
    if (!lottie) return

    // Go back to first frame and pause
    lottie.goToAndStop(0, true)
    setIsPaused(true)

    // Wait 5 seconds then play again
    setTimeout(() => {
      setIsPaused(false)
      lottie.play()
    }, pauseDuration)
  }

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
