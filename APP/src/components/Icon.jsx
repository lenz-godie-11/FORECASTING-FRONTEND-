/**
 * Hand-drawn AfyaFlow icon set.
 * Single consistent stroke (1.5), square caps/joins to match the
 * flat-square system, 24x24 grid, currentColor.
 */

const PATHS = {
  dashboard: (
    <>
      <rect x="3.75" y="3.75" width="7.5" height="7.5" />
      <rect x="12.75" y="3.75" width="7.5" height="7.5" />
      <rect x="3.75" y="12.75" width="7.5" height="7.5" />
      <rect x="12.75" y="12.75" width="7.5" height="7.5" />
    </>
  ),
  analytics: (
    <>
      <path d="M5 20.25 V10.5" />
      <path d="M12 20.25 V4" />
      <path d="M19 20.25 V14" />
    </>
  ),
  forecasts: (
    <>
      <path d="M3.5 17.5 L9 12 L13 15 L20.5 6.5" />
      <path d="M15.5 6.5 H20.5 V11.5" />
    </>
  ),
  planning: (
    <>
      <path d="M12 3.5 L20 8 V16 L12 20.5 L4 16 V8 Z" />
      <path d="M4 8 L12 12.5 L20 8" />
      <path d="M12 12.5 V20.5" />
    </>
  ),
  alerts: (
    <>
      <path d="M6.5 10.5 C6.5 6.8 9 4.75 12 4.75 C15 4.75 17.5 6.8 17.5 10.5 V14 L19.5 17 H4.5 L6.5 14 Z" />
      <path d="M9.75 19.75 C10.1 20.5 11 21 12 21 C13 21 13.9 20.5 14.25 19.75" />
    </>
  ),
  settings: (
    <>
      <path d="M3.75 6.5 H20.25" />
      <path d="M3.75 12 H20.25" />
      <path d="M3.75 17.5 H20.25" />
      <rect x="13.5" y="4" width="5" height="5" fill="currentColor" stroke="none" />
      <rect x="6.5" y="9.5" width="5" height="5" fill="currentColor" stroke="none" />
      <rect x="14.5" y="15" width="5" height="5" fill="currentColor" stroke="none" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.4 C9.5 7.9 10.6 6.9 12 6.9 C13.4 6.9 14.5 7.9 14.5 9.2 C14.5 10.9 12.4 10.9 12 12.4" />
      <circle cx="12" cy="15.75" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  logout: (
    <>
      <path d="M14.5 3.75 H8.75 C7.5 3.75 6.75 4.5 6.75 5.75 V18.25 C6.75 19.5 7.5 20.25 8.75 20.25 H14.5" />
      <path d="M10.75 12 H20.25" />
      <path d="M17 8.75 L20.25 12 L17 15.25" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6.75 H20" />
      <path d="M4 12 H20" />
      <path d="M4 17.25 H20" />
    </>
  ),
  close: (
    <>
      <path d="M6 6 L18 18" />
      <path d="M18 6 L6 18" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5 V19" />
      <path d="M5 12 H19" />
    </>
  ),
  refresh: (
    <>
      <path d="M5.75 9 A8 8 0 0 1 19 8.75" />
      <path d="M19.5 4.75 V8.75 H15.5" />
      <path d="M18.25 15 A8 8 0 0 1 5 15.25" />
      <path d="M4.5 19.25 V15.25 H8.5" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4 L21 19.75 H3 Z" />
      <path d="M12 10 V14.5" />
      <circle cx="12" cy="17.25" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  check: <path d="M5 12.5 L10 17.5 L19 7" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11 V16.5" />
      <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" />
      <path d="M4 9.75 H20" />
      <path d="M8 3.5 V6.5" />
      <path d="M16 3.5 V6.5" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7.5" ry="3" />
      <path d="M4.5 6 V18 C4.5 19.65 8.13 21 12 21 C15.87 21 19.5 19.65 19.5 18 V6" />
      <path d="M4.5 12 C4.5 13.65 8.13 15 12 15 C15.87 15 19.5 13.65 19.5 12" />
    </>
  ),
  pulse: <path d="M3.5 12 H8 L10.5 6.5 L14.5 17.5 L17 12 H20.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5 V12 L15 14" />
    </>
  ),
  bed: (
    <>
      <path d="M3.75 6.5 V17.5" />
      <path d="M3.75 14 H20.25 V17.5" />
      <path d="M3.75 17.5 H20.25" />
      <path d="M6.75 11 H11.5 C13.25 11 14.25 12 14.25 13" />
      <circle cx="8.5" cy="9.5" r="1.75" />
    </>
  ),
  cross: (
    <>
      <rect x="4" y="4" width="16" height="16" />
      <path d="M12 8 V16" />
      <path d="M8 12 H16" />
    </>
  ),
  box: (
    <>
      <rect x="4.5" y="7.5" width="15" height="12.5" />
      <path d="M4.5 11.75 H19.5" />
      <path d="M9.5 7.5 L11 4.5 H13 L14.5 7.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.25" r="3.75" />
      <path d="M4.75 20.25 C5.5 16.75 8.4 15 12 15 C15.6 15 18.5 16.75 19.25 20.25" />
    </>
  ),
}

export default function Icon({ name, size = 18, className, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {PATHS[name] ?? null}
    </svg>
  )
}
