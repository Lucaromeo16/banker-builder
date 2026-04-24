import { useState } from 'react';
import InputForm from './components/InputForm';
import ResultsPage from './components/ResultsPage';

export default function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <main className="container">
      <header className="header">
        <h1>Banker Builder</h1>
        <p>Model your recruiting odds and get targeted actions by firm and office.</p>
      </header>

      <InputForm onSubmit={handleSubmit} loading={loading} />
      {error ? <p className="error">{error}</p> : null}
      {results ? <ResultsPage data={results} /> : null}
    </main>
  );
}
