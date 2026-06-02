import { useEffect, useRef, useState } from 'react';
import AuthConfirmedPage from './auth/AuthConfirmedPage';
import AuthPage from './auth/AuthPage';
import { useAuth } from './auth/AuthContext';
import AccountProfilePage from './components/AccountProfilePage';
import AdminDashboardPage from './components/AdminDashboardPage';
import ApplicationTrackerPage from './components/ApplicationTrackerPage';
import FirmMapPage from './components/FirmMapPage';
import HomePage from './components/HomePage';
import HireVuePrepPage from './components/HireVuePrepPage';
import InterviewOddsPage from './components/InterviewOddsPage';
import InterviewPrepPage from './components/InterviewPrepPage';
import KnowledgeBasePage from './components/KnowledgeBasePage';
import NetworkingHubPage from './components/NetworkingHubPage';
import ResumeAnalyzerPage from './components/ResumeAnalyzerPage';
import TargetListBuilderPage from './components/TargetListBuilderPage';
import { trackEvent } from './lib/analytics';

const navItems = [
  { label: 'Home', mode: 'home' },
  { label: 'Interview Odds', mode: 'interview' },
  { label: 'Target List', mode: 'target-list' },
  { label: 'Interview Prep', mode: 'interview-prep' },
  { label: 'HireVue Prep', mode: 'hirevue-prep' },
  { label: 'Firm Map', mode: 'firm-map' },
  { label: 'Networking Hub', mode: 'networking-hub' },
  { label: 'Resume Analyzer', mode: 'resume-analyzer' },
  { label: 'Application Tracker', mode: 'application-tracker' },
  { label: 'Knowledge Base', mode: 'knowledge-base' }
];

const analyticsFeatureMap = {
  interview: { feature: 'interview_odds', is_beta: true },
  'target-list': { feature: 'target_list_builder', is_beta: true },
  'interview-prep': { feature: 'interview_prep', is_beta: true },
  'hirevue-prep': { feature: 'hirevue_prep', is_beta: false },
  'firm-map': { feature: 'firm_map', is_beta: false },
  'networking-hub': { feature: 'networking_hub', is_beta: false },
  'resume-analyzer': { feature: 'resume_analyzer', is_beta: false },
  'application-tracker': { feature: 'application_tracker', is_beta: false },
  'knowledge-base': { feature: 'knowledge_base', is_beta: false }
};

function getGlobalAuthMessage(authError) {
  if (!authError) return '';

  const normalized = authError.toLowerCase();
  if (normalized.includes('confirm your email')) return authError;

  return '';
}

export default function App() {
  const { user, profile, loading, profileLoading, isAuthReady, authError, signOut } = useAuth();
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isAdminRoute = currentPath === '/admin';
  const isAuthConfirmationRoute = currentPath === '/auth/confirmed' || currentPath === '/auth/callback';
  const [mode, setMode] = useState('home');
  const [networkingPrefill, setNetworkingPrefill] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef(null);
  const userEmail = user?.email ?? 'Account';
  const accountLabel = profile?.full_name || userEmail;
  const globalAuthMessage = getGlobalAuthMessage(authError);

  const goHome = () => {
    setMode('home');
    setMobileMenuOpen(false);
  };

  const selectMode = (nextMode) => {
    const analyticsFeature = analyticsFeatureMap[nextMode];
    if (analyticsFeature && nextMode !== mode) {
      trackEvent('feature_opened', analyticsFeature);
    }

    setMode(nextMode);
    setMobileMenuOpen(false);
  };

  const addNetworkingContact = (office) => {
    setNetworkingPrefill(office);
    setMode('networking-hub');
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!mobileMenuOpen || navRef.current?.contains(event.target)) return;
      setMobileMenuOpen(false);
    };

    const handleResize = () => {
      if (window.innerWidth >= 1100) setMobileMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileMenuOpen]);

  if (isAuthConfirmationRoute) {
    return <AuthConfirmedPage />;
  }

  if (!isAuthReady || loading || profileLoading) {
    return (
      <main className="auth-shell">
        <section className="auth-card auth-loading-card">
          <span className="auth-eyebrow">Banker Builder</span>
          <h1>Loading your workspace...</h1>
          <p>Checking your session and preparing your recruiting dashboard.</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (isAdminRoute) {
    return <AdminDashboardPage />;
  }

  return (
    <>
      <nav className="navbar" ref={navRef}>
        <div className="navbar-inner">
          <button type="button" className="site-title" onClick={() => selectMode('home')}>
            Banker Builder
          </button>
          <button
            type="button"
            className={mobileMenuOpen ? 'mobile-menu-button open' : 'mobile-menu-button'}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
          <div id="primary-navigation" className={mobileMenuOpen ? 'nav-links open' : 'nav-links'} aria-label="Primary navigation">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.mode}
                className={mode === item.mode ? 'nav-link active' : 'nav-link'}
                onClick={() => selectMode(item.mode)}
              >
                {item.label}
              </button>
            ))}
            <div className="account-controls">
              <button
                type="button"
                className={mode === 'account' ? 'account-profile-button active' : 'account-profile-button'}
                title={userEmail}
                onClick={() => selectMode('account')}
              >
                {accountLabel}
              </button>
              <button type="button" onClick={signOut}>
                Log out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container">
        {globalAuthMessage ? <div className="auth-banner error">{globalAuthMessage}</div> : null}

        {mode !== 'home' && mode !== 'account' ? (
          <header className="header page-header">
            <h1>Banker Builder</h1>
            <p>
              Model interview odds, build target lists, practice interviews, map IB offices, manage networking workflows, and
              organize your recruiting strategy.
            </p>
          </header>
        ) : null}

        {mode === 'home' ? <HomePage onSelectMode={selectMode} /> : null}

        {mode === 'account' ? <AccountProfilePage onBack={goHome} /> : null}

        {mode === 'interview' ? <InterviewOddsPage onBack={goHome} /> : null}

        {mode === 'target-list' ? <TargetListBuilderPage onBack={goHome} /> : null}

        {mode === 'interview-prep' ? <InterviewPrepPage onBack={goHome} /> : null}

        {mode === 'hirevue-prep' ? <HireVuePrepPage onBack={goHome} /> : null}

        {mode === 'firm-map' ? <FirmMapPage onBack={goHome} onAddContact={addNetworkingContact} /> : null}

        {mode === 'networking-hub' ? (
          <NetworkingHubPage onBack={goHome} prefillContact={networkingPrefill} onPrefillConsumed={() => setNetworkingPrefill(null)} />
        ) : null}

        {mode === 'resume-analyzer' ? <ResumeAnalyzerPage onBack={goHome} /> : null}

        {mode === 'application-tracker' ? <ApplicationTrackerPage onBack={goHome} /> : null}

        {mode === 'knowledge-base' ? <KnowledgeBasePage onBack={goHome} /> : null}
      </main>
    </>
  );
}
