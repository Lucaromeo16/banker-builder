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
    mode: 'hirevue-prep',
    eyebrow: 'Timed video screen',
    title: 'HireVue Prep',
    description: 'Practice realistic timed video interviews with AI feedback on communication, confidence, structure, and delivery.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h11v10H4z" />
        <path d="m15 10 5-3v10l-5-3" />
        <path d="M8 20h4" />
        <path d="M10 17v3" />
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
  },
  {
    mode: 'networking-hub',
    eyebrow: 'Recruiting CRM',
    title: 'Networking Hub',
    description: 'Track coffee chats, manage banker relationships, and generate AI-powered networking outreach.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0z" />
        <path d="M5 21a7 7 0 0 1 14 0" />
        <path d="M17 11h4" />
        <path d="M19 9v4" />
      </svg>
    )
  },
  {
    mode: 'resume-analyzer',
    eyebrow: 'AI resume review',
    title: 'Resume Analyzer',
    description: 'Get AI-powered feedback on your resume for investment banking recruiting.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h5" />
        <path d="M10 12h6" />
        <path d="M10 15h6" />
        <path d="M10 18h4" />
      </svg>
    )
  },
  {
    mode: 'application-tracker',
    eyebrow: 'Application workflow',
    title: 'Application Tracker',
    description: 'Track applications, interview rounds, deadlines, contacts, and recruiting notes.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5h16" />
        <path d="M4 12h16" />
        <path d="M4 19h16" />
        <path d="M8 3v18" />
        <path d="M16 3v18" />
      </svg>
    )
  },
  {
    mode: 'knowledge-base',
    eyebrow: 'Recruiting guide',
    title: 'Knowledge Base',
    description: 'Learn investment banking groups, recruiting strategy, technical concepts, and market terminology.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
        <path d="M4 5.5v16" />
        <path d="M8 7h8" />
        <path d="M8 11h7" />
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

      <section className="home-about" aria-labelledby="home-about-title">
        <div>
          <h2 id="home-about-title">What is Banker Builder?</h2>
          <p>
            Banker Builder is a one-stop platform for investment banking recruiting. It helps students research firms, estimate
            interview odds, build smarter target lists, and practice interview questions with AI-powered feedback.
          </p>
        </div>
        <div className="home-about-grid">
          <article>
            <span>Research</span>
            <p>Research banks by office, group, prestige, pay, and competitiveness</p>
          </article>
          <article>
            <span>Target</span>
            <p>Build a target list based on your resume, interests, and location preferences</p>
          </article>
          <article>
            <span>Practice</span>
            <p>Practice technical, behavioral, fit, and market questions with feedback</p>
          </article>
        </div>
      </section>

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
