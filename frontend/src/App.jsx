import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import useAuthStore from './store/authStore';

// Pages
import Landing   from './pages/Landing';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard from './pages/Dashboard';
import History   from './pages/History';
import Settings  from './pages/Settings';

// Guards
function PrivateRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <FullScreenLoader />;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <FullScreenLoader />;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function FullScreenLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)', borderRadius: '50%',
          animation: 'spin 1s linear infinite', margin: '0 auto 16px',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading PixelPost AI…</p>
      </div>
    </div>
  );
}

export default function App() {
  const { setUser, setLoading, fetchProfile } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) await fetchProfile();
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
          },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Private */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/history"   element={<PrivateRoute><History /></PrivateRoute>} />
        <Route path="/settings"  element={<PrivateRoute><Settings /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
