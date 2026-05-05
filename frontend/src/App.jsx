import { useState } from 'react';
import FirmMapPage from './components/FirmMapPage';
import HomePage from './components/HomePage';
import InterviewOddsPage from './components/InterviewOddsPage';
import InterviewPrepPage from './components/InterviewPrepPage';
import TargetListBuilderPage from './components/TargetListBuilderPage';

const navItems = [
  { label: 'Home', mode: 'home' },
  { label: 'Interview Odds', mode: 'interview' },
  { label: 'Target List', mode: 'target-list' },
  { label: 'Interview Prep', mode: 'interview-prep' },
  { label: 'Firm Map', mode: 'firm-map' }
];

export default function App() {
  const [mode, setMode] = useState('home');

  const goHome = () => {
    setMode('home');
  };

  const selectMode = (nextMode) => {
    setMode(nextMode);
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
            <p>Model interview odds, build target lists, practice interviews, and map investment banking offices.</p>
          </header>
        ) : null}

        {mode === 'home' ? <HomePage onSelectMode={selectMode} /> : null}

        {mode === 'interview' ? <InterviewOddsPage onBack={goHome} /> : null}

        {mode === 'target-list' ? <TargetListBuilderPage onBack={goHome} /> : null}

        {mode === 'interview-prep' ? <InterviewPrepPage onBack={goHome} /> : null}

        {mode === 'firm-map' ? <FirmMapPage onBack={goHome} /> : null}
      </main>
    </>
  );
}
