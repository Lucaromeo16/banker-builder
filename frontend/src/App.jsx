import { useState } from 'react';
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

export default function App() {
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname === '/admin';
  const [mode, setMode] = useState('home');
  const [networkingPrefill, setNetworkingPrefill] = useState(null);

  const goHome = () => {
    setMode('home');
  };

  const selectMode = (nextMode) => {
    setMode(nextMode);
  };

  const addNetworkingContact = (office) => {
    setNetworkingPrefill(office);
    setMode('networking-hub');
  };

  if (isAdminRoute) {
    return <AdminDashboardPage />;
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <button type="button" className="site-title" onClick={() => selectMode('home')}>
            Banker Builder
          </button>
          <div className="nav-links" aria-label="Primary navigation">
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
          </div>
        </div>
      </nav>

      <main className="container">
        {mode !== 'home' ? (
          <header className="header page-header">
            <h1>Banker Builder</h1>
            <p>
              Model interview odds, build target lists, practice interviews, map IB offices, manage networking workflows, and
              organize your recruiting strategy.
            </p>
          </header>
        ) : null}

        {mode === 'home' ? <HomePage onSelectMode={selectMode} /> : null}

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
