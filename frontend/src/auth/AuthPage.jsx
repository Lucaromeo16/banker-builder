import { useState } from 'react';
import { useAuth } from './AuthContext';

function getFriendlyAuthMessage(message) {
  const normalized = message?.toLowerCase() ?? '';

  if (normalized.includes('invalid login') || normalized.includes('invalid credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }

  if (normalized.includes('already registered') || normalized.includes('already exists') || normalized.includes('user already')) {
    return 'An account already exists for this email. Try logging in instead.';
  }

  if (normalized.includes('password') && (normalized.includes('weak') || normalized.includes('six') || normalized.includes('6'))) {
    return 'Please choose a stronger password with at least 6 characters.';
  }

  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'Network issue while contacting authentication. Please try again.';
  }

  return message || 'Something went wrong. Please try again.';
}

export default function AuthPage() {
  const { isSupabaseConfigured, supabase } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isSignup = mode === 'signup';

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    resetMessages();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    resetMessages();

    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable login.');
      return;
    }

    setLoading(true);

    const trimmedEmail = email.trim();
    const authRequest = isSignup
      ? supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim() || null
            }
          }
        })
      : supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password
        });

    const { data, error: authError } = await authRequest;
    setLoading(false);

    if (authError) {
      setError(getFriendlyAuthMessage(authError.message));
      return;
    }

    if (isSignup && !data?.session) {
      setSuccess('Account created. Check your email to confirm your account, then log in.');
      return;
    }

    setSuccess(isSignup ? 'Account created. Loading Banker Builder...' : 'Logged in. Loading Banker Builder...');
  };

  if (!isSupabaseConfigured) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <span className="auth-eyebrow">Banker Builder</span>
          <h1>Authentication is not configured</h1>
          <p>
            Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable sign up and login for this environment.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-heading">
          <span className="auth-eyebrow">Investment Banking Recruiting Platform</span>
          <h1>{isSignup ? 'Create your Banker Builder account' : 'Log in to Banker Builder'}</h1>
          <p>
            Save your recruiting work, build your profile, and keep your Banker Builder workspace tied to your account.
          </p>
        </div>

        <div className="auth-tabs" aria-label="Authentication mode">
          <button type="button" className={!isSignup ? 'active' : ''} onClick={() => handleModeChange('login')}>
            Log in
          </button>
          <button type="button" className={isSignup ? 'active' : ''} onClick={() => handleModeChange('signup')}>
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup ? (
            <label>
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Luca Romeo"
                autoComplete="name"
              />
            </label>
          ) : null}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          </label>

          {error ? <div className="auth-message error">{error}</div> : null}
          {success ? <div className="auth-message success">{success}</div> : null}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Log in'}
          </button>
        </form>
      </section>
    </main>
  );
}

