import { Link } from 'react-router-dom';
import { Zap, Upload, Share2, Star, Check, ArrowRight, Sparkles } from 'lucide-react';
import styles from './Landing.module.css';

const features = [
  { icon: <Upload size={22}/>, title: 'Upload Any Image', desc: 'JPEG, PNG, WebP, HEIC — we handle all formats automatically.' },
  { icon: <Sparkles size={22}/>, title: 'AI-Powered Captions', desc: 'Vision models analyze your image and craft the perfect caption.' },
  { icon: <Share2 size={22}/>, title: '3 Platforms at Once', desc: 'Get tailored posts for Facebook, Instagram, and Twitter/X in seconds.' },
  { icon: <Zap size={22}/>, title: 'Instant Results', desc: 'No waiting, no complex tools. Generate → Copy → Post. Done.' },
];

const platforms = [
  { name: 'Facebook',    color: '#1877F2', emoji: '📘', desc: 'Conversational, storytelling captions with perfect hashtag density.' },
  { name: 'Instagram',   color: '#E1306C', emoji: '📸', desc: 'Visual, lifestyle-focused captions with up to 30 power hashtags.' },
  { name: 'Twitter / X', color: '#1DA1F2', emoji: '🐦', desc: 'Punchy, concise witty posts within the 280 character limit.' },
];

const plans = [
  { name: 'Free', price: '$0', period: '/mo', highlight: false, quota: '20 generations/mo',
    features: ['All 3 platforms', 'Standard AI model', '7-day history', 'Copy to clipboard'] },
  { name: 'Pro', price: '$12', period: '/mo', highlight: true, quota: 'Unlimited generations',
    features: ['All 3 platforms', 'All AI models (GPT-4o)', 'Unlimited history', 'Priority processing', 'Custom API key'] },
];

export default function Landing() {
  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={`container ${styles.navInner}`}>
          <div className={styles.logo}>
            <Sparkles size={20} color="#2E86C1" />
            <span>PixelPost <strong>AI</strong></span>
          </div>
          <div className={styles.navLinks}>
            <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={`badge badge-free ${styles.heroBadge}`}>
            <Zap size={10} /> Free to start — No credit card required
          </div>
          <h1 className={styles.heroTitle}>
            Upload an Image.<br />
            <span className="gradient-text">Get Social Media Posts Instantly.</span>
          </h1>
          <p className={styles.heroSub}>
            PixelPost AI analyzes your image using advanced vision models and generates
            platform-optimized captions for Facebook, Instagram, and Twitter/X — all at once.
          </p>
          <div className={styles.heroCTA}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Start for Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
          </div>
          <p className={styles.heroNote}>20 free generations per month · No credit card</p>
        </div>

        {/* Hero visual */}
        <div className={styles.heroVisual}>
          <div className={styles.mockupCard}>
            <div className={styles.mockupHeader}>
              <div className={styles.mockupDot} style={{background:'#FF5F57'}}/>
              <div className={styles.mockupDot} style={{background:'#FFBD2E'}}/>
              <div className={styles.mockupDot} style={{background:'#28C840'}}/>
              <span style={{marginLeft:8, fontSize:12, color:'var(--text-muted)'}}>PixelPost AI — Dashboard</span>
            </div>
            <div className={styles.mockupUpload}>
              <Upload size={28} color="var(--accent)" />
              <span>Drop your image here</span>
            </div>
            <div className={styles.mockupPlatforms}>
              {['📘 Facebook','📸 Instagram','🐦 Twitter'].map(p => (
                <span key={p} className={styles.mockupPlatformChip}>{p}</span>
              ))}
            </div>
            <div className={styles.mockupGenBtn}>✨ Generate Posts</div>
            <div className={styles.mockupResult}>
              <div className={styles.mockupResultLine} style={{width:'90%'}}/>
              <div className={styles.mockupResultLine} style={{width:'75%'}}/>
              <div className={styles.mockupResultLine} style={{width:'60%'}}/>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.section}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Everything you need to post faster</h2>
          <div className={styles.featuresGrid}>
            {features.map((f) => (
              <div key={f.title} className="card">
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className={styles.section}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Platform-native content, every time</h2>
          <div className={styles.platformsGrid}>
            {platforms.map((p) => (
              <div key={p.name} className={`card ${styles.platformCard}`}>
                <div className={styles.platformEmoji}>{p.emoji}</div>
                <h3 style={{ color: p.color }}>{p.name}</h3>
                <p className={styles.featureDesc}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.section}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Simple, transparent pricing</h2>
          <div className={styles.pricingGrid}>
            {plans.map((plan) => (
              <div key={plan.name} className={`card ${styles.pricingCard} ${plan.highlight ? styles.pricingHighlight : ''}`}>
                {plan.highlight && <div className={styles.pricingBadge}>Most Popular</div>}
                <div className={styles.pricingName}>{plan.name}</div>
                <div className={styles.pricingPrice}>
                  {plan.price}<span className={styles.pricingPeriod}>{plan.period}</span>
                </div>
                <div className={styles.pricingQuota}>{plan.quota}</div>
                <ul className={styles.pricingFeatures}>
                  {plan.features.map((f) => (
                    <li key={f}><Check size={14} color="var(--success)" /> {f}</li>
                  ))}
                </ul>
                <Link to="/register" className={`btn btn-full ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <div className={styles.logo}>
              <Sparkles size={16} color="#2E86C1" />
              <span>PixelPost AI</span>
            </div>
            <p className={styles.footerText}>© 2026 PixelPost AI. Built with ❤️ and AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
