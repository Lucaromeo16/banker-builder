import FirmCard from './FirmCard';

export default function ResultsPage({ data }) {
  const groups = {
    Reach: [],
    Target: [],
    Safety: []
  };

  data.results.forEach((firm) => {
    groups[firm.classification].push(firm);
  });

  return (
    <section className="panel results">
      <h2>Target List Results</h2>
      <div className="results-grid">
        {['Reach', 'Target', 'Safety'].map((category) => (
          <div key={category} className={`category-block ${category.toLowerCase()}`}>
            <h3>
              {category} <span>{groups[category].length}</span>
            </h3>
            <div className="stack">
              {groups[category].length ? (
                groups[category].map((firm) => <FirmCard key={firm.id || `${firm.firm}-${firm.office}-${firm.group}`} firm={firm} />)
              ) : (
                <p className="muted">No firms in this category for this profile.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
