/**
 * Conjunto de ícones em SVG usados apenas pela Home.
 * Todos herdam a cor do texto (`currentColor`) e escalam pelo `font-size`/width do pai.
 */

function Svg({ children, size = 24, viewBox = "0 0 24 24", ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

/* ---------- Naipes das cartas ---------- */

export function SpadeIcon(props) {
  return (
    <Svg {...props}>
      <path
        d="M12 2.5c0 0-7.6 5.4-7.6 10.2a4.2 4.2 0 0 0 6.8 3.3L10 21.5h4l-1.2-5.5a4.2 4.2 0 0 0 6.8-3.3C19.6 7.9 12 2.5 12 2.5Z"
        fill="currentColor"
      />
    </Svg>
  )
}

export function HeartIcon(props) {
  return (
    <Svg {...props}>
      <path
        d="M12 20.8S3.4 15.4 3.4 9.6a4.6 4.6 0 0 1 8.6-2.3 4.6 4.6 0 0 1 8.6 2.3c0 5.8-8.6 11.2-8.6 11.2Z"
        fill="currentColor"
      />
    </Svg>
  )
}

export function DiamondIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 2.2 20.4 12 12 21.8 3.6 12 12 2.2Z" fill="currentColor" />
    </Svg>
  )
}

export function ClubIcon(props) {
  return (
    <Svg {...props}>
      <g fill="currentColor">
        <circle cx="12" cy="7.2" r="3.7" />
        <circle cx="6.9" cy="13.3" r="3.7" />
        <circle cx="17.1" cy="13.3" r="3.7" />
        <path d="M10.3 14.4h3.4L14.8 21.5H9.2l1.1-7.1Z" />
      </g>
    </Svg>
  )
}

/* ---------- Música ---------- */

export function MusicNoteIcon(props) {
  return (
    <Svg {...props}>
      <path
        d="M9.4 17.2V5.9l8.4-1.7v11.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="7.1" cy="17.8" rx="2.7" ry="2.2" fill="currentColor" transform="rotate(-16 7.1 17.8)" />
      <ellipse cx="15.5" cy="16.1" rx="2.7" ry="2.2" fill="currentColor" transform="rotate(-16 15.5 16.1)" />
    </Svg>
  )
}

export function SingleNoteIcon(props) {
  return (
    <Svg {...props}>
      <path
        d="M10.2 16.6V5.4l7.2-1.5v10.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="7.9" cy="17.2" rx="2.6" ry="2.1" fill="currentColor" transform="rotate(-16 7.9 17.2)" />
    </Svg>
  )
}

/* ---------- Interface ---------- */

export function UsersIcon(props) {
  return (
    <Svg {...props}>
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.4 19.2c.5-3 2.8-4.8 5.6-4.8s5.1 1.8 5.6 4.8" />
        <path d="M16 5.2a3.2 3.2 0 0 1 0 5.9M17.2 14.7c2.1.5 3.5 2.2 3.9 4.5" />
      </g>
    </Svg>
  )
}

export function SearchIcon(props) {
  return (
    <Svg {...props}>
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="10.8" cy="10.8" r="6.3" />
        <path d="m15.6 15.6 4.1 4.1" />
      </g>
    </Svg>
  )
}

export function BoltIcon(props) {
  return (
    <Svg {...props}>
      <path
        d="M13.2 2.5 4.8 13.1h5.4l-.6 8.4 8.6-10.8h-5.6l.6-8.2Z"
        fill="currentColor"
      />
    </Svg>
  )
}

export function CardsIcon(props) {
  return (
    <Svg {...props}>
      <g stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
        <rect x="9" y="5.4" width="10.6" height="14.2" rx="2.4" />
        <path d="M6.6 17.7 4.9 8.2a2.4 2.4 0 0 1 1.9-2.8l3-.6" />
      </g>
    </Svg>
  )
}

export function SparkleIcon(props) {
  return (
    <Svg {...props}>
      <path
        d="M12 2.6c.7 5 1.7 6 6.6 6.7-4.9.7-5.9 1.7-6.6 6.6-.7-4.9-1.7-5.9-6.6-6.6 4.9-.7 5.9-1.7 6.6-6.7Z"
        fill="currentColor"
      />
    </Svg>
  )
}

export function PlusIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 5.2v13.6M5.2 12h13.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  )
}

export function QuestionIcon(props) {
  return (
    <Svg {...props}>
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8.6" />
        <path d="M9.6 9.5a2.5 2.5 0 0 1 4.9.6c0 1.7-2.4 2-2.4 3.6" />
        <path d="M12.1 17h.01" />
      </g>
    </Svg>
  )
}

export function CloseIcon(props) {
  return (
    <Svg {...props}>
      <path d="M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  )
}

export function ArrowRightIcon(props) {
  return (
    <Svg {...props}>
      <path
        d="M4.8 12h14.4m-5.6-5.6L19.2 12l-5.6 5.6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

/* ---------- Marca ---------- */

export function LogoMark({ size = 38 }) {
  return (
    <Svg size={size} viewBox="0 0 40 40">
      <defs>
        <linearGradient id="baile-logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#baile-logo-gradient)" />
      <rect
        x="8.5"
        y="10"
        width="13"
        height="19"
        rx="3"
        fill="#ffffff"
        opacity="0.42"
        transform="rotate(-14 15 19.5)"
      />
      <rect x="16" y="9.5" width="15.5" height="21" rx="3.6" fill="#ffffff" />
      <g transform="translate(19.4 13.6) scale(0.62)" fill="#7c3aed" stroke="#7c3aed">
        <path
          d="M9.4 17.2V5.9l8.4-1.7v11.2"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <ellipse cx="7.1" cy="17.8" rx="2.9" ry="2.4" stroke="none" transform="rotate(-16 7.1 17.8)" />
        <ellipse cx="15.5" cy="16.1" rx="2.9" ry="2.4" stroke="none" transform="rotate(-16 15.5 16.1)" />
      </g>
    </Svg>
  )
}
