import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  Upload, ImageIcon, Sparkles,
  Copy, RotateCcw, CheckCircle, AlertTriangle, Zap, ChevronDown,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import styles from './Dashboard.module.css';

const PLATFORMS = [
  { id: 'facebook',  label: 'Facebook',    emoji: '📘', color: '#1877F2', limit: 500 },
  { id: 'instagram', label: 'Instagram',   emoji: '📸', color: '#E1306C', limit: 2200 },
  { id: 'twitter',   label: 'Twitter / X', emoji: '🐦', color: '#1DA1F2', limit: 280 },
];

const MODELS = [
  { id: 'standard', label: 'Standard',   desc: 'Fast & free — Groq Llama 4',    badge: 'Free' },
  { id: 'enhanced', label: 'Enhanced',   desc: 'Balanced quality — GPT-4o Mini', badge: 'Pro' },
  { id: 'ultra',    label: 'Ultra',      desc: 'Max quality — GPT-4o',           badge: 'Pro' },
];

const TONES = ['casual', 'professional', 'humorous', 'inspirational'];

export default function Dashboard() {
  const { profile } = useAuthStore();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [platforms, setPlatforms] = useState(['instagram']);
  const [model, setModel] = useState('standard');
  const [tone, setTone] = useState('casual');
  const [language, setLanguage] = useState('English');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // ─── Dropzone ─────────────────────────────────────────────────────────────
  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length) { toast.error('File rejected. Max 10MB, images only.'); return; }
    const file = accepted[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResults(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg','.jpeg','.png','.webp','.gif','.heic'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  // ─── Platform toggle ──────────────────────────────────────────────────────
  const togglePlatform = (id) => {
    setPlatforms((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((p) => p !== id) : prev) : [...prev, id]
    );
  };

  // ─── Generate ─────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!image) { toast.error('Please upload an image first.'); return; }

    const isPro = profile?.plan === 'pro';
    if (!isPro && model !== 'standard') {
      toast.error('Upgrade to Pro to use Enhanced or Ultra models.');
      return;
    }

    setGenerating(true);
    setResults(null);
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('platforms', JSON.stringify(platforms));
      formData.append('model', model);
      formData.append('tone', tone);
      formData.append('language', language);

      const data = await api.upload('/generate', formData);
      setResults(data);
      toast.success(`✨ ${data.posts.length} post${data.posts.length > 1 ? 's' : ''} generated!`);

      // Update quota in profile
      if (data.quota) {
        useAuthStore.setState((s) => ({
          profile: { ...s.profile, quota: data.quota },
        }));
      }
    } catch (err) {
      if (err.message?.includes('quota')) {
        toast.error('Monthly quota reached. Upgrade to Pro for unlimited generations.');
      } else {
        toast.error(err.message || 'Generation failed. Try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (post) => {
    const text = `${post.caption}\n\n${post.hashtags.map((h) => `#${h}`).join(' ')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(post.platform);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = async (platformId) => {
    if (!image) return;
    setGenerating(true);
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('platforms', JSON.stringify([platformId]));
      formData.append('model', model);
      formData.append('tone', tone);
      formData.append('language', language);
      const data = await api.upload('/generate', formData);
      setResults((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => p.platform === platformId ? data.posts[0] : p),
      }));
      toast.success('Regenerated!');
    } catch (err) {
      toast.error('Regeneration failed.');
    } finally {
      setGenerating(false);
    }
  };

  const quota = profile?.quota;
  const isNearQuota = quota && quota.used >= quota.limit * 0.8;

  return (
    <AppShell>
      <div className={styles.layout}>
        {/* ─── LEFT PANEL ──────────────────────────────────────────────────── */}
        <aside className={styles.sidebar}>

          {/* Quota warning */}
          {quota && (
            <div className={`${styles.quotaBar} ${isNearQuota ? styles.quotaWarn : ''}`}>
              <div className={styles.quotaHeader}>
                <span>Monthly Quota</span>
                <span className={styles.quotaCount}>{quota.used} / {quota.limit}</span>
              </div>
              <div className={styles.quotaTrack}>
                <div
                  className={styles.quotaFill}
                  style={{
                    width: `${Math.min((quota.used / quota.limit) * 100, 100)}%`,
                    background: isNearQuota ? 'var(--warning)' : 'var(--accent)',
                  }}
                />
              </div>
              {isNearQuota && (
                <p className={styles.quotaMsg}>
                  <AlertTriangle size={12}/> Almost at limit. <a href="#">Upgrade to Pro</a>
                </p>
              )}
            </div>
          )}

          {/* Image Upload */}
          <div className={styles.section}>
            <h3 className={styles.sectionLabel}>1. Upload Image</h3>
            <div
              {...getRootProps()}
              className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''} ${preview ? styles.dropzoneHasImage : ''}`}
            >
              <input {...getInputProps()} />
              {preview ? (
                <div className={styles.previewWrapper}>
                  <img src={preview} alt="Preview" className={styles.previewImg} />
                  <div className={styles.previewOverlay}>
                    <Upload size={20} />
                    <span>Change image</span>
                  </div>
                </div>
              ) : (
                <div className={styles.dropzoneContent}>
                  <div className={styles.dropzoneIcon}>
                    <ImageIcon size={28} color="var(--accent)"/>
                  </div>
                  <p>{isDragActive ? 'Drop it!' : 'Drag & drop or click to upload'}</p>
                  <span>JPEG, PNG, WebP, HEIC · Max 10 MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Platform Selection */}
          <div className={styles.section}>
            <h3 className={styles.sectionLabel}>2. Select Platforms</h3>
            <div className={styles.platformGrid}>
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  className={`${styles.platformBtn} ${platforms.includes(p.id) ? styles.platformActive : ''}`}
                  onClick={() => togglePlatform(p.id)}
                  style={{ '--p-color': p.color }}
                >
                  <span className={styles.platformEmoji}>{p.emoji}</span>
                  <span className={styles.platformName}>{p.label}</span>
                  {platforms.includes(p.id) && <CheckCircle size={14} className={styles.platformCheck} />}
                </button>
              ))}
            </div>
          </div>

          {/* AI Model */}
          <div className={styles.section}>
            <h3 className={styles.sectionLabel}>3. AI Model</h3>
            <div className={styles.modelList}>
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  className={`${styles.modelBtn} ${model === m.id ? styles.modelActive : ''}`}
                  onClick={() => setModel(m.id)}
                >
                  <div className={styles.modelLeft}>
                    <span className={styles.modelLabel}>{m.label}</span>
                    <span className={styles.modelDesc}>{m.desc}</span>
                  </div>
                  <span className={`badge ${m.badge === 'Free' ? 'badge-free' : 'badge-pro'}`}>{m.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone & Language */}
          <div className={styles.section}>
            <h3 className={styles.sectionLabel}>4. Tone & Language</h3>
            <div className={styles.toneGrid}>
              {TONES.map((t) => (
                <button
                  key={t}
                  className={`${styles.toneBtn} ${tone === t ? styles.toneActive : ''}`}
                  onClick={() => setTone(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className={styles.inputWrapper} style={{marginTop:12}}>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`input ${styles.select}`}
              >
                {['English','Spanish','French','German','Portuguese','Bengali','Hindi','Arabic','Japanese','Korean'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <ChevronDown size={14} className={styles.selectIcon} />
            </div>
          </div>

          {/* Generate CTA */}
          <button
            className={`btn btn-primary btn-full btn-lg ${styles.generateBtn}`}
            onClick={handleGenerate}
            disabled={generating || !image}
          >
            {generating ? (
              <>
                <div className="animate-spin" style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%'}}/>
                Generating…
              </>
            ) : (
              <><Sparkles size={18}/> Generate Posts</>
            )}
          </button>
        </aside>

        {/* ─── RIGHT PANEL ─────────────────────────────────────────────────── */}
        <main className={styles.main}>
          {!results && !generating && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><Zap size={40} color="var(--accent)"/></div>
              <h2>Ready to generate</h2>
              <p>Upload an image, select platforms, and click <strong>Generate Posts</strong>.</p>
            </div>
          )}

          {generating && (
            <div className={styles.generatingState}>
              <div className={styles.generatingSpinner}>
                {[0,1,2].map(i => (
                  <div key={i} className={styles.generatingDot} style={{animationDelay:`${i*0.2}s`}}/>
                ))}
              </div>
              <h3>Analyzing your image…</h3>
              <p>Our AI is crafting platform-perfect posts for you.</p>
            </div>
          )}

          {results && (
            <div className={styles.results}>
              <div className={styles.resultsHeader}>
                <h2>Generated Posts</h2>
                <span className={styles.providerBadge}>
                  <Zap size={12}/> {results.model} · {results.provider}
                </span>
              </div>

              <div className={styles.postsGrid}>
                {results.posts.map((post) => {
                  const pCfg = PLATFORMS.find(p => p.id === post.platform);
                  const overLimit = post.character_count > (pCfg?.limit || 99999);
                  return (
                    <div key={post.platform} className={styles.postCard}>
                      {/* Header */}
                      <div className={styles.postHeader} style={{ borderColor: pCfg?.color }}>
                        <span className={styles.postPlatform}>
                          {pCfg?.emoji} {pCfg?.label}
                        </span>
                        <div className={styles.postHeaderRight}>
                          <span className={`${styles.charCount} ${overLimit ? styles.charOver : ''}`}>
                            {post.character_count} / {pCfg?.limit} chars
                          </span>
                          <button
                            className={`btn btn-ghost btn-sm ${styles.regenBtn}`}
                            onClick={() => handleRegenerate(post.platform)}
                            disabled={generating}
                            title="Regenerate"
                          >
                            <RotateCcw size={13}/>
                          </button>
                        </div>
                      </div>

                      {/* Caption */}
                      <div className={styles.postBody}>
                        <p className={styles.caption}>{post.caption}</p>
                        {post.emoji_suggestion && (
                          <p className={styles.emojis}>{post.emoji_suggestion}</p>
                        )}
                        {post.hashtags?.length > 0 && (
                          <div className={styles.hashtags}>
                            {post.hashtags.map((h) => (
                              <span key={h} className={styles.hashtag}>#{h}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Tip */}
                      {post.tip && (
                        <div className={styles.postTip}>
                          <Sparkles size={12}/> {post.tip}
                        </div>
                      )}

                      {/* Copy */}
                      <button
                        className={`btn btn-secondary btn-full ${styles.copyBtn}`}
                        onClick={() => handleCopy(post)}
                      >
                        {copiedId === post.platform ? (
                          <><CheckCircle size={14} color="var(--success)"/> Copied!</>
                        ) : (
                          <><Copy size={14}/> Copy Post</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}
