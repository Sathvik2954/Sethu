type LogoProps = {
  variant?: 'light' | 'dark'
  size?: number
}

// SETHU mark — inspired by the Kakatiya Kala Thoranam (Warangal Gate):
// four pillars, a carved lintel, a base platform, and the corner
// finials reduced to two orange accent dots.
export default function Logo({ variant = 'light', size = 48 }: LogoProps) {
  const ink = variant === 'light' ? '#1C1208' : '#F2EDE6'
  const accent = '#D94F00'
  const height = Math.round(size * 0.9)

  return (
    <svg width={size} height={height} viewBox="0 0 100 90" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="6" r="4" fill={accent} />
      <circle cx="92" cy="6" r="4" fill={accent} />
      <rect x="8" y="10" width="84" height="10" fill={ink} />
      <rect x="12" y="20" width="8" height="50" fill={ink} />
      <rect x="30" y="20" width="8" height="50" fill={ink} />
      <rect x="58" y="20" width="8" height="50" fill={ink} />
      <rect x="76" y="20" width="8" height="50" fill={ink} />
      <rect x="8" y="78" width="84" height="3" fill={ink} />
    </svg>
  )
}
