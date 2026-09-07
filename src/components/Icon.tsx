import type { CSSProperties, ReactNode } from 'react'

export type IconName = 'leaf' | 'ember' | 'tide' | 'stone' | 'gale' | 'spark' | 'compass' | 'book' | 'bag' | 'map' | 'sun' | 'moon' | 'volume' | 'mute' | 'settings' | 'close' | 'arrow' | 'chevron' | 'heart' | 'pod' | 'potion' | 'lure' | 'flag' | 'check' | 'lock' | 'footsteps' | 'home' | 'shop' | 'star' | 'download' | 'upload' | 'help' | 'refresh' | 'swap' | 'plus' | 'keyboard' | 'github'

const paths: Record<IconName, ReactNode> = {
  leaf: <><path d="M19 4C7 2 2 8 6 15c4 7 15 3 13-11Z" /><path d="m4 21 11-12M9 16l-1-5m5 1 4 1" /></>,
  ember: <path d="M13 2c2 6-3 6-1 10 2-1 3-3 3-5 7 7 4 15-3 15S1 14 6 8c0 4 2 4 3 5C8 8 13 7 13 2Z" />,
  tide: <><path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z" /><path d="M8 16c0 2 2 3 4 3" /></>,
  stone: <><path d="m8 3 9 2 5 10-8 7-11-5L2 9Z" /><path d="m8 3 2 9 7-7M3 17l7-5 4 10m-4-10 12 3" /></>,
  gale: <><path d="M3 8h13a3 3 0 1 0-3-3M2 12h18a3 3 0 1 1-3 3M5 17h5a2 2 0 1 1-2 2" /></>,
  spark: <path d="m14 2-3 8h8L9 22l2-9H4Z" />,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m16 8-3 5-5 3 3-5ZM12 1v3m0 16v3M1 12h3m16 0h3" /></>,
  book: <><path d="M3 4h7l2 2 2-2h7v16h-7l-2 1-2-1H3ZM12 6v15" /><path d="M6 8h3m-3 4h3m6-4h3m-3 4h3" /></>,
  bag: <><rect x="5" y="6" width="14" height="16" rx="4" /><path d="M9 6V4a3 3 0 0 1 6 0v2M5 12h14M9 15h6v4H9Z" /></>,
  map: <><path d="m2 5 7-3 6 3 7-3v17l-7 3-6-3-7 3ZM9 2v17m6-14v17" /><path d="m5 10 3 1 5-3 5 3" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
  moon: <path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z" />,
  volume: <><path d="m3 9 5 0 5-5v16l-5-5H3ZM17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
  mute: <><path d="m3 9 5 0 5-5v16l-5-5H3Zm14 0 5 6m0-6-5 6" /></>,
  settings: <><path d="m9 3 1-2h4l1 2 3 2 2 1 2 4-2 2v3l1 2-3 3-3-1-3 1-2 2-4-2v-3l-2-2-3-1v-4l3-1 2-3V3Z" /><circle cx="12" cy="12" r="3" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  arrow: <path d="M3 12h17m-6-6 6 6-6 6" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  heart: <path d="M12 21 3 12C-3 5 7-1 12 6c5-7 15-1 9 6Z" />,
  pod: <><path d="M12 2C6 5 3 9 4 15c2 9 14 9 16 0 1-6-2-10-8-13Z" /><path d="M12 2v7m0 7v6M4 11l5 2m6 0 5-2" /><circle cx="12" cy="13" r="3" /></>,
  potion: <><path d="M8 2h8v4H8Zm1 4v3l-4 7a4 4 0 0 0 4 6h6a4 4 0 0 0 4-6l-4-7V6M6 15h12" /><path d="M12 11v8m-3-4h6" /></>,
  lure: <><path d="M12 2v5m0 10v5M2 12h5m10 0h5M5 5l3 3m8 8 3 3M5 19l3-3M16 8l3-3" /><path d="m12 7 2 3 3 2-3 2-2 3-2-3-3-2 3-2Z" /></>,
  flag: <path d="M4 22V3c5-4 10 4 16 0v12c-6 4-11-4-16 0" />,
  check: <path d="m4 12 5 5L20 6" />,
  lock: <><rect x="5" y="10" width="14" height="12" rx="3" /><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3" /></>,
  footsteps: <><ellipse cx="8" cy="7" rx="3" ry="5" transform="rotate(-20 8 7)" /><ellipse cx="17" cy="13" rx="3" ry="5" transform="rotate(20 17 13)" /><path d="m6 15 4-1m5 7 4 1" /></>,
  home: <><path d="m2 11 10-9 10 9M5 9v13h14V9M9 22v-8h6v8" /></>,
  shop: <><path d="M3 10v12h18V10M2 10l3-8h14l3 8ZM8 2l-1 8m9-8 1 8M9 22v-7h6v7" /></>,
  star: <path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z" />,
  download: <><path d="M12 2v13m-5-5 5 5 5-5M3 15v7h18v-7" /></>,
  upload: <><path d="M12 15V2m-5 5 5-5 5 5M3 15v7h18v-7" /></>,
  help: <><circle cx="12" cy="12" r="10" /><path d="M8 8a4 4 0 0 1 8 0c0 3-4 3-4 6m0 3v1" /></>,
  refresh: <><path d="M21 10a9 9 0 0 0-16-5L2 8m0-6v6h6M3 14a9 9 0 0 0 16 5l3-3m0 6v-6h-6" /></>,
  swap: <><path d="M3 7h17l-5-5m5 5-5 5M21 17H4l5-5m-5 5 5 5" /></>,
  plus: <path d="M12 4v16M4 12h16" />,
  keyboard: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M6 9h.5M10 9h.5M14 9h.5M18 9h.5M6 13h.5M10 13h.5M14 13h.5M18 13h.5M7 16h10" /></>,
  github: <><path d="M9 21c-5 2-5-3-7-3m14 5v-4c0-1-.1-2-1-3 5-.5 7-2 7-6 0-2-.6-3-2-4 .3-1 .3-3-.1-4-2-.5-4 1-5 2a16 16 0 0 0-6 0C8 3 6 1.5 4 2c-.4 1-.4 3-.1 4C2.5 7 2 8 2 10c0 4 2 5.5 7 6-.9 1-1 2-1 3v4" /></>,
}

export function Icon({ name, size = 20, className = '', style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  return <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>{paths[name]}</svg>
}
