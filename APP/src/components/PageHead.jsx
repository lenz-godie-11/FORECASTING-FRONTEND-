export default function PageHead({ title, description, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-head__title">{title}</h1>
        {description ? <p className="page-head__desc">{description}</p> : null}
      </div>
      {actions ? <div className="page-head__actions">{actions}</div> : null}
    </div>
  )
}
