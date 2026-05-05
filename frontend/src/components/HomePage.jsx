const features = [
  {
    mode: 'interview',
    eyebrow: 'Probability model',
    title: 'Interview Odds Calculator',
    description: 'Select a firm, office, and group, then estimate your likelihood of receiving an interview.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19h16" />
        <path d="M7 16V9" />
        <path d="M12 16V5" />
        <path d="M17 16v-4" />
      </svg>
    )
  },
  {
    mode: 'target-list',
    eyebrow: 'Resume strategy',
    title: 'Target List Builder',
    description: 'Enter your full profile once and generate a Reach / Target / Safety list of banks and offices.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 5h12" />
        <path d="M6 12h12" />
        <path d="M6 19h8" />
        <path d="M4 5h.01" />
        <path d="M4 12h.01" />
        <path d="M4 19h.01" />
      </svg>
    )
  },
  {
    mode: 'interview-prep',
    eyebrow: 'Mock interview',
    title: 'Interview Prep',
    description: 'Practice technical, behavioral, fit, and market questions with structured feedback.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6h14v9H8l-3 3V6z" />
        <path d="M9 10h6" />
        <path d="M9 13h4" />
      </svg>
    )
  },
  {
    mode: 'firm-map',
    eyebrow: 'Office intelligence',
    title: 'Investment Bank Firm Map',
    description: 'Explore investment banking offices, groups, and market positioning across the United States.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 18 3 20V6l6-2 6 2 6-2v14l-6 2-6-2z" />
        <path d="M9 4v14" />
        <path d="M15 6v14" />
      </svg>
    )
  }
];

export default function HomePage({ onSelectMode }) {
  return (
    <section className="home-page">
      <div className="home-hero">
        <span className="feature-eyebrow">Investment banking recruiting platform</span>
        <h1>Banker Builder</h1>
        <p>Your complete platform for investment banking recruiting</p>
      </div>

      <div className="home-grid">
        {features.map((feature) => (
          <button type="button" className="feature-card" key={feature.mode} onClick={() => onSelectMode(feature.mode)}>
            <span className="feature-icon">{feature.icon}</span>
            <span className="feature-eyebrow">{feature.eyebrow}</span>
            <strong>{feature.title}</strong>
            <span>{feature.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
