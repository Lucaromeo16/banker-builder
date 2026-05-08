import { useMemo, useState } from 'react';

const MIN_RESUME_TEXT_LENGTH = 200;

function clampScore(score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return 'N/A';
  return Math.max(1, Math.min(10, numericScore)).toFixed(1);
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function renderTextList(items) {
  const list = normalizeList(items);
  if (!list.length) return <p className="muted">No specific items returned.</p>;

  return (
    <ul>
      {list.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

export default function ResumeAnalyzerPage({ onBack }) {
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const wordCount = useMemo(() => resumeText.trim().split(/\s+/).filter(Boolean).length, [resumeText]);

  const analyzeResume = async () => {
    const trimmedResume = resumeText.trim();
    setAnalysis(null);
    setError('');

    if (!trimmedResume) {
      setError('Please paste your resume text first.');
      return;
    }

    if (trimmedResume.length < MIN_RESUME_TEXT_LENGTH) {
      setError('Please paste more resume content for a useful analysis.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/resume-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeText: trimmedResume })
      });

      const responseText = await response.text();
      const payload = responseText ? JSON.parse(responseText) : {};

      if (!response.ok) {
        throw new Error(payload?.details || payload?.error || `Resume analyzer request failed with status ${response.status}`);
      }

      setAnalysis(payload);
    } catch (requestError) {
      console.error('[resume-analyzer] Analysis request failed', requestError);
      setError('Resume analysis could not be generated. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const rewrites = normalizeList(analysis?.recommendedBulletRewrites);

  return (
    <section className="resume-analyzer-page">
      <button type="button" className="back-button" onClick={onBack}>
        Back to Home
      </button>

      <div className="networking-header">
        <div>
          <span className="feature-eyebrow">AI resume review</span>
          <h2>Resume Analyzer</h2>
          <p>Get investment-banking-specific feedback on your resume, bullets, and candidate positioning.</p>
        </div>
      </div>

      <section className="network-section resume-input-card" aria-labelledby="resume-input-title">
        <div className="section-heading">
          <div>
            <h3 id="resume-input-title">Paste Resume Text</h3>
            <p className="muted">Paste the text version of your resume. PDF upload can come later; this MVP reviews pasted content.</p>
          </div>
          <span className="resume-word-count">{wordCount} words</span>
        </div>

        <label>
          Resume text
          <textarea
            className="resume-textarea"
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            placeholder="Paste your resume text here..."
          />
        </label>

        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="resume-loading">Analyzing your resume through an investment banking recruiting lens...</p> : null}

        <button type="button" className="primary" onClick={analyzeResume} disabled={loading}>
          {loading ? 'Analyzing Resume...' : 'Analyze Resume'}
        </button>
      </section>

      {analysis ? (
        <section className="resume-results" aria-live="polite">
          <div className="resume-score-grid">
            <article className="resume-score-card featured">
              <span>Overall Score</span>
              <strong>{clampScore(analysis.overallScoreOutOf10)}/10</strong>
            </article>
            <article className="resume-score-card featured">
              <span>IB Readiness</span>
              <strong>{clampScore(analysis.ibReadinessScore)}/10</strong>
            </article>
            <article className="resume-score-card">
              <span>Formatting</span>
              <strong>{clampScore(analysis.formattingScore)}/10</strong>
            </article>
            <article className="resume-score-card">
              <span>Experience</span>
              <strong>{clampScore(analysis.experienceScore)}/10</strong>
            </article>
            <article className="resume-score-card">
              <span>Leadership</span>
              <strong>{clampScore(analysis.leadershipScore)}/10</strong>
            </article>
            <article className="resume-score-card">
              <span>Technical Relevance</span>
              <strong>{clampScore(analysis.technicalRelevanceScore)}/10</strong>
            </article>
          </div>

          <div className="resume-result-grid">
            <article className="resume-section-card">
              <h3>Strengths</h3>
              {renderTextList(analysis.strengths)}
            </article>
            <article className="resume-section-card">
              <h3>Weaknesses</h3>
              {renderTextList(analysis.weaknesses)}
            </article>
            <article className="resume-section-card">
              <h3>Missing Signals</h3>
              {renderTextList(analysis.missingSignals)}
            </article>
            <article className="resume-section-card">
              <h3>Positioning Advice</h3>
              <p>{analysis.suggestedResumePositioning || 'No positioning advice returned.'}</p>
            </article>
          </div>

          <section className="resume-section-card resume-wide-card">
            <h3>Suggested Bullet Rewrites</h3>
            {rewrites.length ? (
              <div className="resume-rewrite-list">
                {rewrites.map((rewrite, index) => {
                  const originalBullet = typeof rewrite === 'string' ? '' : rewrite.originalBullet;
                  const rewrittenBullet = typeof rewrite === 'string' ? rewrite : rewrite.rewrittenBullet;
                  const whyItWorks = typeof rewrite === 'string' ? '' : rewrite.whyItWorks;

                  return (
                    <article key={`${rewrittenBullet}-${index}`}>
                      {originalBullet ? <p className="muted">Original: {originalBullet}</p> : null}
                      <strong>{rewrittenBullet}</strong>
                      {whyItWorks ? <p>{whyItWorks}</p> : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="muted">No bullet rewrites returned.</p>
            )}
          </section>

          <section className="resume-section-card resume-wide-card">
            <h3>Next Steps</h3>
            {renderTextList(analysis.nextSteps)}
          </section>
        </section>
      ) : null}
    </section>
  );
}
