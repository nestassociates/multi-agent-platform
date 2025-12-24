/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@splidejs/react-splide' {
  import { ComponentType, ReactNode, Ref } from 'react'

  export interface SplideOptions {
    type?: 'slide' | 'loop' | 'fade'
    rewind?: boolean
    speed?: number
    width?: number | string
    height?: number | string
    fixedWidth?: number | string
    fixedHeight?: number | string
    heightRatio?: number
    autoWidth?: boolean
    autoHeight?: boolean
    perPage?: number
    perMove?: number
    clones?: number
    start?: number
    focus?: number | 'center'
    gap?: number | string
    padding?: number | string | { left?: number | string; right?: number | string }
    arrows?: boolean
    pagination?: boolean
    paginationKeyboard?: boolean
    direction?: 'ltr' | 'rtl' | 'ttb'
    drag?: boolean | 'free'
    snap?: boolean
    noDrag?: string
    flickPower?: number
    flickMaxPages?: number
    lazyLoad?: 'nearby' | 'sequential' | false
    preloadPages?: number
    mediaQuery?: 'min' | 'max'
    easing?: string
    keyboard?: boolean | 'global' | 'focused'
    wheel?: boolean
    wheelSleep?: number
    releaseWheel?: boolean
    updateOnMove?: boolean
    trimSpace?: boolean | 'move'
    autoplay?: boolean | 'pause'
    interval?: number
    pauseOnHover?: boolean
    pauseOnFocus?: boolean
    resetProgress?: boolean
    reducedMotion?: { speed?: number; rewindSpeed?: number; autoplay?: boolean }
    isNavigation?: boolean
    [key: string]: any
  }

  export interface SplideInstance {
    go: (control: number | string) => void
    index: number
    length: number
    destroy: () => void
    refresh: () => void
    on: (events: string, handler: (...args: any[]) => void) => void
    off: (events: string) => void
    emit: (event: string, ...args: any[]) => void
    Components: any
    state: any
    root: HTMLElement
    track: HTMLElement
    list: HTMLElement
    slides: HTMLElement[]
    [key: string]: any
  }

  export interface SplideProps {
    ref?: Ref<SplideInstance>
    options?: SplideOptions
    extensions?: Record<string, any>
    transition?: any
    hasTrack?: boolean
    tag?: keyof JSX.IntrinsicElements
    className?: string
    id?: string
    'aria-label'?: string
    'aria-labelledby'?: string
    onMounted?: (splide: SplideInstance) => void
    onUpdated?: (splide: SplideInstance) => void
    onMove?: (splide: SplideInstance, newIndex: number, prevIndex: number, destIndex: number) => void
    onMoved?: (splide: SplideInstance, newIndex: number, prevIndex: number, destIndex: number) => void
    onDrag?: (splide: SplideInstance) => void
    onDragging?: (splide: SplideInstance) => void
    onDragged?: (splide: SplideInstance) => void
    onVisible?: (splide: SplideInstance, slide: HTMLElement) => void
    onHidden?: (splide: SplideInstance, slide: HTMLElement) => void
    onActive?: (splide: SplideInstance, slide: HTMLElement) => void
    onInactive?: (splide: SplideInstance, slide: HTMLElement) => void
    onRefresh?: (splide: SplideInstance) => void
    onRefreshed?: (splide: SplideInstance) => void
    onScroll?: (splide: SplideInstance) => void
    onScrolled?: (splide: SplideInstance) => void
    onResize?: (splide: SplideInstance) => void
    onResized?: (splide: SplideInstance) => void
    onDestroy?: (splide: SplideInstance) => void
    onArrowsMounted?: (splide: SplideInstance, prev: HTMLElement, next: HTMLElement) => void
    onArrowsUpdated?: (splide: SplideInstance, prev: HTMLElement, next: HTMLElement) => void
    onPaginationMounted?: (splide: SplideInstance, data: any, item: HTMLElement) => void
    onPaginationUpdated?: (splide: SplideInstance, data: any, prev: HTMLElement, curr: HTMLElement) => void
    onNavigationMounted?: (splide: SplideInstance, splides: SplideInstance[]) => void
    onAutoplayPlay?: (splide: SplideInstance) => void
    onAutoplayPause?: (splide: SplideInstance) => void
    onAutoplayPlaying?: (splide: SplideInstance, rate: number) => void
    onLazyLoadLoaded?: (splide: SplideInstance, img: HTMLImageElement, slide: HTMLElement) => void
    children?: ReactNode
  }

  export interface SplideSlideProps {
    className?: string
    children?: ReactNode
    [key: string]: any
  }

  export interface SplideTrackProps {
    className?: string
    children?: ReactNode
  }

  export const Splide: ComponentType<SplideProps> & {
    splide?: SplideInstance
  }
  export const SplideSlide: ComponentType<SplideSlideProps>
  export const SplideTrack: ComponentType<SplideTrackProps>
}
