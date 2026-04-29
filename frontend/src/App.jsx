import { useState } from 'react';
import FirmMapPage from './components/FirmMapPage';
import HomePage from './components/HomePage';
import InputForm from './components/InputForm';
import InterviewOddsPage from './components/InterviewOddsPage';
import InterviewPrepPage from './components/InterviewPrepPage';
import ResultsPage from './components/ResultsPage';

const navItems = [
  { label: 'Home', mode: 'home' },
  { label: 'Interview Odds', mode: 'interview' },
  { label: 'Target List', mode: 'target-list' },
  { label: 'Interview Prep', mode: 'interview-prep' }
];

function PlaceholderPage({ message, onBack }) {
  return (
    <>
      <button type="button" className="back-button" onClick={onBack}>
        Back to Home
      </button>
      <section className="panel placeholder-panel">
        <h2>{message}</h2>
      </section>
    </>
  );
}

export default function App() {
  const [mode, setMode] = useState('home');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const goHome = () => {
    setMode('home');
    setResults(null);
    setError('');
  };

  const selectMode = (nextMode) => {
    setMode(nextMode);
    setResults(null);
    setError('');
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:4000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to score profile');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
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
        <header className="header">
          <h1>Banker Builder</h1>
          <p>Model interview odds and build a focused investment banking target list.</p>
        </header>

        {mode === 'home' ? <HomePage onSelectMode={selectMode} /> : null}

        {mode === 'interview' ? <InterviewOddsPage onBack={goHome} /> : null}

        {mode === 'target-list' ? (
          <>
            <button type="button" className="back-button" onClick={goHome}>
              Back to Home
            </button>
            <InputForm
              title="Target List Builder"
              submitLabel="Build Target List"
              onSubmit={handleSubmit}
              loading={loading}
            />
            {error ? <p className="error">{error}</p> : null}
            {results ? <ResultsPage data={results} /> : null}
          </>
        ) : null}

        {mode === 'interview-prep' ? (
          <InterviewPrepPage onBack={goHome} />
      ) : null}

      {mode === 'firm-map' ? (
        <FirmMapPage onBack={goHome} />
      ) : null}
      </main>
    </>
  );
}
