import { Link } from 'react-router-dom'
import { cx } from '../utils/format.js'
import Icon from './Icon.jsx'

/**
 * Carbon button. Variants: primary | secondary | tertiary | ghost | danger.
 * Use busy for async actions; the button disables and shows a spinner.
 */
export function Button({
  variant = 'primary',
  size,
  block,
  busy,
  icon,
  children,
  className,
  type = 'button',
  disabled,
  ...rest
}) {
  return (
    <button
      type={type}
      className={cx('btn', `btn--${variant}`, size && `btn--${size}`, block && 'btn--block', className)}
      aria-busy={busy || undefined}
      disabled={busy || disabled}
      {...rest}
    >
      {busy ? <span className="spinner" aria-hidden="true" /> : icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  )
}

export function ButtonLink({
  to,
  variant = 'primary',
  size,
  block,
  icon,
  children,
  className,
  ...rest
}) {
  return (
    <Link
      to={to}
      className={cx('btn', `btn--${variant}`, size && `btn--${size}`, block && 'btn--block', className)}
      {...rest}
    >
      {icon ? <Icon name={icon} /> : null}
      {children}
    </Link>
  )
}
