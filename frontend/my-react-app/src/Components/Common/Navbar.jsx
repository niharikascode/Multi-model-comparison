import { NavLink } from 'react-router-dom';

const s = {
  display: 'Syne, sans-serif',
  mono: 'JetBrains Mono, monospace',
};

const Navbar = () => {
  return (
    <nav style={{
      borderBottom: '1px solid rgba(99,179,237,0.08)',
      padding: '0 1.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 56, position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(4,6,15,0.85)', backdropFilter: 'blur(12px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18, }}>⚡</span>
        <span style={{ fontFamily: s.display, fontWeight: 800, fontSize: 15, color: '#e8f0fe', letterSpacing: '-0.02em' }}>
          AI Battle
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {[
          { to: '/', label: 'Battle' },
          { to: '/blind', label: 'Blind Mode' },
          { to: '/stats', label: 'Stats' },
        ].map(({ to, label }) => (
          <NavLink key={to} to={to} end style={({ isActive }) => ({
            padding: '6px 14px', borderRadius: 6,
            fontFamily: s.mono, fontSize: 11, letterSpacing: '0.05em',
            textDecoration: 'none',
            background: isActive ? 'rgba(99,179,237,0.12)' : 'transparent',
            border: `1px solid ${isActive ? 'rgba(99,179,237,0.35)' : 'transparent'}`,
            color: isActive ? '#90cdf4' : '#4a5568',
            transition: 'all 0.15s',
          })}>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;