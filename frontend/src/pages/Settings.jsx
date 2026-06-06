import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Bell, Key, Trash2, Save, AlertTriangle } from 'lucide-react';
import AppShell from '../components/AppShell';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import styles from './Settings.module.css';

const TONES     = ['casual','professional','humorous','inspirational'];
const LANGUAGES = ['English','Spanish','French','German','Portuguese','Bengali','Hindi','Arabic','Japanese','Korean'];
const PLATFORMS = ['facebook','instagram','twitter'];

export default function Settings() {
  const navigate = useNavigate();
  const { profile, updatePreferences, logout } = useAuthStore();
  const prefs = profile?.preferences || {};

  const [tone, setTone]       = useState(prefs.tone || 'casual');
  const [language, setLang]   = useState(prefs.language || 'English');
  const [defaults, setDefs]   = useState(prefs.defaultPlatforms || ['instagram']);
  const [emailNotif, setNotif]= useState(prefs.emailNotifications ?? true);
  const [saving, setSaving]   = useState(false);

  const [apiKey, setApiKey]   = useState('');
  const [apiProvider, setApiProvider] = useState('openai');
  const [keySaving, setKeySaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting]           = useState(false);

  const handleSavePrefs = async () => {
    setSaving(true);
    try {
      await updatePreferences({ tone, language, defaultPlatforms: defaults, emailNotifications: emailNotif });
      toast.success('Preferences saved!');
    } catch { toast.error('Save failed.'); }
    finally { setSaving(false); }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) { toast.error('Enter an API key.'); return; }
    setKeySaving(true);
    try {
      await api.post('/user/api-key', { provider: apiProvider, apiKey });
      toast.success('API key saved securely!');
      setApiKey('');
    } catch (err) { toast.error(err.message || 'Failed to save key.'); }
    finally { setKeySaving(false); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== profile?.email) {
      toast.error('Email does not match.'); return;
    }
    setDeleting(true);
    try {
      await api.delete('/user/account');
      await logout();
      navigate('/');
      toast.success('Account deleted.');
    } catch { toast.error('Delete failed. Try again.'); setDeleting(false); }
  };

  const toggleDefault = (p) => {
    setDefs((prev) => prev.includes(p) ? (prev.length>1?prev.filter(x=>x!==p):prev) : [...prev,p]);
  };

  return (
    <AppShell>
      <div className={styles.page}>
        <h1 className={styles.title}>Settings</h1>

        {/* Profile card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}><User size={16}/> Profile</div>
          <div className={styles.profileInfo}>
            {profile?.photoURL
              ? <img src={profile.photoURL} alt="Avatar" className={styles.avatar}/>
              : <div className={styles.avatarFallback}>{profile?.displayName?.[0]?.toUpperCase()}</div>
            }
            <div>
              <p className={styles.profileName}>{profile?.displayName}</p>
              <p className={styles.profileEmail}>{profile?.email}</p>
              <span className={`badge ${profile?.plan === 'pro' ? 'badge-pro' : 'badge-free'}`}>
                {profile?.plan || 'free'} plan
              </span>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className={styles.card}>
          <div className={styles.cardHeader}><Bell size={16}/> Preferences</div>
          <div className={styles.prefGrid}>
            <div className="input-group">
              <label className="input-label">Default Tone</label>
              <div className={styles.chipRow}>
                {TONES.map(t => (
                  <button key={t} className={`${styles.chip} ${tone===t?styles.chipActive:''}`} onClick={()=>setTone(t)}>
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Default Language</label>
              <select value={language} onChange={e=>setLang(e.target.value)} className="input">
                {LANGUAGES.map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Default Platforms</label>
              <div className={styles.chipRow}>
                {PLATFORMS.map(p => (
                  <button key={p} className={`${styles.chip} ${defaults.includes(p)?styles.chipActive:''}`} onClick={()=>toggleDefault(p)}>
                    {p.charAt(0).toUpperCase()+p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.toggle}>
              <div>
                <p className={styles.toggleLabel}>Email Notifications</p>
                <p className={styles.toggleDesc}>Receive quota warnings and updates by email</p>
              </div>
              <button
                className={`${styles.toggleBtn} ${emailNotif?styles.toggleOn:''}`}
                onClick={()=>setNotif(!emailNotif)}
              >
                <div className={styles.toggleThumb}/>
              </button>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSavePrefs} disabled={saving}>
            <Save size={14}/> {saving?'Saving…':'Save Preferences'}
          </button>
        </div>

        {/* Custom API Key */}
        <div className={styles.card}>
          <div className={styles.cardHeader}><Key size={16}/> Custom API Key</div>
          <p className={styles.cardDesc}>Add your own OpenAI API key to use the Ultra model without a Pro subscription. Your key is stored as a hash — never in plaintext.</p>
          <div className={styles.keyForm}>
            <select value={apiProvider} onChange={e=>setApiProvider(e.target.value)} className="input" style={{maxWidth:140}}>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
            <input
              type="password"
              placeholder="sk-proj-..."
              className="input"
              style={{flex:1}}
              value={apiKey}
              onChange={e=>setApiKey(e.target.value)}
            />
            <button className="btn btn-secondary" onClick={handleSaveKey} disabled={keySaving}>
              {keySaving?'Saving…':'Save Key'}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className={`${styles.card} ${styles.dangerCard}`}>
          <div className={styles.cardHeader}><AlertTriangle size={16} color="var(--error)"/> Danger Zone</div>
          <p className={styles.cardDesc}>
            Permanently delete your account and all associated data. This action cannot be undone.
            Type your email <strong>{profile?.email}</strong> to confirm.
          </p>
          <div className={styles.deleteForm}>
            <input
              type="email"
              placeholder={`Type ${profile?.email} to confirm`}
              className="input"
              value={deleteConfirm}
              onChange={e=>setDeleteConfirm(e.target.value)}
            />
            <button
              className="btn btn-danger"
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirm !== profile?.email}
            >
              <Trash2 size={14}/> {deleting?'Deleting…':'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
