import { NavLink, useNavigate } from 'react-router-dom';
import { Sparkles, LayoutDashboard, History, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import styles from './AppShell.module.css';

const NAV_LINKS = [
  { to: '/dashboard', icon: <LayoutDashboard size={18}/>, label: 'Dashboard' },
  { to: '/history',   icon: <History size={18}/>,         label: 'History' },
  { to: '/settings',  icon: <Settings size={18}/>,        label: 'Settings' },
];

export default function AppShell({ children }) {
  const { profile, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out.');
    navigate('/');
  };

  return (
    <div className={styles.shell}>
      {/* Top Nav */}
      <nav className={styles.nav}>
        <NavLink to="/dashboard" className={styles.logo}>
          <Sparkles size={18} color="#2E86C1"/>
          <span>PixelPost <strong>AI</strong></span>
        </NavLink>

        <div className={styles.navLinks}>
          {NAV_LINKS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              {icon} {label}
            </NavLink>
          ))}
        </div>

        {/* User menu */}
        <div className={styles.userMenu} onClick={() => setMenuOpen(!menuOpen)}>
          {profile?.photoURL
            ? <img src={profile.photoURL} alt="Avatar" className={styles.avatar}/>
            : <div className={styles.avatarFallback}>{profile?.displayName?.[0]?.toUpperCase() || '?'}</div>
          }
          <span className={styles.userName}>{profile?.displayName?.split(' ')[0] || 'User'}</span>
          <ChevronDown size={14} className={`${styles.chevron} ${menuOpen?styles.chevronOpen:''}`}/>

          {menuOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownUser}>
                <p className={styles.dropdownName}>{profile?.displayName}</p>
                <p className={styles.dropdownEmail}>{profile?.email}</p>
                <span className={`badge ${profile?.plan==='pro'?'badge-pro':'badge-free'}`}>{profile?.plan||'free'}</span>
              </div>
              <div className={styles.dropdownDivider}/>
              {NAV_LINKS.map(({ to, icon, label }) => (
                <NavLink key={to} to={to} className={styles.dropdownItem} onClick={()=>setMenuOpen(false)}>
                  {icon} {label}
                </NavLink>
              ))}
              <div className={styles.dropdownDivider}/>
              <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={handleLogout}>
                <LogOut size={16}/> Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <main className={styles.content}>{children}</main>
    </div>
  );
}
