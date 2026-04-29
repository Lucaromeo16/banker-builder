export default function HomePage({ onSelectMode }) {
  return (
    <section className="home-grid">
      <button type="button" className="feature-card" onClick={() => onSelectMode('interview')}>
        <span className="feature-eyebrow">Mode 1</span>
        <strong>Interview Odds Calculator</strong>
        <span>
          Select a firm, office, and group, then estimate your likelihood of receiving an interview.
        </span>
      </button>

      <button type="button" className="feature-card" onClick={() => onSelectMode('target-list')}>
        <span className="feature-eyebrow">Mode 2</span>
        <strong>Target List Builder</strong>
        <span>
          Enter your full profile once and generate a Reach / Target / Safety list of banks and offices.
        </span>
      </button>

      <button type="button" className="feature-card" onClick={() => onSelectMode('interview-prep')}>
        <span className="feature-eyebrow">Mode 3</span>
        <strong>Interview Prep</strong>
        <span>Practice-focused tools for technical, behavioral, and market prep.</span>
      </button>

      <button type="button" className="feature-card" onClick={() => onSelectMode('firm-map')}>
        <span className="feature-eyebrow">Mode 4</span>
        <strong>Investment Bank Firm Map</strong>
        <span>Explore banks, offices, groups, and market positioning.</span>
      </button>
    </section>
  );
}
