import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

function friendlyProfileError(error) {
  const message = error?.message || '';
  if (message.toLowerCase().includes('permission')) return 'We could not update your profile permissions right now.';
  if (message.toLowerCase().includes('network')) return 'Network issue while saving your profile. Please try again.';
  return 'Could not save your profile right now. Please try again.';
}

export default function AccountProfilePage({ onBack }) {
  const { user, profile, supabase, updateProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setFullName(profile?.full_name || '');
  }, [profile?.full_name]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!user?.id || !supabase) {
      setError('Profile saving is unavailable right now.');
      return;
    }

    setSaving(true);
    const nextName = fullName.trim();

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: nextName || null })
      .eq('user_id', user.id)
      .select('*')
      .single();

    setSaving(false);

    if (updateError) {
      console.warn('[account-profile] Profile update failed.', {
        code: updateError.code || null,
        message: updateError.message || null,
        userIdPresent: Boolean(user?.id)
      });
      setError(friendlyProfileError(updateError));
      return;
    }

    setFullName(nextName);
    updateProfile({
      ...(profile || {}),
      user_id: user.id,
      full_name: nextName || null
    });
    setMessage('Profile updated.');
  };

  return (
    <>
      <button type="button" className="back-button" onClick={onBack}>
        Back to Home
      </button>

      <section className="panel account-profile-page">
        <div className="account-profile-header">
          <div>
            <span className="feature-eyebrow">Account</span>
            <h2>Profile</h2>
            <p className="muted">Manage the basic account details Banker Builder uses for your workspace.</p>
          </div>
          <div className="account-avatar" aria-hidden="true">
            {(fullName || user?.email || 'A').trim().charAt(0).toUpperCase()}
          </div>
        </div>

        {!profile ? (
          <p className="error">Your profile details could not be loaded. You can still view your email and log out.</p>
        ) : null}

        <form className="account-profile-form" onSubmit={saveProfile}>
          <label>
            Email
            <input value={user?.email || ''} readOnly />
          </label>

          <label>
            Full name
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </label>

          {message ? <p className="auth-message success">{message}</p> : null}
          {error ? <p className="auth-message error">{error}</p> : null}

          <div className="account-profile-actions">
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button type="button" className="secondary" onClick={signOut}>
              Log out
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
