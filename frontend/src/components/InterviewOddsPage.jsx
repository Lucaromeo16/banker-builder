import { useEffect, useMemo, useState } from 'react';
import InterviewProfileForm from './InterviewProfileForm';
import ScoreBreakdown from './ScoreBreakdown';

const fallbackGroups = [
  'Generalist',
  'M&A',
  'Restructuring',
  'Financial Sponsors',
  'Technology',
  'Healthcare',
  'Industrials',
  'Consumer & Retail',
  'Financial Institutions'
];

export default function InterviewOddsPage({ onBack }) {
  const [opportunities, setOpportunities] = useState({ firms: [], groups: fallbackGroups });
  const [selection, setSelection] = useState({
    hireType: 'Summer Analyst',
    firm: '',
    office: '',
    group: 'Generalist'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadOpportunities() {
      try {
        const response = await fetch('http://localhost:4000/api/opportunities');
        if (!response.ok) throw new Error('Failed to load opportunities');
        const data = await response.json();
        if (ignore) return;

        const firstFirm = data.opportunities?.[0] || data.firms[0];
        setOpportunities(data);
        setSelection({
          hireType: 'Summer Analyst',
          firm: firstFirm?.firm || firstFirm?.name || '',
          office: firstFirm?.office || '',
          group: firstFirm?.group || data.groups[0] || 'Generalist'
        });
      } catch (err) {
        if (!ignore) setError(err.message || 'Could not load opportunities');
      }
    }

    loadOpportunities();

    return () => {
      ignore = true;
    };
  }, []);

  const firmOptions = useMemo(
    () => [...new Set(opportunities.firms.map((opportunity) => opportunity.firm || opportunity.name))],
    [opportunities.firms]
  );

  const officeOptions = useMemo(
    () =>
      [
        ...new Set(
          opportunities.firms
            .filter((opportunity) => (opportunity.firm || opportunity.name) === selection.firm)
            .map((opportunity) => opportunity.office)
        )
      ],
    [opportunities.firms, selection.firm]
  );

  const groupOptions = useMemo(
    () =>
      opportunities.firms
        .filter(
          (opportunity) =>
            (opportunity.firm || opportunity.name) === selection.firm &&
            opportunity.office === selection.office
        )
        .map((opportunity) => opportunity.group)
        .filter(Boolean),
    [opportunities.firms, selection.firm, selection.office]
  );

  const handleFirmChange = (firmName) => {
    const nextFirm = opportunities.firms.find((opportunity) => (opportunity.firm || opportunity.name) === firmName);
    setSelection((prev) => ({
      ...prev,
      firm: firmName,
      office: nextFirm?.office || '',
      group: nextFirm?.group || prev.group
    }));
    setResult(null);
  };

  const handleOfficeChange = (office) => {
    const nextOpportunity = opportunities.firms.find(
      (opportunity) => (opportunity.firm || opportunity.name) === selection.firm && opportunity.office === office
    );

    setSelection((prev) => ({
      ...prev,
      office,
      group: nextOpportunity?.group || prev.group
    }));
    setResult(null);
  };

  const handleSubmit = async (profile) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:4000/api/interview-odds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firmName: selection.firm,
          office: selection.office,
          group: selection.group,
          hireType: selection.hireType,
          profile
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate interview odds');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" className="back-button" onClick={onBack}>
        Back to Home
      </button>

      <section className="panel">
        <h2>Interview Odds Calculator</h2>
        <div className="grid">
          <label>
            <span>Hire Type</span>
            <select
              required
              value={selection.hireType}
              onChange={(e) => {
                setSelection({ ...selection, hireType: e.target.value });
                setResult(null);
              }}
            >
              <option value="Summer Analyst">Summer Analyst</option>
              <option value="Lateral Hire">Lateral Hire</option>
              <option value="MBA Associate">MBA Associate</option>
            </select>
          </label>

          <label>
            <span>Firm</span>
            <select value={selection.firm} onChange={(e) => handleFirmChange(e.target.value)}>
              {firmOptions.map((firm) => (
                <option key={firm} value={firm}>
                  {firm}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Office</span>
            <select
              value={selection.office}
              onChange={(e) => handleOfficeChange(e.target.value)}
            >
              {officeOptions.map((office) => (
                <option key={office} value={office}>
                  {office}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Group</span>
            <select
              value={selection.group}
              onChange={(e) => {
                setSelection({ ...selection, group: e.target.value });
                setResult(null);
              }}
            >
              {(groupOptions.length ? groupOptions : opportunities.groups).map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <InterviewProfileForm onSubmit={handleSubmit} loading={loading} />

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <section className="panel odds-result">
          <div>
            <span className="feature-eyebrow">Estimated interview likelihood</span>
            <h2>{result.likelihood}%</h2>
            <p>
              {result.hireType} · {result.opportunity.firm} · {result.opportunity.office} · {result.opportunity.group}
            </p>
            <p>{result.reason}</p>
          </div>

          <ScoreBreakdown scores={result.scoreBreakdown} />

          <div className="columns">
            <section>
              <h4>Strengths</h4>
              <ul>
                {result.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h4>Gaps</h4>
              <ul>
                {result.gaps.length ? (
                  result.gaps.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>No major gaps flagged for this opportunity.</li>
                )}
              </ul>
            </section>

            <section>
              <h4>Action Steps</h4>
              <ul>
                {result.actionSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </section>
      ) : null}
    </>
  );
}
