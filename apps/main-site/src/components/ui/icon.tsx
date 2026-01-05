'use client'

import { cn } from '@/lib/utils'

export type IconName =
  | 'bathroom'
  | 'bedrooms'
  | 'dropdown'
  | 'energy'
  | 'expand'
  | 'facebook'
  | 'filter'
  | 'floorplan'
  | 'instagram'
  | 'map-pin'
  | 'property-size'
  | 'property-type'
  | 'search'
  | 'share'
  | 'star'
  | 'swipe'
  | 'tiktok'
  | 'utilities'
  | 'video'

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

// SVG icon components - using currentColor for CSS color inheritance
// These match the actual SVG files in /public/icons/
const icons: Record<IconName, React.FC<{ className?: string }>> = {
  bedrooms: ({ className }) => (
    <svg viewBox="0 0 50 42" fill="none" className={className}>
      <path d="M8.24312 6.42845C8.34987 6.55892 8.36173 6.58264 8.38545 6.5945C8.46847 6.63008 8.56336 6.67752 8.64638 6.67752C19.4988 6.67752 30.3394 6.67752 41.1919 6.67752C41.3105 6.67752 41.4291 6.64194 41.5596 6.61822C41.5833 6.61822 41.6189 6.5945 41.6426 6.57078C41.6663 6.54705 41.6782 6.52333 41.7256 6.45217C41.6544 5.94216 41.3579 5.52704 41.014 5.12378C39.8398 3.74795 38.286 3.30911 36.5662 3.30911C28.8806 3.30911 21.183 3.29725 13.4974 3.32097C12.762 3.32097 11.9911 3.41585 11.2794 3.62935C9.8443 4.05633 8.78871 4.98145 8.24312 6.42845ZM42.1289 17.7079C42.1644 17.4114 42.2238 17.2097 42.2238 16.9962C42.2238 14.9681 42.2356 12.9399 42.2238 10.9118C42.2238 10.0459 42.1644 9.99849 41.2275 9.99849C38.8909 9.99849 36.5425 9.99849 34.206 9.99849C32.0829 9.99849 29.9599 9.99849 27.8368 9.99849C26.6745 9.99849 26.6508 10.0222 26.6508 11.2201C26.6508 12.3706 26.6508 13.533 26.6508 14.6834C26.6508 15.5018 26.6626 16.3083 26.6508 17.1149C26.6508 17.5418 26.8168 17.7672 27.2438 17.779C27.398 17.779 27.5522 17.7909 27.7182 17.7909C32.2134 17.7909 36.7086 17.7909 41.2037 17.7909C41.5003 17.7672 41.8086 17.7316 42.1289 17.7079ZM7.85172 17.6842C8.1601 17.7197 8.43289 17.7672 8.70568 17.7672C13.2602 17.7672 17.8265 17.7672 22.381 17.7672C23.3061 17.7672 23.3417 17.7079 23.3535 16.8183C23.3654 14.8851 23.3654 12.9518 23.3535 11.0066C23.3535 10.0341 23.2942 9.97477 22.2624 9.97477C17.7672 9.97477 13.272 9.97477 8.77685 9.97477C7.81614 9.97477 7.79242 9.99849 7.78056 10.9829C7.78056 12.9518 7.78056 14.9206 7.78056 16.8776C7.78056 17.1386 7.828 17.3758 7.85172 17.6842ZM24.9784 21.1475C18.1349 21.1475 11.2794 21.1475 4.43587 21.1475C3.35655 21.1475 3.33283 21.183 3.33283 22.2624C3.33283 24.1126 3.33283 25.951 3.33283 27.8013C3.33283 28.845 3.41585 28.9162 4.44773 28.9162C18.1704 28.9162 31.905 28.9162 45.6396 28.9162C46.6122 28.9162 46.6952 28.8331 46.6952 27.8368C46.6952 26.0222 46.6952 24.2075 46.6952 22.3928C46.6952 21.1593 46.6952 21.1475 45.438 21.1475C38.6063 21.1475 31.7864 21.1475 24.9784 21.1475ZM49.9331 41.6663C48.9962 41.6663 48.1541 41.6663 47.312 41.6663C46.8257 41.6663 46.6715 41.3817 46.6715 40.9309C46.6715 40.3023 46.6715 39.6856 46.6715 39.057C46.6715 37.183 46.6715 35.309 46.6715 33.435C46.6715 32.2371 46.6715 32.2371 45.4736 32.2371C31.9287 32.2371 18.3958 32.2371 4.85099 32.2371C4.54261 32.2371 4.22237 32.2371 3.914 32.2371C3.53446 32.2371 3.33283 32.4388 3.32097 32.8183C3.30911 33.0674 3.30911 33.3164 3.30911 33.5655C3.30911 35.9139 3.30911 38.2505 3.30911 40.5989C3.30911 41.6189 3.24981 41.69 2.26538 41.6782C1.53002 41.6663 0.770939 41.7968 0 41.5596V17.8383C0.462564 17.8146 0.877685 17.7909 1.30467 17.779C2.05188 17.7672 2.81096 17.7909 3.55818 17.7672C4.32912 17.7553 4.40028 17.6723 4.40028 16.8776C4.41215 14.5292 4.40028 12.1927 4.40028 9.8443C4.40028 8.338 4.42401 6.84357 4.99331 5.40844C5.95402 2.97701 7.65009 1.31653 10.1408 0.450702C11.1727 0.0948843 12.2164 0.0118604 13.2839 0.0118604C21.1 -1.81155e-07 28.9162 0.0118606 36.7323 0C38.8909 0 40.8598 0.533727 42.544 1.957C44.6789 3.75981 45.5566 6.12007 45.5684 8.83615C45.5803 11.398 45.5684 13.9599 45.5684 16.5337C45.5684 16.7235 45.5684 16.9132 45.5684 17.0911C45.5447 17.5774 45.8057 17.7672 46.2564 17.7672C47.134 17.7672 48.0117 17.7672 48.8775 17.7672C49.1859 17.7672 49.4943 17.7672 49.8976 17.7672C49.9331 18.1349 49.9924 18.4432 49.9924 18.7398C49.9924 26.0815 49.9924 33.435 49.9924 40.7886C50.0162 41.0258 49.9806 41.263 49.9331 41.6663Z" fill="currentColor"/>
    </svg>
  ),
  bathroom: ({ className }) => (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M23.974 16.0586C25.1998 16.0586 26.4256 16.0708 27.6514 16.0586C28.681 16.0463 28.8894 15.7399 28.6933 14.698C28.5339 13.8399 28.1294 13.0922 27.5778 12.467C26.4133 11.1554 24.9669 10.4444 23.1895 10.7877C21.2527 11.1554 19.6347 12.8347 19.2669 14.7838C19.0831 15.7521 19.316 16.0463 20.3089 16.0708C21.5224 16.0708 22.7482 16.0586 23.974 16.0586ZM3.44189 30.094C3.44189 30.4127 3.39286 30.6578 3.45415 30.8785C3.66254 31.6875 3.87092 32.521 4.15285 33.3055C4.91285 35.3894 6.17542 37.1423 7.83024 38.5887C10.4657 40.881 13.5792 41.8739 17.0237 41.8984C21.6695 41.9229 26.3153 41.9229 30.961 41.8861C32.6404 41.8739 34.3074 41.6655 35.901 41.0648C39.1616 39.839 41.6132 37.6816 43.2435 34.5926C43.8687 33.4159 44.2609 32.141 44.5183 30.8417C44.6409 30.1798 44.5306 30.0572 43.8319 30.0327C43.7461 30.0327 43.648 30.0327 43.5622 30.0327C30.4952 30.0327 17.4282 30.0327 4.36124 30.0327C4.06705 30.0449 3.78512 30.0817 3.44189 30.094ZM34.0868 47.7699V45.0364H13.9592C13.9225 45.2448 13.8612 45.4654 13.8489 45.6983C13.8366 46.1274 13.8489 46.5441 13.8489 46.9732C13.8366 47.7332 13.7999 47.7699 13.0154 47.7945C12.5373 47.8067 12.0592 47.8067 11.5812 47.7945C10.7231 47.7822 10.6496 47.7086 10.6373 46.8751C10.6373 46.1764 10.6128 45.4777 10.6496 44.7913C10.6741 44.2642 10.4534 43.97 9.9999 43.7371C9.14185 43.308 8.28379 42.8668 7.48702 42.3519C4.97414 40.7461 3.09867 38.5274 1.75029 35.8675C0.401918 33.1952 -0.0761437 30.3269 0.00966207 27.3482C0.00966207 27.2379 0.0709521 27.1153 0.119984 26.9191C0.499981 26.8946 0.879978 26.8701 1.25998 26.8701C15.2831 26.8701 29.3062 26.8701 43.3293 26.8701C44.7635 26.8701 44.7635 26.8701 44.7635 25.4359C44.7635 23.0824 44.788 20.7166 44.7512 18.3631C44.739 17.0392 44.7145 15.6908 44.5306 14.3792C44.3835 13.3496 44.0648 12.3076 43.648 11.3515C42.2506 8.1522 39.9584 5.79867 36.8081 4.35223C35.1287 3.57998 33.3145 3.16321 31.4881 3.23675C29.012 3.33482 27.0875 4.47481 26.1069 6.91414C25.8249 7.62511 25.8495 7.73543 26.5482 7.95607C27.921 8.39736 29.0856 9.18187 30.0172 10.2851C31.4513 12.0012 32.1868 13.9625 31.8559 16.2302C31.6597 17.5786 30.8507 18.4857 29.6372 18.976C29.0733 19.2089 28.4114 19.3069 27.7985 19.3192C25.2488 19.356 22.7114 19.356 20.1618 19.3315C18.5314 19.3069 17.1708 18.7063 16.4231 17.1373C15.896 16.0463 15.9695 14.8818 16.2515 13.7663C16.8889 11.1799 18.3843 9.20638 20.8605 8.22575C22.0617 7.75994 22.6624 7.1593 23.0669 5.88447C23.8759 3.34708 25.7269 1.63096 28.1785 0.601292C29.2694 0.147747 30.4217 -0.0116068 31.5984 0.000651196C33.7558 0.0129092 35.8519 0.417422 37.8132 1.27548C40.13 2.29289 42.1893 3.72707 43.8687 5.70061C44.8983 6.90189 45.7441 8.21349 46.4061 9.63541C47.0312 10.9715 47.448 12.3935 47.6931 13.8644C48.0241 15.8502 47.9996 17.836 47.9996 19.834C47.9873 22.5308 47.9873 25.2153 47.9996 27.912C48.0119 31.4178 47.1661 34.6784 45.2416 37.6081C43.5254 40.2068 41.2822 42.1926 38.4629 43.5164C38.279 43.6022 38.0952 43.7126 37.899 43.7861C37.47 43.9577 37.3352 44.2642 37.3474 44.7177C37.3719 45.5022 37.3474 46.2867 37.3597 47.0712C37.3597 47.4512 37.2739 47.7577 36.8448 47.7699C35.9378 47.7822 35.0797 47.7699 34.0868 47.7699Z" fill="currentColor"/>
      <path d="M22.397 23.0593C22.397 22.5813 22.3848 22.1032 22.397 21.6129C22.4215 21.0123 22.4951 20.9142 23.059 20.9019C23.6841 20.8897 24.3093 20.9019 24.9344 20.9019C25.3389 20.9019 25.5596 21.0613 25.5473 21.4781C25.5473 22.5322 25.5473 23.5864 25.5473 24.6406C25.5473 25.0451 25.3267 25.2413 24.9222 25.2413C24.297 25.2413 23.6719 25.229 23.0467 25.2413C22.5932 25.2535 22.3848 25.0329 22.3848 24.5916C22.397 24.0767 22.397 23.5619 22.397 23.0593Z" fill="currentColor"/>
      <path d="M28.7837 22.997C28.7837 22.4822 28.7837 21.9674 28.7837 21.4525C28.7837 21.0848 28.9554 20.8887 29.3231 20.8887C29.985 20.8887 30.647 20.9009 31.2966 20.8887C31.7624 20.8887 31.934 21.1338 31.934 21.5751C31.934 22.568 31.934 23.5732 31.934 24.5661C31.934 25.0073 31.7257 25.2402 31.2721 25.228C30.647 25.2157 30.0095 25.2157 29.3844 25.228C28.9799 25.228 28.7715 25.0319 28.7715 24.6274C28.7837 24.088 28.7837 23.5486 28.7837 22.997Z" fill="currentColor"/>
      <path d="M19.1601 23.0951C19.1601 23.6099 19.1601 24.1248 19.1601 24.6396C19.1601 25.0441 18.9762 25.2525 18.5594 25.2402C17.9343 25.228 17.3091 25.228 16.6717 25.228C16.2304 25.228 16.0098 24.9951 16.0098 24.5538C16.0098 23.5241 16.0098 22.5067 16.0098 21.4771C16.0098 21.1093 16.1814 20.9009 16.5491 20.9009C17.2356 20.8887 17.922 20.9009 18.6085 20.8887C18.9762 20.8887 19.1478 21.0971 19.1478 21.4525C19.1478 22.0041 19.1478 22.5558 19.1601 23.0951Z" fill="currentColor"/>
    </svg>
  ),
  'property-type': ({ className }) => (
    <svg viewBox="0 0 39 37" fill="none" className={className}>
      <path d="M12.7843 5.92391V1.25725H8.17492V11.6304C5.783 14.1667 3.21667 16.5254 0.75 18.9855L1.19849 19.087H5.38434C5.53384 19.087 5.83283 19.3913 5.83283 19.4674V35.75H32.7419V19.5181C32.7419 19.3406 33.1406 19.0109 33.315 19.0109H37.75L19.3123 0.75C19.2375 0.75 18.6396 1.30797 18.5399 1.40942C16.9204 2.95652 15.4005 4.60507 13.781 6.12681C13.5318 6.45652 12.8591 6.22826 12.7594 5.89855L12.7843 5.92391Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'property-size': ({ className }) => (
    <svg viewBox="0 0 37 37" fill="none" className={className}>
      <rect x=".8" y=".8" width="35.5" height="35.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M30.4,6h-6.8c-.4,0-.8.3-.8.8s.3.8.8.8h4.9L7.2,28.9v-4.9c0-.4-.3-.8-.8-.8s-.8.3-.8.8v6.8c0,.4.3.8.8.8h6.8c.4,0,.8-.3.8-.8s-.3-.8-.8-.8h-4.9L29.6,8.6v4.9c0,.4.3.8.8.8s.8-.3.8-.8v-6.8c0-.4-.3-.8-.8-.8Z" fill="currentColor"/>
    </svg>
  ),
  search: ({ className }) => (
    <svg viewBox="0 0 33 31" fill="none" className={className}>
      <circle cx="18.5992" cy="13.4605" r="12.7105" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="0.530217" y1="30.4697" x2="8.68811" y2="22.3118" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  filter: ({ className }) => (
    <svg viewBox="0 0 41 32" fill="none" className={className}>
      <path d="M20.9961 27.1738H40.4548" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10"/>
      <path d="M17.7541 30.7817C19.6721 30.7817 21.227 29.2268 21.227 27.3088C21.227 25.3908 19.6721 23.8359 17.7541 23.8359C15.8361 23.8359 14.2812 25.3908 14.2812 27.3088C14.2812 29.2268 15.8361 30.7817 17.7541 30.7817Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10"/>
      <path d="M0 27.1738H14.3195" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10"/>
      <path d="M34.3711 15.6973H40.4553" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10"/>
      <path d="M31.0471 19.2387C32.9651 19.2387 34.52 17.6839 34.52 15.7658C34.52 13.8478 32.9651 12.293 31.0471 12.293C29.1291 12.293 27.5742 13.8478 27.5742 15.7658C27.5742 17.6839 29.1291 19.2387 31.0471 19.2387Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10"/>
      <path d="M0 15.6973H27.5539" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10"/>
      <path d="M14.9062 4.22266H40.4567" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10"/>
      <path d="M11.6096 7.69576C13.5276 7.69576 15.0825 6.1409 15.0825 4.22288C15.0825 2.30486 13.5276 0.75 11.6096 0.75C9.69158 0.75 8.13672 2.30486 8.13672 4.22288C8.13672 6.1409 9.69158 7.69576 11.6096 7.69576Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10"/>
      <path d="M0 4.22266H8.24667" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10"/>
    </svg>
  ),
  share: ({ className }) => (
    <svg viewBox="0 0 36 36" fill="none" className={className}>
      <path d="M11.5209 20.3479C11.9042 19.5827 12.12 18.719 12.12 17.8049C12.12 16.8909 11.9042 16.0272 11.5209 15.262M11.5209 20.3479C10.5875 22.211 8.66062 23.4899 6.43498 23.4899C3.29525 23.4899 0.75 20.9447 0.75 17.8049C0.75 14.6652 3.29525 12.12 6.43498 12.12C8.66062 12.12 10.5875 13.3989 11.5209 15.262M11.5209 20.3479L24.089 26.632M11.5209 15.262L24.089 8.97794M24.089 8.97794C25.0223 10.841 26.9493 12.12 29.1749 12.12C32.3146 12.12 34.8599 9.57471 34.8599 6.43498C34.8599 3.29525 32.3146 0.75 29.1749 0.75C26.0352 0.75 23.4899 3.29525 23.4899 6.43498C23.4899 7.34907 23.7057 8.21277 24.089 8.97794ZM24.089 26.632C23.7057 27.3971 23.4899 28.2608 23.4899 29.1749C23.4899 32.3146 26.0352 34.8599 29.1749 34.8599C32.3146 34.8599 34.8599 32.3146 34.8599 29.1749C34.8599 26.0352 32.3146 23.4899 29.1749 23.4899C26.9493 23.4899 25.0223 24.7689 24.089 26.632Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  expand: ({ className }) => (
    <svg viewBox="0 0 39 39" fill="none" className={className}>
      <path d="M0.75 10V0.75M0.75 0.75H10M0.75 0.75L12.3125 12.3125M37.75 10V0.75M37.75 0.75H28.5M37.75 0.75L26.1875 12.3125M0.75 28.5V37.75M0.75 37.75H10M0.75 37.75L12.3125 26.1875M37.75 37.75L26.1875 26.1875M37.75 37.75V28.5M37.75 37.75H28.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="round"/>
    </svg>
  ),
  facebook: ({ className }) => (
    <svg viewBox="0 0 37 37" fill="none" className={className}>
      <path d="M21.6979 37C16.2456 37 10.8045 37 5.35228 37C5.18572 36.9447 5.03026 36.8672 4.86369 36.8229C2.12093 36.2253 0.0111042 33.6907 0.0111042 30.9569C0.0111042 22.4678 0.0111043 13.9898 0 5.50075C0 4.22794 0.444173 3.16542 1.24368 2.20251C2.3097 0.8965 3.78657 0.376309 5.35228 0C14.2913 0 23.2302 0 32.1692 0C32.247 0.0442716 32.3136 0.132815 32.3913 0.132815C34.9009 0.409512 37.0329 2.7227 36.9996 5.79958C36.9219 14.1448 36.9774 22.501 36.9552 30.8462C36.9552 31.5435 36.8442 32.2519 36.6332 32.9159C35.9447 35.1295 34.3346 36.3802 32.1581 36.9889C30.7368 36.9889 29.3154 36.9889 27.8941 36.9889C27.8941 32.0416 27.8941 27.1053 27.8941 22.169C29.1489 22.0915 30.2704 21.9809 31.3919 21.9587C31.8916 21.9477 32.1359 21.8259 32.1692 21.2725C32.2581 20.0661 32.358 18.8597 32.569 17.6754C32.7022 16.9007 32.4246 16.7679 31.7473 16.79C30.4925 16.8343 29.2266 16.8011 27.9274 16.8011C27.9274 15.6943 27.9052 14.7203 27.9385 13.7574C27.9607 12.8609 28.4826 12.385 29.4154 12.3739C30.3037 12.3628 31.192 12.3961 32.0804 12.3518C32.2914 12.3407 32.6467 12.0751 32.6578 11.9201C32.7022 10.3374 32.68 8.75471 32.68 7.1388C30.5702 7.1388 28.5381 6.90637 26.5838 7.19414C23.0748 7.70326 21.6867 9.52947 21.6867 13.0601C21.6867 14.2997 21.6867 15.5283 21.6867 16.8896C20.6651 16.8896 19.6991 16.8896 18.7108 16.8896C18.7108 18.6605 18.7108 20.2985 18.7108 22.0141C19.7102 22.0694 20.6651 22.1137 21.6867 22.169C21.6979 27.1496 21.6979 32.0748 21.6979 37Z" fill="currentColor"/>
    </svg>
  ),
  instagram: ({ className }) => (
    <svg viewBox="0 0 30 30" fill="none" className={className}>
      <rect x="1.75" y="1.75" width="26.5" height="26.5" rx="6.25" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="15" cy="15" r="6.25" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="23" cy="7" r="2" fill="currentColor"/>
    </svg>
  ),
  tiktok: ({ className }) => (
    <svg viewBox="0 0 26 30" fill="none" className={className}>
      <path d="M10 12V26C10 27.5 11.5 29 14 29C16.5 29 18 27.5 18 26V1H22C22 1 22 6 26 8V14C26 14 22 14 18 12V26C18 28 15.5 30 12 30C8.5 30 6 27 6 24C6 21 8 18 12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'map-pin': ({ className }) => (
    <svg viewBox="0 0 24 32" fill="none" className={className}>
      <path d="M12 1C5.925 1 1 5.925 1 12C1 20 12 31 12 31C12 31 23 20 23 12C23 5.925 18.075 1 12 1Z" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  floorplan: ({ className }) => (
    <svg viewBox="0 0 30 30" fill="none" className={className}>
      <rect x="1" y="1" width="28" height="28" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="1" y1="15.75" x2="20" y2="15.75" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="15.75" y1="1" x2="15.75" y2="11" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="15.75" y1="20" x2="15.75" y2="29" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  energy: ({ className }) => (
    <svg viewBox="0 0 18 28" fill="none" className={className}>
      <path d="M10 1L1 16H9L8 27L17 12H9L10 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  video: ({ className }) => (
    <svg viewBox="0 0 28 20" fill="none" className={className}>
      <rect x="1" y="1" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M19 7L27 3V17L19 13V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  star: ({ className }) => (
    <svg viewBox="0 0 40 38" fill="none" className={className}>
      <path d="M19.9727 0L24.6875 14.5106H39.9448L27.6014 23.4787L32.3161 37.9894L19.9727 29.0213L7.62917 37.9894L12.344 23.4787L0.000469208 14.5106H15.2579L19.9727 0Z" fill="currentColor"/>
    </svg>
  ),
  utilities: ({ className }) => (
    <svg viewBox="0 0 30 30" fill="none" className={className}>
      <circle cx="15" cy="15" r="14.25" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M15 5V15L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  dropdown: ({ className }) => (
    <svg viewBox="0 0 43 26" fill="none" className={className}>
      <path d="M0.570312 0.486328L21.0703 24.4863L41.5703 0.486328" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  swipe: ({ className }) => (
    <svg viewBox="0 0 40 24" fill="none" className={className}>
      <path d="M8 12H32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 6L6 12L12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28 6L34 12L28 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
}

export function Icon({ name, size = 24, className }: IconProps) {
  const IconComponent = icons[name]
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return (
    <span
      className={cn('inline-block shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <IconComponent className="h-full w-full" />
    </span>
  )
}

// Convenience components for commonly used icons
export function BedroomsIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="bedrooms" size={size} className={className} />
}

export function BathroomIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="bathroom" size={size} className={className} />
}

export function PropertySizeIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="property-size" size={size} className={className} />
}

export function SearchIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="search" size={size} className={className} />
}

export function FilterIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="filter" size={size} className={className} />
}

export function ShareIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="share" size={size} className={className} />
}

export function ExpandIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="expand" size={size} className={className} />
}

export function FacebookIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="facebook" size={size} className={className} />
}

export function InstagramIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="instagram" size={size} className={className} />
}

export function TikTokIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="tiktok" size={size} className={className} />
}

export function MapPinIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="map-pin" size={size} className={className} />
}

export function FloorplanIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="floorplan" size={size} className={className} />
}

export function EnergyIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="energy" size={size} className={className} />
}

export function VideoIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="video" size={size} className={className} />
}

export function StarIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="star" size={size} className={className} />
}

export function PropertyTypeIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="property-type" size={size} className={className} />
}

export function UtilitiesIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="utilities" size={size} className={className} />
}

export function DropdownIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="dropdown" size={size} className={className} />
}

export function SwipeIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="swipe" size={size} className={className} />
}
