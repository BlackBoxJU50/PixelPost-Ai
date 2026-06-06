import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Sparkles, Mail, Lock, User } from 'lucide-react';
import { registerWithEmail, signInWithGoogle } from '../firebase';
import styles from './Auth.module.css';

const schema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});

export default function Register() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password, displayName }) => {
    try {
      await registerWithEmail(email, password, displayName);
      toast.success('Account created! Check your email to verify. ✉️');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists.'
        : 'Registration failed. Please try again.';
      toast.error(msg);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Account created with Google! ✨');
      navigate('/dashboard');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') toast.error('Google sign-up failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.logo}>
          <Sparkles size={20} color="#2E86C1" />
          <span>PixelPost AI</span>
        </Link>

        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Start generating posts for free</p>

        <button className={`btn btn-google btn-full ${styles.googleBtn}`} onClick={handleGoogle} disabled={googleLoading}>
          {googleLoading ? (
            <div className="animate-spin" style={{width:16,height:16,border:'2px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%'}}/>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Continue with Google
        </button>

        <div className="divider">or create with email</div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <div className={styles.inputWrapper}>
              <User size={15} className={styles.inputIcon} />
              <input {...register('displayName')} type="text" placeholder="Jane Smith" className={`input ${styles.inputWithIcon}`} />
            </div>
            {errors.displayName && <span className={styles.error}>{errors.displayName.message}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Email</label>
            <div className={styles.inputWrapper}>
              <Mail size={15} className={styles.inputIcon} />
              <input {...register('email')} type="email" placeholder="you@example.com" className={`input ${styles.inputWithIcon}`} />
            </div>
            {errors.email && <span className={styles.error}>{errors.email.message}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={15} className={styles.inputIcon} />
              <input {...register('password')} type={showPwd ? 'text' : 'password'} placeholder="Min. 8 chars, uppercase, number, symbol" className={`input ${styles.inputWithIcon} ${styles.inputWithIconRight}`} />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
            {errors.password && <span className={styles.error}>{errors.password.message}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={15} className={styles.inputIcon} />
              <input {...register('confirmPassword')} type={showPwd ? 'text' : 'password'} placeholder="Repeat your password" className={`input ${styles.inputWithIcon}`} />
            </div>
            {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create Free Account'}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <p className={styles.terms}>
          By registering you agree to our{' '}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
