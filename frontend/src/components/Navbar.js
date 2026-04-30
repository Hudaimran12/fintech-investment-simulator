import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { alertAPI } from '../utils/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await alertAPI.getAll({ isRead: false });
        setUnread(res.data.unreadCount || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [location]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = [
    { to: '/dashboard',   label: '📊 Dashboard' },
    { to: '/investments', label: '💹 Investments' },
    { to: '/alerts',      label: `🔔 Alerts${unread > 0 ? ` (${unread})` : ''}` }
  ];

  return (
    <nav style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0.8rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <span style={{ fontFamily: 'Space Mono', color: 'var(--accent)', fontWeight: 700, fontSize: '1.1rem' }}>
          InvestSim
        </span>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              style={{
                color: location.pathname === l.to ? 'var(--accent)' : 'var(--muted)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'color 0.2s'
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          👤 {user?.name}
        </span>
        <button className="btn btn-ghost" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
