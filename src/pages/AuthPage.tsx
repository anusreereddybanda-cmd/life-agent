

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = isLogin
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (result.error) throw result.error;

      
if (isLogin) {
  navigate('/');
  return;
}

setMessage(
  'Signup submitted. Check your email if confirmation is required.'
);

    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 glass-panel p-8">
      <h1 className="text-3xl font-serif text-sage-800 mb-2">
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </h1>

      <p className="text-ink-400 mb-6">
        Sign in to keep your memories private.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 rounded-lg border border-cream-300"
        />

        <input
          type="password"
          placeholder="Password (at least 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          className="w-full p-3 rounded-lg border border-cream-300"
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 disabled:opacity-50"
        >
          {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      {message && (
        <p role="status" className="mt-4 text-sm text-ink-600">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setIsLogin(!isLogin);
          setMessage('');
        }}
        className="mt-5 text-sage-700 hover:underline text-sm"
      >
        {isLogin
          ? 'New here? Create an account'
          : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}
