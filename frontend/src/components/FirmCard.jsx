import ScoreBreakdown from './ScoreBreakdown';

function starsFromCompetitiveness(score = 0) {
  if (score >= 9) return '5/5 stars';
  if (score >= 8) return '4/5 stars';
  if (score >= 7) return '3/5 stars';
  if (score >= 6) return '2/5 stars';
  return '1/5 stars';
}

export default function FirmCard({ firm }) {
  const className = `firm-card ${firm.classification.toLowerCase()}`;

  return (
    <article className={className}>
      <div className="firm-heading">
        <h3>
          {firm.firm} <span>({firm.office}{firm.group ? ` · ${firm.group}` : ''})</span>
        </h3>
        <div className="tag-row">
          <span className="tag">{firm.tier || firm.type}</span>
          <span className="tag">{starsFromCompetitiveness(firm.competitiveness)}</span>
          <span className={`tag status ${firm.classification.toLowerCase()}`}>{firm.classification}</span>
        </div>
        <p className="meta">
          <strong>{firm.classification}</strong> · Confidence: {firm.confidence}
        </p>
        <p>{firm.reason}</p>
      </div>

      <ScoreBreakdown scores={firm.scoreBreakdown} />

      <div className="columns">
        <section>
          <h4>Strengths</h4>
          <ul>
            {firm.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h4>Gaps</h4>
          <ul>
            {firm.gaps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h4>Action Steps</h4>
          <ul>
            {firm.actionSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
