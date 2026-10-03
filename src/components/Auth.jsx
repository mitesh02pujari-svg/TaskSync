import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage('');
    setError('');

    if (!supabase) {
      setError(
        'Authentication is unavailable. Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.'
      );
      return;
    }

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (loginError) {
          throw loginError;
        }

        setMessage('Login successful.');
      } else {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (signupError) {
          throw signupError;
        }

        if (data.session) {
          setMessage('Account created successfully.');
        } else {
          setMessage(
            'Account created. Check your email to confirm your account.'
          );
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>{isLogin ? 'Login to TaskSync' : 'Create your TaskSync account'}</h1>

      {!supabase && (
        <p role="alert">
          Authentication is unavailable. Configure VITE_SUPABASE_URL and
          VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
        />

        <button type="submit" disabled={loading || !supabase}>
          {loading
            ? 'Please wait...'
            : isLogin
              ? 'Login'
              : 'Sign Up'}
        </button>
      </form>

      {message && <p>{message}</p>}
      {error && <p>{error}</p>}

      <button
        type="button"
        onClick={() => {
          setIsLogin((current) => !current);
          setMessage('');
          setError('');
        }}
      >
        {isLogin
          ? 'Create a new account'
          : 'Already have an account? Login'}
      </button>
    </div>
  );
}