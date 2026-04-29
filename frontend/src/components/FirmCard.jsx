import ScoreBreakdown from './ScoreBreakdown';

export default function FirmCard({ firm }) {
  const className = `firm-card ${firm.classification.toLowerCase()}`;

  return (
    <article className={className}>
      <div className="firm-heading">
        <h3>
          {firm.firm} <span>({firm.office}{firm.group ? ` · ${firm.group}` : ''})</span>
        </h3>
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
