import { useMemo, useState } from 'react';

const categories = [
  'All',
  'Banking Groups',
  'Recruiting Strategy',
  'Technical Concepts',
  'Valuation',
  'Markets & Deals',
  'Geography / Office Strategy',
  'Career Paths'
];

const articles = [
  {
    title: 'What does Leveraged Finance do?',
    category: 'Banking Groups',
    summary: 'Leveraged Finance helps companies and sponsors raise debt for acquisitions, recapitalizations, and refinancing.',
    explanation:
      'Leveraged Finance, often called LevFin, sits between corporate banking, capital markets, and advisory. The group helps high-yield or highly levered companies raise debt through leveraged loans, high-yield bonds, and related financing structures. Analysts spend time on credit analysis, debt capacity, lender materials, rating agency considerations, and transaction execution. It is especially relevant for sponsor-backed buyouts because financing structure can drive private equity returns.',
    takeaways: ['Strong group for candidates interested in credit and sponsors', 'Work is technical and financing-heavy', 'Debt capacity and cash flow durability matter more than headline growth'],
    relatedTopics: ['Debt Capital Markets', 'Private equity exits', 'WACC']
  },
  {
    title: 'What is Restructuring?',
    category: 'Banking Groups',
    summary: 'Restructuring bankers advise distressed companies, creditors, or sponsors when capital structures are under pressure.',
    explanation:
      'Restructuring focuses on companies that may not be able to meet debt obligations or need to renegotiate their capital structure. Bankers analyze liquidity, debt maturities, creditor recoveries, enterprise value, and strategic alternatives. The work can include out-of-court exchanges, Chapter 11 processes, asset sales, rescue financing, and creditor negotiations. It is one of the most technical areas of banking because small valuation and priority assumptions can change outcomes dramatically.',
    takeaways: ['Highly technical and credit-oriented', 'Active in weak markets as well as strong markets', 'Requires comfort with downside cases and legal process basics'],
    relatedTopics: ['Enterprise value', 'Precedent transactions', 'Capital structure']
  },
  {
    title: 'What does M&A do?',
    category: 'Banking Groups',
    summary: 'M&A bankers advise clients on buying, selling, merging, or defending companies.',
    explanation:
      'M&A groups advise on strategic transactions. Analysts help build valuation materials, buyer or target profiles, process documents, accretion/dilution analysis, merger models, board materials, and diligence request lists. M&A is broad because it combines valuation, strategy, negotiation, financing, and execution. At some firms, M&A is a product group that partners with industry coverage teams; at others, industry groups run most of the M&A work themselves.',
    takeaways: ['Core advisory group with broad transaction exposure', 'Strong training ground for valuation and process work', 'Execution can be intense because live deals move quickly'],
    relatedTopics: ['Product groups vs coverage groups', 'Precedent transactions', 'Superdays']
  },
  {
    title: 'What is Equity Capital Markets?',
    category: 'Banking Groups',
    summary: 'ECM helps companies raise equity through IPOs, follow-ons, convertibles, and related market transactions.',
    explanation:
      'Equity Capital Markets connects corporate issuers with public equity investors. ECM bankers advise on IPO timing, valuation range, investor feedback, shareholder considerations, and execution mechanics. Compared with M&A, ECM is more market-sensitive and requires understanding investor sentiment, trading comparables, and issuance windows. Analysts may work on IPO bake-offs, roadshow materials, valuation updates, and market monitoring.',
    takeaways: ['Market-facing product group', 'Important for IPO and public equity issuance work', 'Strong fit for candidates interested in markets and client advice'],
    relatedTopics: ['IPO market', 'Public comps', 'Coverage groups']
  },
  {
    title: 'What is Debt Capital Markets?',
    category: 'Banking Groups',
    summary: 'DCM advises issuers on raising investment-grade debt and managing bond market access.',
    explanation:
      'Debt Capital Markets helps companies issue bonds and manage liability profiles. DCM bankers advise on timing, maturity, coupon, ratings, investor demand, and comparable bond pricing. The work is more markets-oriented than classic M&A and often connects closely with corporate banking and sales and trading. Analysts need to understand credit ratings, yield curves, spreads, and how macro conditions affect issuance.',
    takeaways: ['Best for candidates who like markets and fixed income', 'Less M&A modeling than advisory roles', 'Requires comfort with rates, spreads, and ratings'],
    relatedTopics: ['Leveraged Finance', 'WACC', 'Markets & Deals']
  },
  {
    title: 'Coverage groups explained',
    category: 'Banking Groups',
    summary: 'Coverage groups organize bankers by industry and own client relationships within that sector.',
    explanation:
      'Coverage groups focus on specific industries such as healthcare, technology, industrials, energy, consumer, FIG, or real estate. They understand sector trends, company positioning, valuation drivers, and senior client relationships. Coverage bankers often originate work and partner with product specialists such as M&A, LevFin, ECM, or DCM. At many banks, analysts in coverage still do substantial modeling and transaction execution.',
    takeaways: ['Coverage builds sector expertise', 'Client relationship ownership usually sits in coverage', 'Analyst experience varies by firm and group structure'],
    relatedTopics: ['Product groups vs coverage groups', 'Best groups for PE exits', 'Office strategy']
  },
  {
    title: 'Product groups vs coverage groups',
    category: 'Banking Groups',
    summary: 'Product groups specialize by transaction type, while coverage groups specialize by industry.',
    explanation:
      'Product groups such as M&A, LevFin, ECM, DCM, and Restructuring specialize in a type of transaction or financing. Coverage groups specialize in industries and client relationships. On a live deal, a technology coverage team might partner with M&A for a sale process or with LevFin for sponsor financing. Candidates should understand this distinction because group placement affects daily work, technical skill development, and exit opportunities.',
    takeaways: ['Product equals transaction expertise', 'Coverage equals industry expertise', 'The best choice depends on desired skill set and office platform'],
    relatedTopics: ['M&A', 'Leveraged Finance', 'Coverage groups']
  },
  {
    title: 'Elite Boutique vs Middle Market vs Bulge Bracket',
    category: 'Career Paths',
    summary: 'Bank categories differ by deal size, platform breadth, recruiting visibility, and analyst experience.',
    explanation:
      'Bulge brackets offer broad global platforms, lending capabilities, capital markets, and large analyst classes. Elite boutiques are advisory-focused firms that can compete on major M&A and restructuring assignments with leaner teams and high compensation. Middle market banks focus on sponsor, founder-owned, and mid-sized company transactions, often with strong regional or sector specialization. None is automatically best; fit depends on goals, geography, training, and realistic recruiting positioning.',
    takeaways: ['BBs offer platform breadth', 'EBs often offer intense advisory exposure', 'MM firms can provide strong responsibility and regional access'],
    relatedTopics: ['Target list', 'Private equity exits', 'Office strategy']
  },
  {
    title: 'NYC banking vs Houston banking',
    category: 'Geography / Office Strategy',
    summary: 'New York is broad and headquarters-heavy, while Houston is deeply tied to energy and infrastructure.',
    explanation:
      'New York has the broadest concentration of investment banking roles across M&A, sponsors, capital markets, FIG, healthcare, technology, consumer, and industrials. Houston is more specialized, with energy, power, infrastructure, and natural resources playing a major role. Candidates targeting Houston should be prepared to discuss energy markets and why that geography fits. Candidates targeting New York should expect more competition but also broader group variety.',
    takeaways: ['NYC has maximum breadth and competition', 'Houston rewards sector-specific energy interest', 'Office choice should match story and networking plan'],
    relatedTopics: ['Energy banking', 'Target list', 'Networking']
  },
  {
    title: 'Best groups for private equity exits',
    category: 'Career Paths',
    summary: 'M&A, sponsors, LevFin, and strong coverage groups are common paths to private equity recruiting.',
    explanation:
      'Private equity recruiters often look for analysts with strong modeling, transaction execution, and sponsor exposure. M&A, financial sponsors, leveraged finance, restructuring, and high-quality industry coverage groups can all be relevant. The firm and deal experience matter as much as the group label. Candidates should focus on getting live deal repetitions, understanding investment rationale, and being able to discuss businesses like an investor.',
    takeaways: ['Modeling and deal reps matter most', 'Sponsors and M&A are naturally relevant', 'Strong coverage experience can also place well'],
    relatedTopics: ['M&A', 'Leveraged Finance', 'Financial Sponsors']
  },
  {
    title: 'What is enterprise value?',
    category: 'Technical Concepts',
    summary: 'Enterprise value measures the value of a company’s core operations to all capital providers.',
    explanation:
      'Enterprise value is typically calculated as equity value plus debt, preferred stock, and minority interest, minus cash. It represents the value of the operating business independent of capital structure. Bankers use enterprise value with operating metrics such as revenue, EBITDA, EBIT, or free cash flow. It is useful because buyers effectively assume or repay debt and receive the company’s cash balance when acquiring a business.',
    takeaways: ['EV is capital-structure-neutral', 'EV bridges to equity value by subtracting net debt', 'Use EV with unlevered operating metrics'],
    relatedTopics: ['Public comps', 'DCF', 'Precedent transactions']
  },
  {
    title: 'Walk me through a DCF',
    category: 'Valuation',
    summary: 'A DCF values a business based on the present value of projected future free cash flows.',
    explanation:
      'A discounted cash flow analysis starts by projecting unlevered free cash flow for several years. Then the analyst estimates terminal value using either an exit multiple or perpetuity growth method. Projected cash flows and terminal value are discounted back at WACC to arrive at enterprise value. Finally, net debt and other claims are adjusted to reach equity value. The method is conceptually rigorous but highly sensitive to assumptions.',
    takeaways: ['Project unlevered free cash flow', 'Calculate terminal value', 'Discount at WACC and bridge to equity value'],
    relatedTopics: ['WACC', 'Enterprise value', 'Free cash flow']
  },
  {
    title: 'What is WACC?',
    category: 'Valuation',
    summary: 'WACC is the blended required return for all capital providers based on the company’s capital structure.',
    explanation:
      'Weighted average cost of capital combines the cost of equity, after-tax cost of debt, and cost of preferred stock if applicable. It is used to discount unlevered free cash flow because those cash flows are available to all capital providers. Cost of equity is often estimated with CAPM, while cost of debt is based on market borrowing costs adjusted for taxes. WACC should reflect the risk and target capital structure of the business being valued.',
    takeaways: ['WACC discounts unlevered free cash flow', 'Debt is tax-effected because interest is deductible', 'Assumptions should match business risk and capital structure'],
    relatedTopics: ['DCF', 'CAPM', 'Debt Capital Markets']
  },
  {
    title: 'What are public comps?',
    category: 'Valuation',
    summary: 'Public comps value a company by comparing it to similar publicly traded companies.',
    explanation:
      'Comparable company analysis selects a peer set of public companies and compares valuation multiples such as EV / Revenue, EV / EBITDA, P/E, or sector-specific metrics. Analysts adjust for growth, margins, scale, profitability, business model, and risk. Public comps reflect current market sentiment, which is both a strength and a limitation. The hardest part is choosing the right peer set and explaining differences between companies.',
    takeaways: ['Peer selection drives the analysis', 'Multiples reflect current market conditions', 'Growth, margins, and risk explain premium or discount valuations'],
    relatedTopics: ['Enterprise value', 'Precedent transactions', 'ECM']
  },
  {
    title: 'What are precedent transactions?',
    category: 'Valuation',
    summary: 'Precedent transactions value a company based on prices paid in similar M&A deals.',
    explanation:
      'Precedent transaction analysis looks at historical acquisitions of similar companies. Multiples often include a control premium because buyers pay for control and expected synergies. The analysis can be useful for M&A valuation, but transaction context matters: market timing, buyer type, strategic rationale, auction dynamics, and company quality can all affect price. Good candidates explain why a deal is or is not truly comparable.',
    takeaways: ['Precedents often include control premiums', 'Deal context matters as much as the multiple', 'Best used alongside public comps and DCF'],
    relatedTopics: ['M&A', 'Public comps', 'DCF']
  },
  {
    title: 'What makes a good coffee chat?',
    category: 'Recruiting Strategy',
    summary: 'A strong coffee chat is prepared, concise, curious, and followed by thoughtful next steps.',
    explanation:
      'A good coffee chat is not a scripted interrogation. Start with a concise introduction, ask informed questions about the banker’s path and group, and show that you have done basic research. Avoid asking for a referral immediately. The goal is to learn, build credibility, and create a reason to follow up. Afterward, send a brief thank-you note and keep the relationship warm with specific updates.',
    takeaways: ['Prepare firm and group-specific questions', 'Keep your story concise', 'Follow up with substance, not just checking in'],
    relatedTopics: ['Networking as a non-target', 'Referral asks', 'Interview odds']
  },
  {
    title: 'How to approach networking as a non-target student',
    category: 'Recruiting Strategy',
    summary: 'Non-target candidates need earlier outreach, sharper targeting, and more evidence of technical preparation.',
    explanation:
      'Non-target recruiting is possible, but it requires a deliberate process. Build a targeted list of alumni, regional offices, middle market firms, and groups where your story is credible. Lead with a concise background, explain why banking, and show proof of preparation through coursework, clubs, modeling, internships, or self-study. Consistency matters because one or two chats usually are not enough to overcome limited on-campus access.',
    takeaways: ['Start earlier than target-school peers', 'Prioritize alumni and regional fit', 'Use preparation and persistence to reduce perceived risk'],
    relatedTopics: ['Target list', 'Coffee chats', 'Application Tracker']
  },
  {
    title: 'How to build an IB target list',
    category: 'Recruiting Strategy',
    summary: 'A good target list balances reach, target, and safety firms based on profile, location, and group fit.',
    explanation:
      'An IB target list should not be only brand-name banks. Start with your school placement, GPA, experience, geography, and sector interests. Include reach firms that stretch your profile, target firms where you have credible fit, and safety firms that still provide real banking experience. Office strategy matters: some regional offices are more accessible and still offer strong transaction exposure. Update the list as networking feedback improves.',
    takeaways: ['Balance ambition with probability', 'Use geography and alumni links strategically', 'Deduplicate firms but track office-level fit'],
    relatedTopics: ['Elite Boutique vs Middle Market vs Bulge Bracket', 'Office strategy', 'Networking']
  },
  {
    title: 'What is a superday?',
    category: 'Recruiting Strategy',
    summary: 'A superday is a final-round interview process with multiple bankers across technical, behavioral, and fit questions.',
    explanation:
      'Superdays usually include several back-to-back interviews with analysts, associates, VPs, directors, or MDs. Questions can cover technical finance, behavioral stories, why banking, why the firm, market awareness, and group fit. The process tests consistency, polish, stamina, and whether multiple people can imagine working with you. Preparation should include concise stories, technical fluency, firm research, and thoughtful questions.',
    takeaways: ['Expect multiple interviews in one day', 'Consistency and energy matter', 'Prepare technicals and fit equally'],
    relatedTopics: ['Interview Prep', 'Why banking', 'Technical Concepts']
  },
  {
    title: 'How IB recruiting timelines work at a high level',
    category: 'Recruiting Strategy',
    summary: 'IB recruiting is early, accelerated, and varies by firm, school, office, and candidate channel.',
    explanation:
      'Investment banking recruiting often begins well before students expect. Summer analyst recruiting can open more than a year before the internship starts, especially for larger banks. Timelines vary across bulge brackets, elite boutiques, middle market firms, diversity programs, regional offices, and off-cycle opportunities. Candidates should track deadlines, network before applications open, and avoid relying on one formal portal submission.',
    takeaways: ['Recruiting starts early', 'Networking should precede applications', 'Deadlines differ by platform and office'],
    relatedTopics: ['Application Tracker', 'Target list', 'Coffee chats']
  }
];

