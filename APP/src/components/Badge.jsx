import { cx } from '../utils/format.js'

/** Small status pill. Tones: success | warning | error | info | neutral */
export default function Badge({ tone = 'neutral', children, className }) {
  return <span className={cx('badge', `badge--${tone}`, className)}>{children}</span>
}
