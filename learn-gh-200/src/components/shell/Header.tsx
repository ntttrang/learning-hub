import type { Section } from '../../router';
import { Nav } from './Nav';
import { ThemeToggle } from '../ui/ThemeToggle';

/**
 * Sticky site header: brand, primary nav, theme toggle. Sits on `--bg`
 * rather than pure white so the mascot never lands on a stark surface.
 */
export function Header({ active }: { active: Section }) {
  return (
    <header className="app-header">
      <div className="container header-inner">
        <a className="brand" href="#/">
          <img src="mascot/captain-corgi-avatar.png" alt="" width={40} height={40} />
          <span className="brand-name">Learn GH-200</span>
        </a>
        <Nav active={active} />
        <ThemeToggle />
      </div>
    </header>
  );
}
