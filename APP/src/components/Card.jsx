import { cx } from '../utils/format.js'

/**
 * Flat Carbon card: white surface, 1px hairline, square corners.
 * Hierarchy comes from hairlines and surface change — never shadows.
 */
export default function Card({
  title,
  subtitle,
  meta,
  children,
  foot,
  tight,
  as: Tag = 'section',
  className,
  ...rest
}) {
  const hasHead = title || meta
  return (
    <Tag className={cx('card', tight && 'card--tight', className)} {...rest}>
      {hasHead ? (
        <header className="card__head">
          <div>
            {title ? <h2 className="card__title">{title}</h2> : null}
            {subtitle ? <p className="card__subtitle">{subtitle}</p> : null}
          </div>
          {meta ? <div className="card__meta">{meta}</div> : null}
        </header>
      ) : null}
      {children}
      {foot ? <footer className="card__foot">{foot}</footer> : null}
    </Tag>
  )
}
