import { useState } from 'react';
import { useAuth } from './AuthContext';
import { trackEvent } from '../lib/analytics';

const PASSWORD_MESSAGE = 'Password must be at least 8 characters and include one uppercase letter, one number, and one special character.';

function getPasswordChecks(password) {
  return [
    {
      id: 'length',
      label: 'At least 8 characters',
      isMet: password.length >= 8
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter',
      isMet: /[A-Z]/.test(password)
    },
    {
      id: 'number',
      label: 'One number',
      isMet: /\d/.test(password)
    },
    {
      id: 'special',
      label: 'One special character',
      isMet: /[^A-Za-z0-9]/.test(password)
    }
  ];
}

function isPasswordStrong(password) {
  return getPasswordChecks(password).every((check) => check.isMet);
}

function isUserEmailConfirmed(user) {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

function getFriendlyAuthMessage(message) {
  const normalized = message?.toLowerCase() ?? '';

  if (normalized.includes('email not confirmed') || normalized.includes('not confirmed') || normalized.includes('confirm')) {
    return 'Please confirm your email before logging in.';
  }

  if (normalized.includes('invalid login') || normalized.includes('invalid credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }

  if (normalized.includes('already registered') || normalized.includes('already exists') || normalized.includes('user already')) {
    return 'An account already exists for this email. Try logging in instead.';
  }

  if (normalized.includes('password') && (normalized.includes('weak') || normalized.includes('six') || normalized.includes('6'))) {
    return PASSWORD_MESSAGE;
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
  const passwordChecks = getPasswordChecks(password);

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

    if (isSignup && !isPasswordStrong(password)) {
      setError(PASSWORD_MESSAGE);
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

    if (isSignup) {
      trackEvent('user_signed_up', {
        email_confirmation_required: true
      });

      if (data?.session || data?.user) {
        await supabase.auth.signOut();
      }

      setPassword('');
      setMode('login');
      setSuccess('Check your email to confirm your account before logging in.');
      return;
    }

    if (data?.user && !isUserEmailConfirmed(data.user)) {
      await supabase.auth.signOut();
      setError('Please confirm your email before logging in.');
      return;
    }

    trackEvent('user_logged_in', {
      provider: 'email_password'
    });

    setSuccess('Logged in. Loading Banker Builder...');
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
              minLength={isSignup ? 8 : 6}
              required
            />
          </label>

          {isSignup ? (
            <ul className="password-checklist" aria-label="Password requirements">
              {passwordChecks.map((check) => (
                <li key={check.id} className={check.isMet ? 'met' : ''}>
                  <span aria-hidden="true">{check.isMet ? 'OK' : '-'}</span>
                  {check.label}
                </li>
              ))}
            </ul>
          ) : null}

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
