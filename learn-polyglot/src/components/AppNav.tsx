import { NavLink } from 'react-router-dom';
import { useApp } from '../lib/AppContext';

export function AppNav() {
  const { manifest } = useApp();
  const sections = manifest?.sections.filter((s) => s.id !== 'compare') ?? [];

  return (
    <header className="app-nav">
      <NavLink to="/" className="app-nav__brand">
        <img src="/assets/captain-corgi-avatar.png" alt="" />
        <span>Polyglot hub</span>
      </NavLink>
      <nav className="app-nav__links" aria-label="Primary">
        {sections.map((s) => (
          <NavLink
            key={s.id}
            to={s.path}
            className={({ isActive }) => `app-nav__link${isActive ? ' active' : ''}`}
          >
            {s.label}
          </NavLink>
        ))}
        <NavLink
          to="/compare"
          className={({ isActive }) => `app-nav__link${isActive ? ' active' : ''}`}
        >
          Compare
        </NavLink>
      </nav>
    </header>
  );
}
