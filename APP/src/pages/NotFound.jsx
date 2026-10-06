import { ButtonLink } from '../components/Button.jsx'

export default function NotFound() {
  return (
    <div className="notfound">
      <div className="notfound__card">
        <div className="notfound__code" aria-hidden="true">
          404
        </div>
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist in AfyaFlow AI.</p>
        <ButtonLink to="/" variant="tertiary" icon="dashboard">
          Back to the dashboard
        </ButtonLink>
      </div>
    </div>
  )
}
