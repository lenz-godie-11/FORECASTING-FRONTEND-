import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'

/**
 * Authenticated application shell: fixed side navigation + sticky
 * header + routed content.
 */
export default function DashboardLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="shell__body">
        <Header onMenuToggle={() => setOpen((v) => !v)} open={open} />
        <main id="main" className="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
