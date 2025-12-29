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

    let timeoutId: NodeJS.Timeout
    let isActive = true

    const runCycle = () => {
      if (!isActive) return

      // Go to first frame and stop
      lottie.goToAndStop(0, true)

      // Wait, then play
      timeoutId = setTimeout(() => {
        if (!isActive) return
        lottie.play()
      }, pauseDuration)
    }

    // Handle animation complete
    const onComplete = () => {
      runCycle()
    }

    // Subscribe to complete event
    lottie.animationItem?.addEventListener('complete', onComplete)

    // Start first cycle
    runCycle()

    return () => {
      isActive = false
      clearTimeout(timeoutId)
      lottie.animationItem?.removeEventListener('complete', onComplete)
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
