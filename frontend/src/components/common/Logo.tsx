interface Props {
  readonly size?: number
}

export default function Logo({ size = 40 }: Props) {
  const id = `logo-${size}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="PPManager Logo"
    >
      <defs>
        {/* Metal plate gradient */}
        <linearGradient id={`${id}-plate`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a4258" />
          <stop offset="50%" stopColor="#2e3440" />
          <stop offset="100%" stopColor="#252a35" />
        </linearGradient>
        {/* Inner bevel highlight */}
        <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
        </linearGradient>
        {/* Blue LED glow */}
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0.29 0 0 0 0 0.62 0 0 0 0 1 0 0 0 0.6 0"
            result="blueglow"
          />
          <feMerge>
            <feMergeNode in="blueglow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Orange accent glow */}
        <filter id={`${id}-oglow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 0.54 0 0 0 0 0.24 0 0 0 0.5 0"
            result="orangeglow"
          />
          <feMerge>
            <feMergeNode in="orangeglow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Panel drop shadow */}
        <filter id={`${id}-shadow`} x="-10%" y="-5%" width="120%" height="130%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer metal plate */}
      <rect
        x="1" y="1" width="38" height="38" rx="8"
        fill={`url(#${id}-plate)`}
        stroke="#4a5368"
        strokeWidth="0.5"
        filter={`url(#${id}-shadow)`}
      />
      {/* Inner bevel overlay */}
      <rect
        x="1.5" y="1.5" width="37" height="37" rx="7.5"
        fill={`url(#${id}-bevel)`}
      />
      {/* Top edge highlight line */}
      <line x1="8" y1="1.5" x2="32" y2="1.5" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

      {/* Panel screws */}
      <circle cx="5" cy="5" r="1.2" fill="#2a3040" stroke="#3a4258" strokeWidth="0.4" />
      <circle cx="5" cy="5" r="0.4" fill="#3a4258" />
      <circle cx="35" cy="5" r="1.2" fill="#2a3040" stroke="#3a4258" strokeWidth="0.4" />
      <circle cx="35" cy="5" r="0.4" fill="#3a4258" />
      <circle cx="5" cy="35" r="1.2" fill="#2a3040" stroke="#3a4258" strokeWidth="0.4" />
      <circle cx="5" cy="35" r="0.4" fill="#3a4258" />
      <circle cx="35" cy="35" r="1.2" fill="#2a3040" stroke="#3a4258" strokeWidth="0.4" />
      <circle cx="35" cy="35" r="0.4" fill="#3a4258" />

      {/* PP text with blue LED glow */}
      <text
        x="20" y="19"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'IBM Plex Sans', system-ui, sans-serif"
        fontWeight="700"
        fontSize="16"
        fill="#4a9eff"
        filter={`url(#${id}-glow)`}
      >
        PP
      </text>

      {/* Divider line */}
      <line x1="10" y1="27" x2="30" y2="27" stroke="#3a4258" strokeWidth="0.4" opacity="0.7" />

      {/* DNA helix motif — alternating blue/orange LED dots */}
      <circle cx="12" cy="31.5" r="1" fill="#ff8a3d" filter={`url(#${id}-oglow)`} opacity="0.9" />
      <circle cx="16" cy="33" r="0.6" fill="#4a9eff" opacity="0.45" />
      <circle cx="20" cy="31.5" r="1" fill="#4a9eff" filter={`url(#${id}-glow)`} opacity="0.55" />
      <circle cx="24" cy="33" r="0.6" fill="#ff8a3d" opacity="0.45" />
      <circle cx="28" cy="31.5" r="1" fill="#ff8a3d" filter={`url(#${id}-oglow)`} opacity="0.9" />

      {/* Status LED — green power indicator */}
      <circle cx="29" cy="10" r="1.8" fill="#22c55e" opacity="0.12" />
      <circle cx="29" cy="10" r="0.9" fill="#22c55e" opacity="0.85" />
    </svg>
  )
}
