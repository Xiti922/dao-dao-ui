export function Logo({
  width = 28,
  height = 28,
  alt = '',
}: {
  width?: number
  height?: number
  alt?: string
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 28 28`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={alt}
    >
      <circle
        cx="8.5"
        cy="14"
        r="1.5"
        transform="rotate(-180 8.5 14)"
        style={{ fill: 'var(--logo-fill)' }}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14 0C6.26801 0 0 6.26801 0 14C0 21.732 6.26801 28 14 28C21.732 28 28 21.732 28 14C28 6.26801 21.732 0 14 0ZM14 1.25C6.95837 1.25 1.25 6.95837 1.25 14C1.25 21.0416 6.95837 26.75 14 26.75C21.0416 26.75 26.75 21.0416 26.75 14C26.75 6.95837 21.0416 1.25 14 1.25Z"
        style={{ fill: 'var(--logo-fill)' }}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14 14C14 17.0376 16.4624 19.5 19.5 19.5C22.5376 19.5 25 17.0376 25 14C25 7.92487 20.0751 3 14 3C7.92487 3 3 7.92487 3 14C3 10.9624 5.46243 8.5 8.5 8.5C11.5376 8.5 14 10.9624 14 14ZM19.5 12.5C18.6716 12.5 18 13.1716 18 14C18 14.8284 18.6716 15.5 19.5 15.5C20.3284 15.5 21 14.8284 21 14C21 13.1716 20.3284 12.5 19.5 12.5Z"
        style={{ fill: 'var(--logo-fill)' }}
      />
    </svg>
  )
}

export function LogoNoBorder({
  width = 28,
  height = 28,
  alt = '',
}: {
  width?: number
  height?: number
  alt?: string
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 28 28`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={alt}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14 14C14 17.0376 16.4624 19.5 19.5 19.5C22.5376 19.5 25 17.0376 25 14C25 7.92487 20.0751 3 14 3C7.92487 3 3 7.92487 3 14C3 10.9624 5.46243 8.5 8.5 8.5C11.5376 8.5 14 10.9624 14 14ZM19.5 12.5C18.6716 12.5 18 13.1716 18 14C18 14.8284 18.6716 15.5 19.5 15.5C20.3284 15.5 21 14.8284 21 14C21 13.1716 20.3284 12.5 19.5 12.5Z"
        style={{ fill: 'var(--logo-fill)' }}
      />
    </svg>
  )
}
