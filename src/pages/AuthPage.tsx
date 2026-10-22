import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Heart } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isLogin = searchParams.get('mode') !== 'signup';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const result = isLogin
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (result.error) throw result.error;

      if (isLogin) {
        const from = (location.state as { from?: { pathname?: string } } | null)
          ?.from?.pathname;
        navigate(from || '/');
        return;
      }

      setMessage(
        'Signup submitted. Check your email if confirmation is required.'
      );
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMessage('');
    setIsError(false);
    setSearchParams(isLogin ? { mode: 'signup' } : {});
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-label="Life Agent">
        <Link to="/" className="auth-brand">
          <span className="auth-brand__mark"><Heart size={19} /></span>
          <span>Life Agent</span>
        </Link>

        <div className="auth-brand-panel__content">
          <p className="auth-brand-panel__eyebrow">A place for your story</p>
          <h1>Every chapter deserves to be remembered.</h1>
          <p className="auth-brand-panel__description">
            Gather the photographs, milestones, and moments that make your life
            yours.
          </p>

          <div className="auth-story-art" aria-hidden="true">
            <div className="auth-story-art__backdrop">
              <span className="auth-story-art__moon" />
              <span className="auth-story-art__ridge auth-story-art__ridge--back" />
              <span className="auth-story-art__ridge auth-story-art__ridge--front" />
              <span className="auth-story-art__star auth-story-art__star--one">✳</span>
              <span className="auth-story-art__star auth-story-art__star--two">✦</span>
            </div>
            <div className="auth-story-art__note">
              <span>YOUR STORY</span>
              <span className="auth-story-art__note-rule" />
              <Heart size={15} />
            </div>
          </div>
        </div>

        <p className="auth-brand-panel__footer">Keep what makes a life, a life.</p>
      </section>

      <section className="auth-form-panel">
        <Link to="/" className="auth-back-link">
          <ArrowLeft size={15} /> Back to Life Agent
        </Link>

        <div className="auth-form-wrap">
          <span className="auth-form-mark"><Heart size={18} /></span>
          <p className="auth-form-eyebrow">YOUR PERSONAL MEMORY SPACE</p>
          <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p className="auth-form-intro">
            {isLogin
              ? 'Sign in to your Life Agent'
              : 'Start collecting the moments that matter to you.'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="auth-submit">
              {loading
                ? 'Please wait...'
                : isLogin
                  ? 'Sign In'
                  : 'Create Account'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          {message && (
            <p
              role={isError ? 'alert' : 'status'}
              className={`auth-message ${isError ? 'auth-message--error' : 'auth-message--success'}`}
            >
              {message}
            </p>
          )}

          <p className="auth-mode-switch">
            {isLogin ? 'New to Life Agent?' : 'Already have an account?'}
            <button type="button" onClick={toggleMode}>
              {isLogin ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="auth-form-footer">
          Your story, collected at your own pace.
        </p>
      </section>
    </main>
  );
}
