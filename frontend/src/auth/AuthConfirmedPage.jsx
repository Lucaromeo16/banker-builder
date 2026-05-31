import { useEffect } from 'react';
import { useAuth } from './AuthContext';

export default function AuthConfirmedPage() {
  const { signOut } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.history.replaceState({}, document.title, '/auth/confirmed');
  }, []);

  const handleGoToLogin = async () => {
    await signOut();
    window.location.assign('/');
  };

  return (
    <main className="auth-shell">
      <section className="auth-card auth-confirmed-card">
        <span className="auth-eyebrow">Banker Builder</span>
        <div className="auth-confirmation-mark" aria-hidden="true">
          OK
        </div>
        <h1>Thanks for confirming your email.</h1>
        <p>Your account is verified. You can now log in and start using Banker Builder.</p>
        <button type="button" className="auth-submit" onClick={handleGoToLogin}>
          Go to Login
        </button>
      </section>
    </main>
  );
}