export default function KnowledgeBasePage({ onBack }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const filteredArticles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return articles.filter((article) => {
      const categoryMatch = selectedCategory === 'All' || article.category === selectedCategory;
      const searchMatch =
        !query ||
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query);
      return categoryMatch && searchMatch;
    });
  }, [searchTerm, selectedCategory]);

  if (selectedArticle) {
    return (
      <section className="knowledge-base-page">
        <button type="button" className="back-button" onClick={() => setSelectedArticle(null)}>
          Back to Knowledge Base
        </button>
        <article className="knowledge-detail network-section">
          <span className="feature-eyebrow">{selectedArticle.category}</span>
          <h2>{selectedArticle.title}</h2>
          <p className="knowledge-summary">{selectedArticle.summary}</p>
          <div>
            <h3>Explanation</h3>
            <p>{selectedArticle.explanation}</p>
          </div>
          <div className="knowledge-detail-grid">
            <section>
              <h3>Key Takeaways</h3>
              <ul>
                {selectedArticle.takeaways.map((takeaway) => (
                  <li key={takeaway}>{takeaway}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Related Topics</h3>
              <div className="tag-row">
                {selectedArticle.relatedTopics.map((topic) => (
                  <span className="tag" key={topic}>
                    {topic}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="knowledge-base-page">
      <button type="button" className="back-button" onClick={onBack}>
        Back to Home
      </button>

      <div className="networking-header">
        <div>
          <span className="feature-eyebrow">Recruiting encyclopedia</span>
          <h2>Knowledge Base</h2>
          <p>Learn investment banking groups, recruiting strategy, technical concepts, and market terminology.</p>
        </div>
      </div>

      <section className="network-section">
        <label>
          Search articles
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search groups, valuation, recruiting strategy..."
          />
        </label>
        <div className="chips" aria-label="Knowledge Base categories">
          {categories.map((category) => (
            <button
              type="button"
              className={selectedCategory === category ? 'chip selected' : 'chip'}
              key={category}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <p className="muted">Showing {filteredArticles.length} articles.</p>
      </section>

      <div className="knowledge-grid">
        {filteredArticles.length ? (
          filteredArticles.map((article) => (
            <button type="button" className="knowledge-card" key={article.title} onClick={() => setSelectedArticle(article)}>
              <span className="feature-eyebrow">{article.category}</span>
              <strong>{article.title}</strong>
              <span>{article.summary}</span>
              <div className="tag-row">
                {article.relatedTopics.slice(0, 3).map((topic) => (
                  <span className="tag" key={topic}>
                    {topic}
                  </span>
                ))}
              </div>
            </button>
          ))
        ) : (
          <section className="network-section">
            <p className="muted">No articles match your search.</p>
          </section>
        )}
      </div>
    </section>
  );
}
