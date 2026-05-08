import { useState } from 'react';
import FirmMapPage from './components/FirmMapPage';
import HomePage from './components/HomePage';
import InterviewOddsPage from './components/InterviewOddsPage';
import InterviewPrepPage from './components/InterviewPrepPage';
import NetworkingHubPage from './components/NetworkingHubPage';
import TargetListBuilderPage from './components/TargetListBuilderPage';

const navItems = [
  { label: 'Home', mode: 'home' },
  { label: 'Interview Odds', mode: 'interview' },
  { label: 'Target List', mode: 'target-list' },
  { label: 'Interview Prep', mode: 'interview-prep' },
  { label: 'Firm Map', mode: 'firm-map' },
  { label: 'Networking Hub', mode: 'networking-hub' }
];

export default function App() {
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
            <p>Model interview odds, build target lists, practice interviews, map IB offices, and manage networking workflows.</p>
          </header>
        ) : null}

        {mode === 'home' ? <HomePage onSelectMode={selectMode} /> : null}

        {mode === 'interview' ? <InterviewOddsPage onBack={goHome} /> : null}

        {mode === 'target-list' ? <TargetListBuilderPage onBack={goHome} /> : null}

        {mode === 'interview-prep' ? <InterviewPrepPage onBack={goHome} /> : null}

        {mode === 'firm-map' ? <FirmMapPage onBack={goHome} onAddContact={addNetworkingContact} /> : null}

        {mode === 'networking-hub' ? (
          <NetworkingHubPage onBack={goHome} prefillContact={networkingPrefill} onPrefillConsumed={() => setNetworkingPrefill(null)} />
        ) : null}
      </main>
    </>
  );
}
