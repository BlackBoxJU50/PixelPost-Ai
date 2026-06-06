import { useState, useEffect } from 'react';
import { Trash2, Search, Filter, ImageIcon, Calendar, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '../components/AppShell';
import api from '../lib/api';
import styles from './History.module.css';

const PLATFORM_COLORS = { facebook:'#1877F2', instagram:'#E1306C', twitter:'#1DA1F2' };
const PLATFORM_EMOJI  = { facebook:'📘', instagram:'📸', twitter:'🐦' };

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 12;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.get('/history', { page, limit: LIMIT, platform: platform || undefined, search: search || undefined });
      setItems(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [page, platform]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this generation? This cannot be undone.')) return;
    try {
      await api.delete(`/history/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success('Deleted.');
    } catch {
      toast.error('Delete failed.');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Generation History</h1>
            <p className={styles.subtitle}>{total} total generations</p>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchWrapper}>
              <Search size={15} className={styles.searchIcon}/>
              <input
                type="text"
                placeholder="Search captions…"
                className={`input ${styles.searchInput}`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary">Search</button>
          </form>
          <div className={styles.platformFilter}>
            <Filter size={14} color="var(--text-muted)"/>
            {['','facebook','instagram','twitter'].map((p) => (
              <button
                key={p}
                className={`${styles.filterBtn} ${platform === p ? styles.filterActive : ''}`}
                onClick={() => { setPlatform(p); setPage(1); }}
              >
                {p ? `${PLATFORM_EMOJI[p]} ${p.charAt(0).toUpperCase()+p.slice(1)}` : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className={styles.grid}>
            {Array.from({length:6}).map((_,i) => (
              <div key={i} className={`skeleton ${styles.skeletonCard}`}/>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <ImageIcon size={48} color="var(--text-dim)"/>
            <h3>No generations yet</h3>
            <p>Your generated posts will appear here.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {items.map((item) => (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardImage}>
                  <img src={item.image_url} alt="Generated" onError={(e) => { e.target.style.display='none'; }}/>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardPlatforms}>
                    {item.platforms.map((p) => (
                      <span key={p} className={styles.platformTag} style={{borderColor: PLATFORM_COLORS[p], color: PLATFORM_COLORS[p]}}>
                        {PLATFORM_EMOJI[p]} {p}
                      </span>
                    ))}
                  </div>
                  {item.outputs?.[0] && (
                    <p className={styles.cardCaption}>{item.outputs[0].caption?.slice(0,120)}…</p>
                  )}
                  <div className={styles.cardFooter}>
                    <span className={styles.cardDate}>
                      <Calendar size={12}/> {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    {item.model_used && (
                      <span className={styles.cardModel}><Hash size={12}/> {item.model_used}</span>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p=>p-1)} disabled={page===1}>← Prev</button>
            <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p=>p+1)} disabled={page===totalPages}>Next →</button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
