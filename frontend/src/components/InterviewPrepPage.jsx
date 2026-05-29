import { useEffect, useRef, useState } from 'react';

const recruitingGoals = ['Summer Analyst', 'Lateral', 'MBA Associate'];
const targetGroupOptions = [
  'M&A',
  'Restructuring',
  'LevFin',
  'Financial Sponsors',
  'ECM',
  'DCM',
  'Capital Markets',
  'Strategic Advisory',
  'Healthcare',
  'Technology',
  'Software',
  'FinTech',
  'Industrials',
  'FIG',
  'Real Estate',
  'Energy',
  'Power & Utilities',
  'Infrastructure',
  'Consumer & Retail',
  'Business Services',
  'Media & Telecom',
  'Aerospace & Defense',
  'Natural Resources',
  'Generalist'
];
const bankTierOptions = ['Bulge Bracket', 'Elite Boutique', 'Middle Market', 'Regional Boutique', 'General / Mixed'];

const emptyPrepProfile = {
  recruitingGoal: '',
  targetGroups: [],
  targetBankTier: '',
  practiceMode: 'resume-aware',
  resumeText: '',
  resumeFileName: '',
  resumeContext: null
};
const prepProfileSessionKey = 'bankerBuilderInterviewPrepProfile';

function normalizePrepProfile(profile) {
  if (!profile) return null;
  return {
    ...emptyPrepProfile,
    ...profile,
    targetGroups: Array.isArray(profile.targetGroups) ? profile.targetGroups : [],
    practiceMode: profile.practiceMode === 'generic' ? 'generic' : 'resume-aware',
    resumeText: typeof profile.resumeText === 'string' ? profile.resumeText : '',
    resumeFileName: typeof profile.resumeFileName === 'string' ? profile.resumeFileName : '',
    resumeContext: profile.resumeContext || (profile.resumeText ? buildResumeContext(profile.resumeText) : null)
  };
}

function getProfileForSessionStorage(profile) {
  const normalized = normalizePrepProfile(profile);
  if (!normalized) return null;
  return {
    ...normalized,
    resumeText: '',
    resumeContext: null,
    resumeFileName: normalized.practiceMode === 'resume-aware' ? normalized.resumeFileName : ''
  };
}

function readStoredPrepProfile() {
  if (typeof window === 'undefined') return null;
  try {
    const storedProfile = window.sessionStorage.getItem(prepProfileSessionKey);
    if (!storedProfile) return null;
    const normalized = normalizePrepProfile(JSON.parse(storedProfile));
    return normalized?.practiceMode === 'resume-aware' && !normalized.resumeText ? null : normalized;
  } catch {
    return null;
  }
}

function normalizeResumeLine(line) {
  return line.replace(/\s+/g, ' ').trim();
}

function sectionKeyFromLine(line) {
  const normalized = normalizeResumeLine(line).toLowerCase();
  if (/^(education|academic background)$/.test(normalized)) return 'education';
  if (/^(work experience|professional experience|experience|employment|relevant experience)$/.test(normalized)) return 'workExperience';
  if (/^(leadership|leadership experience|activities|involvement|extracurriculars|campus involvement|leadership & activities|leadership and activities)$/.test(normalized)) return 'leadership';
  if (/^(additional|skills|certifications|interests|additional information|technical skills)$/.test(normalized)) return 'additional';
  return null;
}

function splitResumeSections(resumeText) {
  const sections = {
    education: [],
    workExperience: [],
    leadership: [],
    additional: []
  };
  let currentSection = 'additional';
  resumeText
    .replace(/\s+(EDUCATION|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EXPERIENCE|EMPLOYMENT|LEADERSHIP|ACTIVITIES|INVOLVEMENT|EXTRACURRICULARS|ADDITIONAL|SKILLS|CERTIFICATIONS|INTERESTS)\s+/g, '\n$1\n')
    .split(/\n|(?=\s*[•●▪-]\s+)/)
    .map(normalizeResumeLine)
    .filter(Boolean)
    .forEach((line) => {
      const nextSection = sectionKeyFromLine(line);
      if (nextSection) {
        currentSection = nextSection;
        return;
      }
      sections[currentSection].push(line);
    });
  return sections;
}

function looksLikeExperienceHeader(line) {
  return (
    /\b(20\d{2}|19\d{2}|present|current|incoming|summer|fall|spring|winter)\b/i.test(line) &&
    !/^[•●▪-]/.test(line) &&
    line.length < 180
  );
}

function parseExperienceHeader(line) {
  const clean = normalizeResumeLine(line).replace(/\s+[|•]\s+/g, ' - ');
  const dateMatch = clean.match(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+)?(?:20\d{2}|19\d{2})\s*(?:[-–—]|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+)?(?:20\d{2}|19\d{2}|Present|Current)|\b(?:Present|Current|Incoming)\b/i);
  const dates = dateMatch?.[0] || '';
  const beforeDate = dates ? clean.slice(0, dateMatch.index).trim() : clean;
  const pieces = beforeDate
    .split(/\s+-\s+|\s+\|\s+|,\s+(?=[A-Z])/)
    .map(normalizeResumeLine)
    .filter(Boolean);
  return {
    organization: pieces[0] || beforeDate || 'Resume experience',
    title: pieces.slice(1).join(' - '),
    dates
  };
}

function strongestThemesFromText(text) {
  const themes = [];
  [
    ['valuation', /\bvaluation|DCF|comps|precedent|model/i],
    ['financial analysis', /\bfinancial analysis|forecast|budget|revenue|margin|EBITDA/i],
    ['client service', /\bclient|customer|stakeholder/i],
    ['leadership', /\bled|lead|managed|captain|president|chair|founder/i],
    ['research', /\bresearch|market|industry|competitive/i],
    ['operations', /\boperations|process|workflow|compliance|audit/i]
  ].forEach(([theme, pattern]) => {
    if (pattern.test(text)) themes.push(theme);
  });
  return themes.slice(0, 3);
}

function parseResumeItems(lines, type) {
  const items = [];
  lines.forEach((line) => {
    const cleaned = normalizeResumeLine(line);
    if (!cleaned) return;
    if (looksLikeExperienceHeader(cleaned) || (!items.length && !/^[•●▪-]/.test(cleaned))) {
      if (looksLikeExperienceHeader(cleaned)) {
        const parsed = parseExperienceHeader(cleaned);
        items.push({ id: `${type}-${items.length}`, type, ...parsed, bullets: [], strongestThemes: [] });
      } else if (!items.length) {
        items.push({ id: `${type}-${items.length}`, type, organization: cleaned, title: '', dates: '', bullets: [], strongestThemes: [] });
      }
      return;
    }
    const current = items[items.length - 1];
    if (current && current.bullets.length < 5) current.bullets.push(cleaned.replace(/^[•●▪-]\s*/, ''));
  });
  return items
    .map((item) => ({
      ...item,
      strongestThemes: strongestThemesFromText(`${item.organization} ${item.title} ${item.bullets.join(' ')}`)
    }))
    .filter((item) => item.organization && item.organization.length > 2)
    .slice(0, 8);
}

function buildResumeContext(resumeText) {
  if (!resumeText) return null;
  const sections = splitResumeSections(resumeText);
  return {
    education: sections.education.slice(0, 8),
    workExperience: parseResumeItems(sections.workExperience, 'work'),
    leadership: parseResumeItems(sections.leadership, 'leadership'),
    additional: sections.additional.slice(0, 10)
  };
}

const questionBanks = {
  technical: {
    title: 'Technical Questions',
    cardTitle: 'Technical Questions',
    description: 'Practice accounting, valuation, and finance concepts commonly tested in banking interviews.',
    concepts: ['accounting', 'valuation', 'cash flow', 'enterprise value', 'wacc', 'dcf', 'ebitda', 'debt'],
    structureHint: 'Define the concept, walk through the mechanics, then connect it to valuation or deal analysis.',
    followUps: [
      'How would your answer change for a highly levered company?',
      'What is the most common mistake candidates make on this concept?',
      'Can you connect that answer to a valuation model?'
    ],
    questions: [
      {
        prompt: 'Walk me through the three financial statements.',
        keywords: ['income statement', 'balance sheet', 'cash flow', 'net income', 'assets', 'liabilities', 'cash']
      },
      {
        prompt: 'How does depreciation flow through the financial statements?',
        keywords: ['depreciation', 'tax', 'net income', 'cash flow', 'capex', 'pp&e', 'balance sheet']
      },
      {
        prompt: 'What is enterprise value?',
        keywords: ['equity value', 'debt', 'cash', 'minority interest', 'preferred stock', 'takeover value']
      },
      {
        prompt: 'How do you calculate WACC?',
        keywords: ['cost of equity', 'cost of debt', 'tax', 'capital structure', 'beta', 'risk free']
      },
      {
        prompt: 'Walk me through a DCF.',
        keywords: ['free cash flow', 'forecast', 'wacc', 'terminal value', 'discount', 'enterprise value']
      },
      {
        prompt: 'What are the main valuation methodologies?',
        keywords: ['comparable companies', 'precedent transactions', 'dcf', 'multiples', 'public comps']
      },
      {
        prompt: 'How do you calculate free cash flow?',
        keywords: ['ebit', 'tax', 'depreciation', 'capex', 'working capital', 'cash flow']
      },
      {
        prompt: 'What happens when a company issues debt?',
        keywords: ['cash', 'debt', 'interest expense', 'tax shield', 'balance sheet', 'enterprise value']
      },
      {
        prompt: 'Why might two companies with the same EBITDA trade at different multiples?',
        keywords: ['growth', 'margin', 'risk', 'market position', 'recurring revenue', 'capital intensity']
      },
      {
        prompt: 'What is accretion/dilution?',
        keywords: ['eps', 'earnings per share', 'pro forma', 'purchase price', 'synergies', 'financing']
      },
      {
        prompt: 'How would you evaluate whether an M&A transaction is financially attractive?',
        keywords: ['valuation', 'synergies', 'purchase price', 'accretion', 'strategic rationale'],
        targetGroups: ['M&A']
      },
      {
        prompt: 'What are the key credit metrics you would look at for a debt financing?',
        keywords: ['leverage', 'interest coverage', 'cash flow', 'debt capacity', 'credit'],
        targetGroups: ['LevFin', 'DCM']
      },
      {
        prompt: 'How would you think about recovery value in a restructuring?',
        keywords: ['enterprise value', 'capital structure', 'priority', 'creditors', 'recovery'],
        targetGroups: ['Restructuring']
      },
      {
        prompt: 'What would make an acquisition accretive or dilutive?',
        keywords: ['eps', 'purchase price', 'financing mix', 'synergies', 'pro forma earnings'],
        groupTags: ['M&A']
      },
      {
        prompt: 'How would you estimate debt capacity for a leveraged buyout?',
        keywords: ['leverage', 'ebitda', 'interest coverage', 'cash flow', 'covenants'],
        groupTags: ['LevFin', 'Financial Sponsors']
      },
      {
        prompt: 'What factors influence whether a company should issue debt or equity?',
        keywords: ['cost of capital', 'leverage', 'market conditions', 'dilution', 'credit rating'],
        groupTags: ['DCM', 'ECM', 'Capital Markets']
      },
      {
        prompt: 'How would rising rates affect bond issuance and refinancing activity?',
        keywords: ['rates', 'yield', 'spreads', 'refinancing', 'duration'],
        groupTags: ['DCM', 'Capital Markets']
      },
      {
        prompt: 'What SaaS metrics would you focus on when evaluating a software company?',
        keywords: ['arr', 'net retention', 'churn', 'gross margin', 'rule of 40'],
        groupTags: ['Technology', 'Software']
      },
      {
        prompt: 'How are banks or financial institutions often valued differently from industrial companies?',
        keywords: ['book value', 'tangible book', 'roe', 'regulatory capital', 'net interest margin'],
        groupTags: ['FIG']
      },
      {
        prompt: 'What metrics matter when valuing a real estate company?',
        keywords: ['nav', 'cap rate', 'noi', 'ffo', 'occupancy'],
        groupTags: ['Real Estate']
      }
    ]
  },
  behavioral: {
    title: 'Behavioral Questions',
    cardTitle: 'Behavioral Questions',
    description: 'Practice personal story, teamwork, leadership, conflict, pressure, and feedback prompts.',
    concepts: ['situation', 'action', 'result', 'team', 'leadership', 'feedback', 'conflict', 'learned'],
    structureHint: 'Use a clear story arc: situation, task, action, result, and what you learned.',
    followUps: [
      'What would you do differently if you faced that situation again?',
      'How did other people on the team react?',
      'What did that experience teach you about working in banking?'
    ],
    questions: [
      { prompt: 'Tell me about yourself.', keywords: ['background', 'interest', 'banking', 'experience', 'why'] },
      { prompt: 'Walk me through your resume.', keywords: ['background', 'experience', 'transition', 'skills', 'banking'] },
      { prompt: 'Walk me through your story.', keywords: ['story', 'background', 'motivation', 'banking', 'progression'] },
      {
        prompt: 'What experience on your resume are you most likely to discuss?',
        keywords: ['experience', 'resume', 'impact', 'skills', 'banking']
      },
      {
        prompt: 'Tell me about the experience that best prepared you for banking.',
        keywords: ['prepared', 'experience', 'analytical', 'teamwork', 'deadline']
      },
      { prompt: 'Tell me about a time you worked on a team.', keywords: ['team', 'role', 'collaboration', 'result', 'learned'] },
      { prompt: 'Tell me about a time you failed.', keywords: ['failed', 'mistake', 'learned', 'improved', 'result'] },
      { prompt: 'Tell me about a time you led a group.', keywords: ['led', 'team', 'goal', 'action', 'result'] },
      { prompt: 'Tell me about a time you handled conflict.', keywords: ['conflict', 'listen', 'resolve', 'team', 'outcome'] },
      { prompt: 'What is your greatest weakness?', keywords: ['weakness', 'example', 'improve', 'steps', 'progress'] },
      { prompt: 'What is an accomplishment you are proud of?', keywords: ['accomplishment', 'challenge', 'action', 'impact', 'proud'] },
      { prompt: 'Tell me about a time you worked under pressure.', keywords: ['pressure', 'deadline', 'prioritize', 'execute', 'result'] },
      { prompt: 'Tell me about a time you received difficult feedback.', keywords: ['feedback', 'listened', 'improved', 'changed', 'result'] },
      {
        prompt: 'Tell me about a time your student investment fund or finance club work changed your view on a company.',
        keywords: ['investment', 'research', 'thesis', 'team', 'judgment'],
        leadershipTags: ['Student Investment Fund', 'Finance Club']
      },
      {
        prompt: 'Tell me about a time you led peers without formal authority.',
        keywords: ['leadership', 'influence', 'team', 'communication', 'result'],
        leadershipTags: ['Social Fraternity/Sorority', 'Student Government', 'Nonprofit / Volunteering', 'Other Leadership']
      },
      {
        prompt: 'Tell me about a time athletics or another demanding activity taught you how to handle pressure.',
        keywords: ['pressure', 'discipline', 'team', 'resilience', 'performance'],
        leadershipTags: ['Varsity Athletics']
      },
      {
        prompt: 'Tell me about a time you built something from scratch.',
        keywords: ['initiative', 'startup', 'ambiguity', 'ownership', 'result'],
        leadershipTags: ['Entrepreneurship / Startup']
      }
    ]
  },
  fit: {
    title: 'Fit / Why Banking',
    cardTitle: 'Fit / Why Banking',
    description: 'Practice motivation, firm fit, group interest, office interest, and candidate positioning.',
    concepts: ['banking', 'transactions', 'learning curve', 'client', 'analytical', 'firm', 'group', 'fit'],
    structureHint: 'Anchor your motivation, connect it to specific evidence, then explain why the firm, group, or role fits.',
    followUps: [
      'Why would this role be a better fit than consulting?',
      'What have you done to validate that interest?',
      'What would make you successful in this group?'
    ],
    questions: [
      { prompt: 'Walk me through your story.', keywords: ['story', 'background', 'motivation', 'banking', 'fit'] },
      { prompt: 'Why investment banking?', keywords: ['transactions', 'finance', 'analytical', 'learning', 'client', 'pace'] },
      { prompt: 'Why this firm?', keywords: ['firm', 'culture', 'platform', 'deals', 'people', 'fit'] },
      { prompt: 'Why this group?', keywords: ['group', 'industry', 'transactions', 'interest', 'experience', 'fit'] },
      { prompt: 'Why this office?', keywords: ['office', 'market', 'location', 'team', 'clients', 'fit'] },
      {
        prompt: 'Why are you interested in M&A?',
        keywords: ['strategic', 'valuation', 'synergies', 'transactions', 'companies'],
        targetGroups: ['M&A']
      },
      {
        prompt: 'Why are you interested in restructuring?',
        keywords: ['distressed', 'capital structure', 'creditors', 'liquidity', 'turnaround'],
        targetGroups: ['Restructuring']
      },
      {
        prompt: 'Why are you interested in Leveraged Finance?',
        keywords: ['credit', 'debt', 'sponsors', 'capital structure', 'cash flow'],
        targetGroups: ['LevFin']
      },
      {
        prompt: 'Why are you interested in DCM?',
        keywords: ['debt markets', 'rates', 'bonds', 'issuance', 'capital markets'],
        targetGroups: ['DCM']
      },
      {
        prompt: 'Why are you interested in Financial Sponsors?',
        keywords: ['private equity', 'lbo', 'portfolio companies', 'debt financing', 'relationships'],
        groupTags: ['Financial Sponsors']
      },
      {
        prompt: 'Why are you interested in ECM?',
        keywords: ['ipo', 'equity markets', 'investor demand', 'issuance', 'growth companies'],
        groupTags: ['ECM', 'Capital Markets']
      },
      {
        prompt: 'Why are you interested in Strategic Advisory?',
        keywords: ['strategy', 'board-level advice', 'shareholder value', 'alternatives', 'transactions'],
        groupTags: ['Strategic Advisory']
      },
      {
        prompt: 'Why are you interested in Technology banking?',
        keywords: ['software', 'growth', 'business models', 'innovation', 'valuation'],
        targetGroups: ['Technology', 'Software', 'FinTech']
      },
      {
        prompt: 'Why are you interested in Healthcare banking?',
        keywords: ['healthcare', 'regulation', 'services', 'biotech', 'defensive'],
        targetGroups: ['Healthcare']
      },
      {
        prompt: 'Why are you interested in FIG?',
        keywords: ['banks', 'insurance', 'fintech', 'regulation', 'capital'],
        groupTags: ['FIG', 'FinTech']
      },
      {
        prompt: 'Why are you interested in Real Estate banking?',
        keywords: ['assets', 'cash flow', 'cap rates', 'development', 'reit'],
        groupTags: ['Real Estate']
      },
      {
        prompt: 'Why are you interested in Energy or Natural Resources banking?',
        keywords: ['commodity prices', 'cash flow', 'capital intensity', 'energy transition', 'assets'],
        groupTags: ['Energy', 'Natural Resources', 'Power & Utilities']
      },
      {
        prompt: 'Why are you interested in Consumer & Retail banking?',
        keywords: ['brands', 'consumer behavior', 'margins', 'growth', 'omnichannel'],
        groupTags: ['Consumer & Retail']
      },
      { prompt: 'Why should we hire you?', keywords: ['skills', 'work ethic', 'experience', 'team', 'impact'] },
      { prompt: 'What differentiates you from other candidates?', keywords: ['differentiates', 'experience', 'skill', 'perspective', 'evidence'] },
      { prompt: 'Where do you see yourself in five years?', keywords: ['banking', 'develop', 'responsibility', 'clients', 'long term'] },
      { prompt: 'Why banking instead of consulting or corporate finance?', keywords: ['transactions', 'finance', 'ownership', 'pace', 'valuation'] },
      {
        prompt: 'Why do you want to train on a bulge bracket platform?',
        keywords: ['platform', 'balance sheet', 'global', 'training', 'deal flow'],
        bankTierTags: ['Bulge Bracket']
      },
      {
        prompt: 'Why are you interested in an elite boutique environment?',
        keywords: ['advisory', 'lean teams', 'm&a', 'restructuring', 'senior exposure'],
        bankTierTags: ['Elite Boutique']
      },
      {
        prompt: 'Why are you interested in a middle-market or regional platform?',
        keywords: ['middle market', 'responsibility', 'clients', 'lean teams', 'regional'],
        bankTierTags: ['Middle Market', 'Regional Boutique']
      },
      {
        prompt: 'How would you explain your transition from audit or accounting into investment banking?',
        keywords: ['accounting', 'financial statements', 'transaction', 'transition', 'banking'],
        experienceTags: ['Accounting / Audit Internship']
      },
      {
        prompt: 'How would you connect TAS or business valuation experience to M&A banking?',
        keywords: ['valuation', 'diligence', 'quality of earnings', 'transactions', 'm&a'],
        groupTags: ['M&A', 'Strategic Advisory'],
        experienceTags: ['TAS / Business Valuation Internship']
      },
      {
        prompt: 'How would you explain your transition from consulting into investment banking?',
        keywords: ['strategy', 'transactions', 'finance', 'client', 'transition'],
        experienceTags: ['Consulting Internship']
      },
      {
        prompt: 'How would you connect corporate development or FP&A experience to advisory work?',
        keywords: ['corporate finance', 'strategy', 'analysis', 'transactions', 'forecasting'],
        groupTags: ['M&A', 'Strategic Advisory'],
        experienceTags: ['Corporate Finance / Corporate Accounting Internship']
      },
      {
        prompt: 'How would you explain your interest in banking without prior finance experience?',
        keywords: ['transferable skills', 'preparation', 'learning', 'analytical', 'motivation'],
        noRelevantExperienceOnly: true
      }
    ]
  },
  markets: {
    title: 'Market & Deal Discussion',
    cardTitle: 'Market & Deal Discussion',
    description: 'Practice recent transactions, macro themes, industry views, and deal rationale prompts.',
    concepts: ['deal', 'market', 'strategic', 'valuation', 'rates', 'synergies', 'industry', 'ipo'],
    structureHint: 'Name the situation, explain the strategic or market rationale, then give a clear view on risks and implications.',
    followUps: [
      'What would make that deal fail after close?',
      'How would you value that company?',
      'What market condition would change your view?'
    ],
    questions: [
      { prompt: 'Tell me about a recent deal you followed.', keywords: ['buyer', 'seller', 'valuation', 'strategic rationale', 'synergies'] },
      { prompt: 'What makes a deal strategically attractive?', keywords: ['strategy', 'growth', 'synergies', 'market', 'capabilities'] },
      {
        prompt: 'How would higher interest rates affect M&A activity?',
        keywords: ['rates', 'debt', 'financing', 'valuation', 'buyers'],
        groupTags: ['M&A']
      },
      { prompt: 'What industries are you currently following?', keywords: ['industry', 'trend', 'growth', 'companies', 'risks'] },
      { prompt: 'Pitch me a company.', keywords: ['company', 'business model', 'growth', 'valuation', 'risks'] },
      { prompt: 'What is one macro trend affecting investment banking?', keywords: ['macro', 'rates', 'inflation', 'markets', 'issuance'] },
      { prompt: 'What makes a company an attractive acquisition target?', keywords: ['growth', 'margin', 'market position', 'cash flow', 'synergies'] },
      { prompt: 'How would you think about synergies in a merger?', keywords: ['cost synergies', 'revenue synergies', 'integration', 'timing', 'risk'] },
      { prompt: 'What is happening in the IPO market?', keywords: ['ipo', 'equity markets', 'volatility', 'rates', 'investor demand'] },
      { prompt: 'What recent transaction stood out to you and why?', keywords: ['transaction', 'rationale', 'valuation', 'market', 'risk'] },
      {
        prompt: 'What debt market trend would matter most for a DCM or LevFin banker right now?',
        keywords: ['rates', 'spreads', 'issuance', 'credit', 'refinancing'],
        targetGroups: ['DCM', 'LevFin']
      },
      {
        prompt: 'What trend are you watching in healthcare deal activity?',
        keywords: ['healthcare', 'regulation', 'm&a', 'services', 'biotech'],
        targetGroups: ['Healthcare']
      },
      {
        prompt: 'What trend are you watching in technology M&A or IPOs?',
        keywords: ['technology', 'software', 'ipo', 'm&a', 'growth'],
        targetGroups: ['Technology', 'Software', 'FinTech']
      },
      {
        prompt: 'How would energy prices affect deal activity in Energy banking?',
        keywords: ['energy', 'commodity prices', 'cash flow', 'm&a', 'capital spending'],
        targetGroups: ['Energy']
      },
      {
        prompt: 'What capital markets trend would matter most for a company considering an IPO?',
        keywords: ['ipo', 'equity markets', 'volatility', 'valuation', 'investor demand'],
        groupTags: ['ECM', 'Capital Markets']
      },
      {
        prompt: 'What distressed market signal would you watch for a restructuring banker?',
        keywords: ['defaults', 'spreads', 'liquidity', 'maturities', 'capital structure'],
        groupTags: ['Restructuring']
      },
      {
        prompt: 'What deal trend matters most for private equity sponsors right now?',
        keywords: ['sponsors', 'lbo', 'financing', 'exit', 'valuation'],
        groupTags: ['Financial Sponsors', 'LevFin']
      },
      {
        prompt: 'What trend are you watching in infrastructure or power markets?',
        keywords: ['infrastructure', 'power', 'utilities', 'project finance', 'energy transition'],
        groupTags: ['Infrastructure', 'Power & Utilities']
      }
    ]
  }
};

const categoryCards = [
  { id: 'technical', ...questionBanks.technical },
  { id: 'behavioral', ...questionBanks.behavioral },
  { id: 'fit', ...questionBanks.fit },
  { id: 'markets', ...questionBanks.markets },
  {
    id: 'mixed',
    title: 'Mixed Mock Interview',
    cardTitle: 'Mixed Mock Interview',
    description: 'Practice a randomized mix across technical, behavioral, fit, and market questions.'
  }
];

const exampleResponses = {
  'Walk me through the three financial statements.':
    'The income statement shows profitability over a period, starting with revenue and ending with net income. Net income flows into retained earnings on the balance sheet and is also the starting point for the cash flow statement. The balance sheet shows assets, liabilities, and equity at a point in time, and the cash flow statement reconciles beginning cash to ending cash through operating, investing, and financing cash flows. The three statements connect mainly through net income, depreciation, capital expenditures, working capital, debt, and cash.',
  'How does depreciation flow through the financial statements?':
    'Depreciation reduces operating income on the income statement, which lowers pre-tax income and net income. Because it is non-cash, it gets added back on the cash flow statement, so cash flow increases by depreciation net of the tax impact. On the balance sheet, PP&E decreases by the depreciation amount, cash is higher from the tax savings, and retained earnings are lower because net income was lower.',
  'What is enterprise value?':
    'Enterprise value is the value of a company’s core operations available to all capital providers. The standard formula is equity value plus debt, preferred stock, and minority interest, minus cash. Conceptually, it represents what a buyer would pay to acquire the operating business regardless of how it is financed, which is why it is commonly paired with metrics like EBITDA and revenue.',
  'How do you calculate WACC?':
    'WACC is the weighted average cost of capital, using the company’s target capital structure. You multiply the cost of equity by the percentage of equity, add the after-tax cost of debt multiplied by the percentage of debt, and include preferred stock if relevant. Cost of equity is usually estimated with CAPM, and the cost of debt is adjusted for taxes because interest is tax deductible.',
  'Walk me through a DCF.':
    'A DCF values a company based on the present value of its future free cash flows. First, I would project operating results and unlevered free cash flow for five to ten years. Then I would calculate a terminal value using either an exit multiple or perpetuity growth method. Finally, I would discount the projected cash flows and terminal value back using WACC, sum them to get enterprise value, and bridge to equity value by subtracting net debt.',
  'What are the main valuation methodologies?':
    'The main valuation methods are comparable company analysis, precedent transaction analysis, and discounted cash flow analysis. Public comps value a company based on how similar public companies trade today. Precedent transactions look at prices paid in past M&A deals, usually including a control premium. A DCF values the business based on projected free cash flow and is more intrinsic, but also more sensitive to assumptions.',
  'How do you calculate free cash flow?':
    'For unlevered free cash flow, I would start with EBIT, tax-effect it to get NOPAT, add back depreciation and amortization, subtract capital expenditures, and subtract increases in net working capital. That gives cash flow available to all capital providers before financing decisions, which is why it is used in a DCF discounted at WACC.',
  'What happens when a company issues debt?':
    'When a company issues debt, cash and debt both increase on the balance sheet initially. Over time, the income statement reflects higher interest expense, which lowers pre-tax income and net income. On the cash flow statement, the debt issuance appears as a financing cash inflow, and future interest affects operating cash flow through net income, partly offset by the tax shield.',
  'Why might two companies with the same EBITDA trade at different multiples?':
    'Two companies with the same EBITDA can trade at different multiples because quality and future expectations matter. A company with faster growth, higher margins, recurring revenue, stronger market position, lower capital intensity, and lower risk should usually command a higher multiple. The market is not just paying for current EBITDA; it is paying for the durability and growth of future cash flows.',
  'What is accretion/dilution?':
    'Accretion/dilution measures whether an acquisition increases or decreases the buyer’s earnings per share after the deal. If pro forma EPS is higher than standalone EPS, the deal is accretive; if lower, it is dilutive. The result depends on purchase price, financing mix, target earnings, synergies, transaction costs, and the buyer’s current trading multiple.',
  'Tell me about yourself.':
    'I’m a student interested in finance because I like combining analytical work with real business decisions. I’ve tried to build that interest through coursework, finance club involvement, and internship experience where I worked with financial statements and company research. Those experiences made me more interested in investment banking because it sits at the center of transactions and gives junior people a steep learning curve. I’m now looking for a role where I can build strong technical skills, work on live deals, and contribute to a high-performing team.',
  'Walk me through your resume.':
    'My resume shows a progression toward investment banking. Academically, I focused on finance and accounting to build the technical foundation. Outside the classroom, I joined finance-related organizations where I worked on company research and presentations. Professionally, I pursued internships that gave me exposure to financial analysis, client service, and working under deadlines. Each step confirmed that I enjoy analytical, team-based work, which is why I’m pursuing banking.',
  'Tell me about a time you worked on a team.':
    'In a student investment project, my team had to pitch a company under a tight deadline. I owned the valuation work but also coordinated with teammates covering industry research and risks. When our assumptions were inconsistent, I set up a quick review, aligned the model with the thesis, and helped simplify the presentation. We delivered a clearer pitch and received strong feedback, and I learned how important communication is when analytical work depends on multiple people.',
  'Tell me about a time you failed.':
    'Early in a finance club project, I built a model that was technically complete but hard for others to follow. The team struggled to use it in the final presentation, and I realized I had focused too much on complexity instead of clarity. After that, I rebuilt the model with cleaner assumptions, better formatting, and a summary output. The experience taught me that good analysis has to be understandable, especially in a team setting.',
  'Tell me about a time you led a group.':
    'As a project lead for a student finance presentation, I managed a small team responsible for researching an industry and pitching a company. I divided workstreams, set interim deadlines, and made sure the valuation, market overview, and recommendation all supported one thesis. When we fell behind, I reprioritized the most important sections and helped teammates finish their pieces. We delivered on time and produced a more focused recommendation.',
  'Tell me about a time you handled conflict.':
    'During a group project, two teammates disagreed on whether our recommendation should be a buy or hold. I asked each person to lay out the evidence behind their view, then separated the debate into valuation, industry outlook, and company-specific risks. That made the disagreement less personal and more analytical. We ultimately chose a hold recommendation with clear upside and downside cases, and the final presentation was stronger because we addressed both perspectives.',
  'What is your greatest weakness?':
    'One weakness I’ve worked on is trying to make early analysis too detailed before confirming the main objective. In one project, that slowed me down because I spent time on less important model details. Since then, I’ve started clarifying the key question first, building a simple version, and then adding detail where it changes the decision. That has helped me work faster while still being thorough.',
  'What is an accomplishment you are proud of?':
    'I’m proud of earning a leadership role in a finance organization after starting with limited experience. I spent extra time learning accounting and valuation, volunteered for projects, and asked older members for feedback. Over time, I became someone the team trusted to handle analysis and mentor newer members. It mattered to me because it showed that consistent effort can compound quickly when I’m genuinely interested in the work.',
  'Tell me about a time you worked under pressure.':
    'In a class project, our team had to revise a presentation the night before it was due after realizing our recommendation was not well supported. I helped prioritize the most important fixes: cleaning the model, simplifying the thesis, and assigning final edits. I stayed focused on the pieces that would change the outcome rather than trying to perfect everything. We submitted on time and received strong feedback for the clarity of the final recommendation.',
  'Tell me about a time you received difficult feedback.':
    'In a finance club presentation, I was told my section was too technical and did not explain the business clearly enough. It was tough to hear because I had spent a lot of time on the analysis, but the feedback was right. I revised the section to start with the company’s business model, then used the numbers to support the thesis. Since then, I’ve tried to make my analysis more audience-focused.',
  'Why investment banking?':
    'I’m interested in investment banking because it combines financial analysis with high-impact strategic decisions. I like that bankers work on transactions where valuation, capital structure, industry dynamics, and client objectives all come together. My coursework and finance club experience have shown me that I enjoy company analysis and working under deadlines. Banking feels like the best place to build a rigorous technical foundation while contributing to real transaction work early in my career.',
  'Why this firm?':
    'I’m interested in this firm because of its strong transaction experience, the quality of its people, and the level of responsibility analysts can earn. From my conversations and research, the culture seems demanding but also apprenticeship-oriented, which is important to me as someone trying to build the right habits early. I’m also drawn to the firm’s work in sectors and deal types I’ve been following, so the platform feels like a strong fit for how I want to develop.',
  'Why this group?':
    'I’m interested in this group because the sector combines analytical complexity with real strategic change. I’ve enjoyed following companies in the space and learning how growth, margins, regulation, and capital intensity affect valuation. The group would let me build deeper industry knowledge while still working on core banking skills like modeling, valuation, and transaction execution. That mix is what makes it especially appealing to me.',
  'Why this office?':
    'I’m interested in this office because it offers exposure to strong deal flow while also fitting the market and client base I want to understand. I’ve spent time learning about the region’s business environment and think it would be a good place to build long-term relationships. From conversations with people in the office, I also got the sense that the team is lean enough for analysts to contribute meaningfully.',
  'Why are you interested in M&A?':
    'I’m interested in M&A because it requires understanding both the numbers and the strategic rationale behind a transaction. A good deal is not just about valuation; it also depends on synergies, competitive positioning, integration risk, and whether the buyer can create value after closing. I like that M&A forces you to think from the perspective of management teams and investors at the same time.',
  'Why are you interested in restructuring?':
    'I’m interested in restructuring because it combines finance, strategy, and negotiation in situations where the stakes are very high. You have to understand liquidity, capital structure, creditor priorities, and the operating issues that created stress in the first place. I find that analytical intensity appealing because small assumptions can have major implications for different stakeholders.',
  'Why should we hire you?':
    'You should hire me because I’ve shown that I can learn quickly, handle analytical work, and contribute in team settings. I’ve built a finance foundation through coursework and extracurricular work, and I’ve sought out experiences that required attention to detail and deadlines. I know banking has a steep learning curve, but I’m prepared for that environment and would bring strong work ethic, curiosity, and reliability to the team.',
  'What differentiates you from other candidates?':
    'What differentiates me is the combination of genuine finance interest and a track record of taking ownership. I have not just taken relevant classes; I’ve also pursued projects and leadership roles where I had to produce work others relied on. I’m comfortable asking for feedback, improving quickly, and staying accountable under pressure. That makes me confident I can ramp well in an analyst role.',
  'Where do you see yourself in five years?':
    'In five years, I hope to have built a strong foundation as a finance professional who can understand companies, advise clients, and lead parts of a transaction process. In the near term, my focus is on becoming an excellent analyst by developing modeling, valuation, and execution skills. Longer term, I want to keep earning more responsibility and become someone junior teammates and clients can trust.',
  'Why banking instead of consulting or corporate finance?':
    'I respect both consulting and corporate finance, but banking is the best fit for me because I want transaction exposure and a rigorous technical finance foundation. I like working with valuation, capital structure, and deal execution, and I want to see how companies make major strategic decisions under time pressure. Consulting is broader and corporate finance is more internal, while banking puts me closer to live market activity and M&A decision-making.',
  'Tell me about a recent deal you followed.':
    'One recent deal I followed was a strategic acquisition where the buyer was trying to expand its product offering and customer base. What stood out was that the rationale depended on both revenue synergies and cost efficiencies, not just paying a low multiple. I would evaluate the deal by looking at the premium paid, financing mix, synergy assumptions, and whether the buyer has a credible integration plan. The main risk is overestimating synergies or distracting management from the core business.',
  'What makes a deal strategically attractive?':
    'A strategically attractive deal should strengthen the buyer’s competitive position and create value beyond what either company could do alone. That could come from entering a new market, adding capabilities, increasing scale, or realizing cost and revenue synergies. The price still matters, though, because even a strong strategic fit can destroy value if the buyer overpays or integration risk is too high.',
  'How would higher interest rates affect M&A activity?':
    'Higher interest rates generally make M&A more difficult because debt financing becomes more expensive and buyers may be less willing to pay high valuations. Sponsors are especially affected because leveraged buyout returns depend heavily on financing costs. Strategic buyers may still pursue deals with strong rationale, but they will likely be more disciplined on price. Overall, I would expect lower volume, more scrutiny on cash flow, and wider valuation gaps between buyers and sellers.',
  'What industries are you currently following?':
    'I’ve been following software because it has interesting differences across growth, profitability, retention, and revenue quality. Investors are paying closer attention to durable cash flow instead of growth at any cost, especially with higher rates. I like the sector because business models can look similar at first, but valuation can vary widely based on net retention, margins, customer concentration, and market size.',
  'Pitch me a company.':
    'I would pitch a high-quality software company with recurring revenue, strong retention, and a clear path to margin expansion. The thesis would be that the business can grow efficiently because customers rely on the product, switching costs are high, and management is becoming more disciplined on costs. I would support the pitch with revenue growth, free cash flow conversion, competitive position, and valuation relative to peers. The key risks would be slower enterprise spending and multiple compression.',
  'What is one macro trend affecting investment banking?':
    'One major macro trend affecting banking is the path of interest rates. Higher rates pressure valuations, increase financing costs, and make sponsors more selective, which can reduce M&A and leveraged finance activity. At the same time, more rate stability can help reopen issuance markets because buyers and sellers gain confidence in pricing. For bankers, that means clients need more advice on timing, capital structure, and strategic alternatives.',
  'What makes a company an attractive acquisition target?':
    'An attractive acquisition target usually has a strong market position, durable growth, healthy margins, and cash flow that a buyer can underwrite. It may also offer strategic value such as new customers, technology, geography, or cost synergies. Clean financials and manageable integration risk matter too. Ultimately, a buyer wants confidence that the target can create value after accounting for the purchase price and execution risk.',
  'How would you think about synergies in a merger?':
    'I would separate synergies into cost synergies and revenue synergies. Cost synergies are usually more concrete, like reducing duplicate overhead, facilities, or vendor costs. Revenue synergies can be meaningful but are harder to underwrite because they depend on cross-selling and customer behavior. I would also consider timing, one-time integration costs, tax effects, and the risk that disruption offsets some of the expected benefits.',
  'What is happening in the IPO market?':
    'The IPO market has been sensitive to rates, volatility, and investor appetite for growth. When public market valuations are uncertain, companies may delay going public because pricing expectations are harder to meet. Stronger businesses with profitability or a clear path to cash flow can still access the market, but investors are more selective. I would watch rate stability, equity index performance, and the performance of recent IPOs as signs of reopening.',
  'What recent transaction stood out to you and why?':
    'A recent transaction that stood out to me was one where the buyer used M&A to accelerate a strategic shift rather than simply add scale. I thought it was interesting because the deal rationale depended on product expansion, customer overlap, and execution discipline. To evaluate it, I would look at the purchase multiple, synergy targets, financing plan, and whether management has a history of integrating acquisitions successfully.'
};

const allPracticeQuestions = Object.entries(questionBanks).flatMap(([categoryId, bank]) =>
  bank.questions.map((question) => ({
    ...question,
    categoryId,
    categoryTitle: bank.title,
    applicablePracticeTypes: question.applicablePracticeTypes || [categoryId],
    difficulty: question.difficulty || 'Core',
    difficultyLevel: question.difficultyLevel || 'beginner',
    topic: question.topic || 'core',
    groupType: question.groupType || 'general',
    concepts: bank.concepts,
    structureHint: bank.structureHint,
    followUps: bank.followUps
  }))
);

const productGroups = new Set(['M&A', 'Restructuring', 'LevFin', 'Financial Sponsors', 'ECM', 'DCM', 'Capital Markets', 'Strategic Advisory']);
const coverageGroups = new Set([
  'Technology',
  'Software',
  'Healthcare',
  'FIG',
  'Real Estate',
  'Industrials',
  'Energy',
  'Consumer & Retail',
  'Business Services',
  'Media & Telecom',
  'Aerospace & Defense',
  'Power & Utilities',
  'Infrastructure',
  'Natural Resources',
  'Generalist'
]);
const recentQuestionStorageKey = 'bankerBuilderInterviewPrepRecentQuestions';
const maxRecentQuestions = 28;

const technicalSupplementalQuestions = [
  { prompt: 'How would you think about synergies in an acquisition?', allowedGroups: ['M&A', 'Strategic Advisory'], groupType: 'product', difficultyLevel: 'beginner', topic: 'synergies' },
  { prompt: 'What are precedent transactions and when would you use them?', allowedGroups: ['M&A', 'Strategic Advisory'], groupType: 'product', difficultyLevel: 'beginner', topic: 'transaction comps' },
  { prompt: 'At a high level, what are the main pieces of a merger model?', allowedGroups: ['M&A'], groupType: 'product', difficultyLevel: 'intermediate', topic: 'merger model' },
  { prompt: 'What is purchase accounting in an M&A context?', allowedGroups: ['M&A'], groupType: 'product', difficultyLevel: 'intermediate', topic: 'purchase accounting' },
  { prompt: 'What matters most when analyzing a company’s capital structure?', allowedGroups: ['Restructuring'], groupType: 'product', difficultyLevel: 'beginner', topic: 'capital structure' },
  { prompt: 'How would you think about debt priority in a restructuring?', allowedGroups: ['Restructuring'], groupType: 'product', difficultyLevel: 'beginner', topic: 'debt priority' },
  { prompt: 'What liquidity metrics would you look at for a distressed company?', allowedGroups: ['Restructuring'], groupType: 'product', difficultyLevel: 'intermediate', topic: 'liquidity' },
  { prompt: 'What is a recovery waterfall?', allowedGroups: ['Restructuring'], groupType: 'product', difficultyLevel: 'intermediate', topic: 'recovery waterfall' },
  { prompt: 'How would you estimate debt capacity for an acquisition financing?', allowedGroups: ['LevFin'], groupType: 'product', difficultyLevel: 'beginner', topic: 'debt capacity' },
  { prompt: 'What leverage and coverage ratios matter most in LevFin?', allowedGroups: ['LevFin'], groupType: 'product', difficultyLevel: 'beginner', topic: 'credit metrics' },
  { prompt: 'What makes refinancing risk higher for a leveraged borrower?', allowedGroups: ['LevFin'], groupType: 'product', difficultyLevel: 'intermediate', topic: 'refinancing risk' },
  { prompt: 'Walk me through the basic drivers of LBO returns.', allowedGroups: ['Financial Sponsors'], groupType: 'product', difficultyLevel: 'beginner', topic: 'lbo returns' },
  { prompt: 'What exit options does a private equity sponsor usually consider?', allowedGroups: ['Financial Sponsors'], groupType: 'product', difficultyLevel: 'beginner', topic: 'sponsor exits' },
  { prompt: 'Why does leverage matter so much in a sponsor-backed transaction?', allowedGroups: ['Financial Sponsors'], groupType: 'product', difficultyLevel: 'beginner', topic: 'leverage' },
  { prompt: 'What makes an IPO window attractive?', allowedGroups: ['ECM', 'Capital Markets'], groupType: 'product', difficultyLevel: 'beginner', topic: 'ipo market' },
  { prompt: 'How does an equity offering dilute existing shareholders?', allowedGroups: ['ECM', 'Capital Markets'], groupType: 'product', difficultyLevel: 'beginner', topic: 'dilution' },
  { prompt: 'What is a follow-on equity offering?', allowedGroups: ['ECM'], groupType: 'product', difficultyLevel: 'beginner', topic: 'follow-ons' },
  { prompt: 'What is a convertible bond and why might a company issue one?', allowedGroups: ['ECM', 'Capital Markets'], groupType: 'product', difficultyLevel: 'intermediate', topic: 'convertibles' },
  { prompt: 'What factors affect credit spreads?', allowedGroups: ['DCM', 'Capital Markets'], groupType: 'product', difficultyLevel: 'beginner', topic: 'credit spreads' },
  { prompt: 'How do ratings affect bond issuance?', allowedGroups: ['DCM'], groupType: 'product', difficultyLevel: 'beginner', topic: 'ratings' },
  { prompt: 'Why might a company refinance debt before maturity?', allowedGroups: ['DCM', 'Capital Markets'], groupType: 'product', difficultyLevel: 'beginner', topic: 'refinancing' },
  { prompt: 'What does investor demand mean in a capital markets transaction?', allowedGroups: ['Capital Markets', 'ECM', 'DCM'], groupType: 'product', difficultyLevel: 'beginner', topic: 'investor demand' },
  { prompt: 'How would you evaluate a company’s capital allocation choices?', allowedGroups: ['Strategic Advisory'], groupType: 'product', difficultyLevel: 'beginner', topic: 'capital allocation' },
  { prompt: 'What are strategic alternatives?', allowedGroups: ['Strategic Advisory'], groupType: 'product', difficultyLevel: 'beginner', topic: 'strategic alternatives' },
  { prompt: 'What is shareholder activism at a basic level?', allowedGroups: ['Strategic Advisory'], groupType: 'product', difficultyLevel: 'intermediate', topic: 'activism' },
  { prompt: 'What SaaS metrics would you focus on when evaluating a software company?', allowedGroups: ['Technology', 'Software', 'FinTech'], groupType: 'coverage', difficultyLevel: 'beginner', topic: 'saas metrics' },
  { prompt: 'How would you think about growth versus profitability for a software company?', allowedGroups: ['Technology', 'Software'], groupType: 'coverage', difficultyLevel: 'beginner', topic: 'software valuation' },
  { prompt: 'What healthcare-specific risks can affect valuation?', allowedGroups: ['Healthcare'], groupType: 'coverage', difficultyLevel: 'beginner', topic: 'healthcare risks' },
  { prompt: 'How are biotech and healthcare services companies different from a banking perspective?', allowedGroups: ['Healthcare'], groupType: 'coverage', difficultyLevel: 'intermediate', topic: 'healthcare subsectors' },
  { prompt: 'Why are banks often valued using book value or tangible book value?', allowedGroups: ['FIG'], groupType: 'coverage', difficultyLevel: 'beginner', topic: 'bank valuation' },
  { prompt: 'What is net interest margin?', allowedGroups: ['FIG'], groupType: 'coverage', difficultyLevel: 'beginner', topic: 'nim' },
  { prompt: 'What is a cap rate?', allowedGroups: ['Real Estate'], groupType: 'coverage', difficultyLevel: 'beginner', topic: 'cap rates' },
  { prompt: 'What are NOI and FFO?', allowedGroups: ['Real Estate'], groupType: 'coverage', difficultyLevel: 'beginner', topic: 'real estate metrics' },
  { prompt: 'How do commodity prices affect energy company valuation?', allowedGroups: ['Energy', 'Natural Resources'], groupType: 'coverage', difficultyLevel: 'beginner', topic: 'commodity prices' },
  { prompt: 'What is the difference between upstream and midstream energy companies?', allowedGroups: ['Energy'], groupType: 'coverage', difficultyLevel: 'intermediate', topic: 'energy subsectors' },
  { prompt: 'What operating metrics matter for a consumer or retail company?', allowedGroups: ['Consumer & Retail'], groupType: 'coverage', difficultyLevel: 'beginner', topic: 'retail metrics' },
  { prompt: 'Why are industrials companies often cyclical?', allowedGroups: ['Industrials'], groupType: 'coverage', difficultyLevel: 'beginner', topic: 'cyclicality' }
];

const behavioralQuestionMix = [
  { prompt: 'Tell me about a time you led a team.', tailoringLevel: 'generic', questionCategory: 'lead-team' },
  { prompt: 'Tell me about a time you faced conflict.', tailoringLevel: 'generic', questionCategory: 'conflict' },
  { prompt: 'Tell me about a time you worked under pressure.', tailoringLevel: 'generic', questionCategory: 'pressure' },
  { prompt: 'Tell me about a time you failed.', tailoringLevel: 'generic', questionCategory: 'failure' },
  { prompt: 'Tell me about a time you balanced competing priorities.', tailoringLevel: 'generic', questionCategory: 'priorities' },
  { prompt: 'Tell me about a time you received difficult feedback.', tailoringLevel: 'generic', questionCategory: 'feedback' },
  { prompt: 'Tell me about a time you had to learn something quickly.', tailoringLevel: 'generic', questionCategory: 'learning-quickly' },
  { prompt: 'Tell me about a time you had to manage competing priorities during an internship, class project, or leadership role.', tailoringLevel: 'light', sourceType: 'ai_slot', questionCategory: 'priorities' },
  { prompt: 'Tell me about a time you had to persuade a team to take your recommendation seriously.', tailoringLevel: 'light', sourceType: 'ai_slot', questionCategory: 'persuasion' },
  { prompt: 'Tell me about an experience where you had to be detail-oriented under a deadline.', tailoringLevel: 'light', sourceType: 'ai_slot', questionCategory: 'detail-oriented' }
];

const marketQuestionMix = [
  { prompt: 'What is a recent deal you have been following?', difficultyLevel: 'beginner', tailoringLevel: 'generic', questionCategory: 'recent-deal' },
  { prompt: 'What is one market trend you are paying attention to?', difficultyLevel: 'beginner', tailoringLevel: 'generic', questionCategory: 'market-trend' },
  { prompt: 'How do higher interest rates affect M&A activity?', difficultyLevel: 'beginner', tailoringLevel: 'generic', allowedGroups: ['M&A', 'Strategic Advisory'], questionCategory: 'rates-ma' },
  { prompt: 'How do higher interest rates affect valuation?', difficultyLevel: 'beginner', tailoringLevel: 'generic', questionCategory: 'rates-valuation' },
  { prompt: 'What is happening in the IPO market?', difficultyLevel: 'beginner', tailoringLevel: 'generic', allowedGroups: ['ECM', 'Capital Markets'], questionCategory: 'ipo-market' },
  { prompt: 'What sector has been active recently and why?', difficultyLevel: 'beginner', tailoringLevel: 'generic', questionCategory: 'active-sector' },
  { prompt: 'What does the current rate environment mean for companies raising capital?', difficultyLevel: 'beginner', tailoringLevel: 'generic', allowedGroups: ['DCM', 'ECM', 'Capital Markets', 'LevFin'], questionCategory: 'rates-capital-raising' },
  { prompt: 'How do higher rates affect debt issuance?', difficultyLevel: 'beginner', tailoringLevel: 'group', allowedGroups: ['DCM'], questionCategory: 'rates-debt-issuance' },
  { prompt: 'Why might higher rates increase restructuring activity?', difficultyLevel: 'beginner', tailoringLevel: 'group', allowedGroups: ['Restructuring'], questionCategory: 'rates-rx' },
  { prompt: 'What is one technology deal or trend you have been following?', difficultyLevel: 'beginner', tailoringLevel: 'group', allowedGroups: ['Technology', 'Software', 'FinTech'], questionCategory: 'tech-trend' },
  { prompt: 'What trend matters most for private equity sponsors right now?', difficultyLevel: 'intermediate', tailoringLevel: 'group', allowedGroups: ['Financial Sponsors'], questionCategory: 'sponsor-trend' },
  { prompt: 'How would a tougher financing market affect sponsor exits?', difficultyLevel: 'advanced', tailoringLevel: 'advanced', allowedGroups: ['Financial Sponsors', 'LevFin'], questionCategory: 'sponsor-exits-market' }
];

const allSpecializedGroups = [...productGroups, ...coverageGroups].filter((group) => group !== 'Generalist');
const technicalMinimumRelevance = 5;

function groupsExcept(allowedGroups = []) {
  const allowed = new Set([...allowedGroups, 'Generalist']);
  return allSpecializedGroups.filter((group) => !allowed.has(group));
}

function technicalMetadataForPrompt(question) {
  const prompt = question.prompt || '';
  const existingPrimary = question.primaryGroups || question.allowedGroups || question.groupTags || question.targetGroups || [];
  const base = {
    primaryGroups: existingPrimary,
    secondaryGroups: question.secondaryGroups || [],
    blockedGroups: question.blockedGroups || [],
    isUniversalCore: Boolean(question.isUniversalCore),
    groupType: question.groupType || 'universal',
    difficultyLevel: question.difficultyLevel || 'beginner',
    topic: question.topic || 'core',
    questionCategory: question.questionCategory || question.topic || prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64)
  };

  const assign = (metadata) => ({
    ...base,
    ...metadata,
    blockedGroups: metadata.blockedGroups || (metadata.primaryGroups?.length ? groupsExcept([...(metadata.primaryGroups || []), ...(metadata.secondaryGroups || [])]) : base.blockedGroups)
  });

  if (/three financial statements|depreciation|enterprise value|WACC|DCF|valuation methodologies|free cash flow|same EBITDA/i.test(prompt)) {
    return assign({ primaryGroups: [], secondaryGroups: [], blockedGroups: [], isUniversalCore: true, groupType: 'universal', topic: 'core valuation', questionCategory: prompt.includes('DCF') ? 'dcf' : base.questionCategory });
  }
  if (/company issues debt/i.test(prompt)) {
    return assign({ primaryGroups: [], secondaryGroups: ['DCM', 'LevFin', 'Capital Markets'], blockedGroups: [], isUniversalCore: true, groupType: 'universal', topic: 'debt mechanics', questionCategory: 'debt-issuance-mechanics' });
  }
  if (/accretion|dilution|M&A transaction|acquisition creates value|synergies|merger model|purchase accounting|precedent transactions|transaction comps/i.test(prompt)) {
    return assign({ primaryGroups: ['M&A'], secondaryGroups: ['Strategic Advisory'], groupType: 'product', topic: question.topic || 'm&a', questionCategory: /accretion|dilution/i.test(prompt) ? 'accretion-dilution' : base.questionCategory });
  }
  if (/recovery|restructuring|distressed|liquidity|debt priority|capital structure/i.test(prompt)) {
    return assign({ primaryGroups: ['Restructuring'], secondaryGroups: [], groupType: 'product', topic: question.topic || 'restructuring', questionCategory: /recovery/i.test(prompt) ? 'recovery-waterfall' : base.questionCategory });
  }
  if (/LBO|private equity sponsor|sponsor-backed|sponsor exits/i.test(prompt)) {
    return assign({ primaryGroups: ['Financial Sponsors'], secondaryGroups: ['LevFin'], groupType: 'product', topic: question.topic || 'financial sponsors', questionCategory: /LBO|returns/i.test(prompt) ? 'lbo-basics' : base.questionCategory });
  }
  if (/debt capacity|leveraged buyout|leverage|coverage ratios|acquisition financing|refinancing risk|leveraged borrower/i.test(prompt)) {
    return assign({ primaryGroups: question.primaryGroups || ['LevFin'], secondaryGroups: question.secondaryGroups || ['Financial Sponsors'], groupType: 'product', topic: question.topic || 'leveraged finance', questionCategory: /debt capacity/i.test(prompt) ? 'debt-capacity' : base.questionCategory });
  }
  if (/IPO|follow-on|equity offering|convertible/i.test(prompt)) {
    return assign({ primaryGroups: ['ECM'], secondaryGroups: ['Capital Markets'], groupType: 'product', topic: question.topic || 'ecm', questionCategory: /IPO/i.test(prompt) ? 'ipo-market' : base.questionCategory });
  }
  if (/credit spreads|ratings|bond issuance|refinance debt|rates.*bond|yield/i.test(prompt)) {
    return assign({ primaryGroups: ['DCM'], secondaryGroups: ['Capital Markets'], groupType: 'product', topic: question.topic || 'dcm', questionCategory: /credit spreads/i.test(prompt) ? 'credit-spreads' : base.questionCategory });
  }
  if (/debt or equity|investor demand|capital markets transaction/i.test(prompt)) {
    return assign({ primaryGroups: ['Capital Markets'], secondaryGroups: ['DCM', 'ECM'], groupType: 'product', topic: question.topic || 'capital markets', questionCategory: 'capital-markets-issuance' });
  }
  if (/capital allocation|strategic alternatives|shareholder activism/i.test(prompt)) {
    return assign({ primaryGroups: ['Strategic Advisory'], secondaryGroups: ['M&A'], groupType: 'product', topic: question.topic || 'strategic advisory' });
  }
  if (/SaaS|software|ARR|retention|growth versus profitability/i.test(prompt)) {
    return assign({ primaryGroups: ['Technology', 'Software'], secondaryGroups: ['FinTech'], groupType: 'coverage', topic: question.topic || 'software' });
  }
  if (/healthcare|biotech|reimbursement|FDA|payor|provider/i.test(prompt)) {
    return assign({ primaryGroups: ['Healthcare'], secondaryGroups: [], groupType: 'coverage', topic: question.topic || 'healthcare' });
  }
  if (/banks|financial institutions|book value|net interest margin|regulatory capital/i.test(prompt)) {
    return assign({ primaryGroups: ['FIG'], secondaryGroups: [], groupType: 'coverage', topic: question.topic || 'fig' });
  }
  if (/real estate|cap rate|NOI|FFO|NAV|REIT/i.test(prompt)) {
    return assign({ primaryGroups: ['Real Estate'], secondaryGroups: [], groupType: 'coverage', topic: question.topic || 'real estate' });
  }
  if (/commodity|energy|upstream|midstream|reserve|power|utilities/i.test(prompt)) {
    return assign({ primaryGroups: ['Energy'], secondaryGroups: ['Natural Resources', 'Power & Utilities', 'Infrastructure'], groupType: 'coverage', topic: question.topic || 'energy' });
  }
  if (/consumer|retail|same-store|brand/i.test(prompt)) {
    return assign({ primaryGroups: ['Consumer & Retail'], secondaryGroups: [], groupType: 'coverage', topic: question.topic || 'consumer retail' });
  }
  if (/industrials|cyclical|supply chain|capex|end-market/i.test(prompt)) {
    return assign({ primaryGroups: ['Industrials'], secondaryGroups: [], groupType: 'coverage', topic: question.topic || 'industrials' });
  }
  return assign(base);
}

function getQuestionsForCategory(categoryId) {
  if (categoryId === 'mixed') {
    return allPracticeQuestions;
  }

  const bank = questionBanks[categoryId];
  return bank.questions.map((question) => ({
    ...question,
    categoryId,
    categoryTitle: bank.title,
    applicablePracticeTypes: question.applicablePracticeTypes || [categoryId],
    difficulty: question.difficulty || 'Core',
    concepts: bank.concepts,
    structureHint: bank.structureHint,
    followUps: bank.followUps
  }));
}

function makeQueueQuestion(question, categoryId) {
  const category = questionBanks[categoryId] || questionBanks[question.categoryId] || {};
  const normalized = {
    ...question,
    categoryId: question.categoryId || categoryId,
    categoryTitle: question.categoryTitle || category.title || 'Interview Prep',
    applicablePracticeTypes: question.applicablePracticeTypes || [categoryId],
    difficulty: question.difficulty || 'Core',
    difficultyLevel: question.difficultyLevel || 'beginner',
    topic: question.topic || 'core',
    groupType: question.groupType || 'general',
    questionCategory: question.questionCategory || question.topic || question.prompt?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64),
    concepts: question.concepts || category.concepts || ['banking'],
    structureHint: question.structureHint || category.structureHint || 'Answer directly, then support your answer with one or two concrete points.',
    followUps: question.followUps || category.followUps || ['Can you make that answer more specific?']
  };
  return normalized.categoryId === 'technical' ? { ...normalized, ...technicalMetadataForPrompt(normalized) } : normalized;
}

function isGeneralPrepProfile(prepProfile) {
  return (
    !prepProfile ||
    (prepProfile.targetGroups || []).includes('Generalist') ||
    !(prepProfile.targetGroups || []).length
  );
}

function getQuestionGroupTags(question) {
  return question.primaryGroups || question.allowedGroups || question.groupTags || question.targetGroups || [];
}

function getQuestionExperienceTags(question) {
  return question.experienceTags || question.workExperienceBackgrounds || [];
}

function getExpandedTargetGroups(prepProfile) {
  const selectedGroups = new Set(prepProfile?.targetGroups || []);
  if (selectedGroups.has('Capital Markets')) {
    selectedGroups.add('ECM');
    selectedGroups.add('DCM');
  }
  if (selectedGroups.has('Technology')) {
    selectedGroups.add('Software');
    selectedGroups.add('FinTech');
  }
  if (selectedGroups.has('Software') || selectedGroups.has('FinTech')) selectedGroups.add('Technology');
  if (selectedGroups.has('Energy')) {
    selectedGroups.add('Natural Resources');
    selectedGroups.add('Power & Utilities');
  }
  if (selectedGroups.has('Natural Resources') || selectedGroups.has('Power & Utilities')) selectedGroups.add('Energy');
  return selectedGroups;
}

function hasOverlap(values, selectedValues) {
  return values.some((value) => selectedValues.has(value));
}

function questionMatchesExperience(question, prepProfile) {
  if (question.noRelevantExperienceOnly) return prepProfile?.practiceMode === 'generic';
  const experienceTags = getQuestionExperienceTags(question);
  return !experienceTags.length;
}

function questionMatchesLeadership(question, prepProfile) {
  const leadershipTags = question.leadershipTags || [];
  return !leadershipTags.length;
}

function questionMatchesSelectedGroups(question, prepProfile) {
  const groupTags = getQuestionGroupTags(question);
  if (!groupTags.length || isGeneralPrepProfile(prepProfile)) return true;
  return hasOverlap(groupTags, getExpandedTargetGroups(prepProfile));
}

function questionIsBlocked(question, prepProfile) {
  const blockedGroups = question.blockedGroups || [];
  return blockedGroups.length ? hasOverlap(blockedGroups, getExpandedTargetGroups(prepProfile)) : false;
}

function getCandidateLevel(prepProfile) {
  return ['Summer Analyst', 'Undergrad Full-Time'].includes(prepProfile?.recruitingGoal) ? 'undergrad' : 'experienced';
}

function isAdvancedQuestionAllowed(question, prepProfile) {
  return question.difficultyLevel !== 'advanced' || getCandidateLevel(prepProfile) !== 'undergrad';
}

function getPrimaryProfileGroup(prepProfile) {
  const selectedGroups = prepProfile?.targetGroups || [];
  return selectedGroups.find((group) => group !== 'Generalist') || 'Generalist';
}

function getResumeExperiences(prepProfile) {
  const context = prepProfile?.resumeContext || (prepProfile?.resumeText ? buildResumeContext(prepProfile.resumeText) : null);
  return [
    ...(context?.workExperience || []),
    ...(context?.leadership || [])
  ].filter((item) => item.organization);
}

function getResumeExperienceText(experience) {
  return `${experience.organization || ''} ${experience.title || ''} ${experience.dates || ''} ${experience.bullets?.join(' ') || ''}`.toLowerCase();
}

function getResumeExperienceSubtype(experience) {
  const text = getResumeExperienceText(experience);
  if (/\b(investment banking|m&a|merger|acquisition|valuation|capital markets|private equity|transaction|deal|financial model|dcf|comps|leveraged finance|restructuring|equity research|asset management)\b/i.test(text)) {
    return 'finance';
  }
  if (/\b(accounting|audit|tax|advisory|assurance|valuation|consulting|due diligence|transaction services|business valuation)\b/i.test(text)) {
    return 'accounting-advisory';
  }
  if (/\b(intern|analyst|associate|consultant|professional|corporate|bank|credit|risk|treasury|finance)\b/i.test(text)) {
    return 'professional';
  }
  if (/\b(client|customer|service|operations|support|assistant|campus job|student worker|desk|link|ambassador)\b/i.test(text)) {
    return 'client-operations';
  }
  if (/\b(president|founder|chair|director|captain|treasurer|executive board|vp|vice president)\b/i.test(text)) {
    return 'leadership';
  }
  if (/\b(scholars|honors|fellowship|program|cohort)\b/i.test(text)) {
    return 'scholars-program';
  }
  if (/\b(fraternity|sorority|club|association|society|student|volunteer|member|campus)\b/i.test(text)) {
    return 'extracurricular';
  }
  return experience.type === 'work' ? 'professional' : 'supporting';
}

function scoreResumeExperience(experience, prepProfile) {
  const text = getResumeExperienceText(experience);
  const selectedGroups = (prepProfile?.targetGroups || []).map((group) => group.toLowerCase());
  let score = 0;
  if (experience.type === 'work') score += 2;
  if (experience.type === 'leadership') score += 1.5;
  if (/\b(investment banking|m&a|merger|acquisition|valuation|capital markets|private equity|transaction|deal|financial model|dcf|comps)\b/i.test(text)) score += 5;
  if (/\b(accounting|audit|advisory|consulting|finance|financial|bank|credit|risk|client|operations|analyst|intern)\b/i.test(text)) score += 3;
  if (/\b(president|founder|captain|chair|director|vp|treasurer|managed|led|leadership)\b/i.test(text)) score += 3;
  if (/\b(scholars|honors|program|campus|student|assistant|link|ambassador|member)\b/i.test(text)) score += 1;
  if (selectedGroups.some((group) => group !== 'generalist' && text.includes(group))) score += 2;
  return score;
}

function tierResumeExperience(experience, prepProfile) {
  const score = scoreResumeExperience(experience, prepProfile);
  const subtype = getResumeExperienceSubtype(experience);
  if (score >= 7 || subtype === 'finance' || (subtype === 'leadership' && score >= 5.5)) return 1;
  if (score >= 4 || ['accounting-advisory', 'professional', 'client-operations', 'leadership'].includes(subtype)) return 2;
  return 3;
}

const resumeExperienceTierTargets = {
  1: 0.55,
  2: 0.3,
  3: 0.15
};

const resumeExperienceTierBaseWeights = {
  1: 6,
  2: 4.2,
  3: 2.6
};

function countUsedResumeExperiences(usedExperienceIds = []) {
  return usedExperienceIds.reduce((counts, id) => ({
    ...counts,
    [id]: (counts[id] || 0) + 1
  }), {});
}

function getWeightedResumeExperience(experiences) {
  const totalWeight = experiences.reduce((sum, experience) => sum + Math.max(experience.selectionWeight || 0, 0), 0);
  if (!totalWeight) return experiences[0] || null;
  let cursor = Math.random() * totalWeight;
  for (const experience of experiences) {
    cursor -= Math.max(experience.selectionWeight || 0, 0);
    if (cursor <= 0) return experience;
  }
  return experiences.at(-1) || null;
}

function getCoverageForcedResumePool(enriched, usedExperienceIds = []) {
  const usedCountsById = countUsedResumeExperiences(usedExperienceIds);
  const usedItems = usedExperienceIds
    .map((id) => enriched.find((experience) => experience.id === id))
    .filter(Boolean);
  const usedTiers = new Set(usedItems.map((experience) => experience.tier));
  const unused = enriched.filter((experience) => !usedCountsById[experience.id]);
  const unusedSecondary = unused.filter((experience) => experience.tier >= 2);
  const unusedTier2 = unused.filter((experience) => experience.tier === 2);
  const unusedTier3 = unused.filter((experience) => experience.tier === 3);
  const turnNumber = usedExperienceIds.length + 1;

  if (turnNumber >= 3 && !usedTiers.has(2) && unusedTier2.length) return unusedTier2;
  if (turnNumber >= 4 && !usedTiers.has(3) && unusedTier3.length) return unusedTier3;
  if (turnNumber % 3 === 0 && unusedSecondary.length) return unusedSecondary;
  if (turnNumber % 5 === 0 && unusedTier3.length) return unusedTier3;

  const recentOrganizations = usedItems.slice(-2).map((experience) => experience.organization).filter(Boolean);
  if (recentOrganizations.length === 2 && recentOrganizations[0] === recentOrganizations[1]) {
    const differentOrganization = unused.filter((experience) => experience.organization !== recentOrganizations[0]);
    if (differentOrganization.length) return differentOrganization;
  }

  return null;
}

function chooseResumeExperience(prepProfile, usedExperienceIds = []) {
  const experiences = getResumeExperiences(prepProfile);
  if (!experiences.length) return null;
  const usedCountsById = countUsedResumeExperiences(usedExperienceIds);
  const enriched = experiences.map((experience) => ({
    ...experience,
    subtype: getResumeExperienceSubtype(experience),
    tier: tierResumeExperience(experience, prepProfile),
    relevanceScore: scoreResumeExperience(experience, prepProfile)
  }));
  const usedTypes = usedExperienceIds
    .map((id) => enriched.find((experience) => experience.id === id)?.type)
    .filter(Boolean);
  const usedSubtypes = usedExperienceIds
    .map((id) => enriched.find((experience) => experience.id === id)?.subtype)
    .filter(Boolean);
  const usedTiers = usedExperienceIds
    .map((id) => enriched.find((experience) => experience.id === id)?.tier)
    .filter(Boolean);
  const usedOrganizations = usedExperienceIds
    .map((id) => enriched.find((experience) => experience.id === id)?.organization)
    .filter(Boolean);
  const usedOrganizationCounts = usedOrganizations.reduce((counts, organization) => ({
    ...counts,
    [organization]: (counts[organization] || 0) + 1
  }), {});
  const tierCounts = [1, 2, 3].reduce((counts, tier) => ({
    ...counts,
    [tier]: usedTiers.filter((usedTier) => usedTier === tier).length
  }), {});
  const preferredType = usedTypes.at(-1) === 'work' ? 'leadership' : 'work';
  const totalUsed = usedTiers.length || 1;
  const availableTiers = [1, 2, 3].filter((tier) => enriched.some((experience) => experience.tier === tier));
  const tierNeed = availableTiers.reduce((needs, tier) => ({
    ...needs,
    [tier]: resumeExperienceTierTargets[tier] - ((tierCounts[tier] || 0) / totalUsed)
  }), {});
  const underusedTier = availableTiers
    .filter((tier) => tierNeed[tier] > 0)
    .sort((a, b) => tierNeed[b] - tierNeed[a])[0];

  const forcedCoveragePool = getCoverageForcedResumePool(enriched, usedExperienceIds);
  const candidates = enriched.map((experience) => {
    const priorUses = usedCountsById[experience.id] || 0;
    const organizationUses = usedOrganizationCounts[experience.organization] || 0;
    const isUnused = priorUses === 0;
    const tierGapBoost = underusedTier && experience.tier === underusedTier ? 1.75 : 1;
    const typeRotationBoost = experience.type === preferredType ? 1.25 : 1;
    const subtypeRotationBoost = usedSubtypes.at(-1) && experience.subtype !== usedSubtypes.at(-1) ? 1.15 : 1;
    const unusedBoost = isUnused ? 3.4 : 0.4 / (priorUses + 1);
    const organizationPenalty = organizationUses ? 1 / ((organizationUses + 1.4) * (organizationUses + 1)) : 1;
    const relevanceBoost = 1 + Math.min(experience.relevanceScore, 8) / 18;
    return {
      ...experience,
      selectionWeight:
        resumeExperienceTierBaseWeights[experience.tier] *
        tierGapBoost *
        typeRotationBoost *
        subtypeRotationBoost *
        unusedBoost *
        organizationPenalty *
        relevanceBoost
    };
  });

  const forcedIds = new Set((forcedCoveragePool || []).map((experience) => experience.id));
  const forcedCandidates = forcedIds.size ? candidates.filter((experience) => forcedIds.has(experience.id)) : [];
  if (forcedCandidates.length) {
    return getWeightedResumeExperience(forcedCandidates.sort((a, b) => b.selectionWeight - a.selectionWeight));
  }

  const unusedCandidates = candidates.filter((experience) => !usedCountsById[experience.id]);
  const pool = unusedCandidates.length ? unusedCandidates : candidates;
  return getWeightedResumeExperience(pool.sort((a, b) => b.selectionWeight - a.selectionWeight));
}

function experienceLabel(experience) {
  if (!experience) return '';
  return [experience.organization, experience.title].filter(Boolean).join(' - ');
}

function createGeneratedQuestion(categoryId, prepProfile) {
  const primaryGroup = getPrimaryProfileGroup(prepProfile);
  const isResumeAware = prepProfile?.practiceMode === 'resume-aware' && Boolean(prepProfile?.resumeText);
  const categoryTitle = categoryId === 'mixed' ? 'Mixed Mock Interview' : questionBanks[categoryId]?.title || 'Interview Prep';
  const sharedFields = {
    categoryId,
    categoryTitle,
    applicablePracticeTypes: [categoryId],
    difficulty: 'Profile-specific',
    generatedFromProfile: true,
    broadApplicability: false,
    concepts: questionBanks[categoryId]?.concepts || ['banking', 'fit', 'technical'],
    structureHint: questionBanks[categoryId]?.structureHint || 'Answer directly, then support your answer with specific evidence from your background.',
    followUps: questionBanks[categoryId]?.followUps || ['Can you make that answer more specific to your profile?'],
    groupTags: primaryGroup === 'Generalist' ? [] : [primaryGroup],
    keywords: [primaryGroup.toLowerCase(), 'banking', 'profile']
  };

  const generatedPrompts = {
    technical: {
      'Financial Sponsors': 'How would you evaluate debt capacity for a sponsor-backed LBO?',
      DCM: 'How would rates and credit spreads affect a company deciding whether to issue bonds?',
      LevFin: 'What leverage and coverage metrics would you focus on for an acquisition financing?',
      Restructuring: 'How would you evaluate liquidity and creditor recovery in a distressed situation?',
      'M&A': 'How would you evaluate whether an acquisition creates value for the buyer?',
      ECM: 'What factors would determine whether an IPO is attractive for a company right now?',
      Technology: 'What operating metrics would you focus on when valuing a software company?',
      Software: 'What SaaS metrics would you focus on when evaluating a software company?',
      Energy: 'How would commodity prices affect cash flow and valuation for an energy company?'
    },
    fit: {
      default: primaryGroup === 'Generalist' ? 'Why investment banking?' : `Why are you interested in ${primaryGroup} banking?`
    },
    markets: {
      'Financial Sponsors': 'What market trend matters most for private equity sponsors right now?',
      DCM: 'What debt market trend would matter most for a DCM banker right now?',
      LevFin: 'What trend in leveraged finance would affect sponsor deal activity?',
      Restructuring: 'What distressed credit signal are you watching right now?',
      'M&A': 'What recent M&A trend is most relevant to the groups you are targeting?',
      ECM: 'What market condition would make the IPO window more attractive?',
      Technology: 'What technology or AI trend could influence M&A or IPO activity?',
      Software: 'What software market trend could influence valuation and deal activity?',
      Energy: 'How are energy transition and commodity prices affecting deal activity?'
    },
    behavioral: {
      default: isResumeAware
        ? 'Walk me through one experience from your resume that best prepared you for investment banking.'
        : 'Tell me about a time you worked on a team.'
    },
    mixed: {
      default: isResumeAware
        ? `Why are you targeting ${primaryGroup}, and what evidence from your resume supports that choice?`
        : `Why are you targeting ${primaryGroup === 'Generalist' ? 'investment banking' : primaryGroup}, and how have you prepared?`
    }
  };

  const prompt = generatedPrompts[categoryId]?.[primaryGroup] || generatedPrompts[categoryId]?.default || generatedPrompts.mixed.default;
  return {
    ...sharedFields,
    prompt,
    sourceType: 'ai_generated'
  };
}

function readRecentQuestions() {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(recentQuestionStorageKey);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rememberRecentQuestion(question) {
  if (typeof window === 'undefined' || !question?.prompt) return;
  const recent = readRecentQuestions().filter((prompt) => prompt !== question.prompt);
  window.localStorage.setItem(recentQuestionStorageKey, JSON.stringify([question.prompt, ...recent].slice(0, maxRecentQuestions)));
}

function shuffleQuestions(questions) {
  return [...questions]
    .map((question) => ({ question, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ question }) => question);
}

function uniqueQuestions(questions) {
  const seen = new Set();
  return questions.filter((question) => {
    if (!question?.prompt || seen.has(question.prompt)) return false;
    seen.add(question.prompt);
    return true;
  });
}

function uniqueQuestionCategories(questions) {
  const seen = new Set();
  return questions.filter((question) => {
    const category = question.questionCategory || question.prompt;
    if (seen.has(category)) return false;
    seen.add(category);
    return true;
  });
}

function avoidRecentQuestions(questions, categoryId) {
  if (categoryId !== 'technical' && categoryId !== 'mixed') return questions;
  const recent = new Set(readRecentQuestions());
  const fresh = questions.filter((question) => !recent.has(question.prompt));
  return fresh.length >= Math.min(4, questions.length) ? fresh : questions;
}

function scoreTechnicalQuestionRelevance(question, prepProfile) {
  const selected = getExpandedTargetGroups(prepProfile);
  if (question.blockedGroups?.some((group) => selected.has(group))) return -100;
  if (isGeneralPrepProfile(prepProfile)) {
    if (question.isUniversalCore) return 8;
    if (question.primaryGroups?.length) return 5;
    return 0;
  }
  if (question.primaryGroups?.some((group) => selected.has(group))) return 10;
  if (question.isUniversalCore) return 7;
  if (question.secondaryGroups?.some((group) => selected.has(group))) return 5;
  return 0;
}

function buildTechnicalQueue(prepProfile) {
  const base = [
    ...getQuestionsForCategory('technical').map((question) => makeQueueQuestion(question, 'technical')),
    ...technicalSupplementalQuestions.map((question) => makeQueueQuestion({ ...question, categoryId: 'technical', categoryTitle: questionBanks.technical.title }, 'technical'))
  ];
  const scored = base
    .map((question) => ({ ...question, relevanceScore: scoreTechnicalQuestionRelevance(question, prepProfile) }))
    .filter((question) => question.relevanceScore >= technicalMinimumRelevance && isAdvancedQuestionAllowed(question, prepProfile));
  const primary = scored.filter((question) => question.relevanceScore >= 10);
  const universal = scored.filter((question) => question.isUniversalCore);
  const secondary = scored.filter((question) => question.relevanceScore >= technicalMinimumRelevance && question.relevanceScore < 10 && !question.isUniversalCore);
  const queue = [...shuffleQuestions(primary), ...shuffleQuestions(universal), ...shuffleQuestions(secondary)];
  return avoidRecentQuestions(uniqueQuestionCategories(uniqueQuestions(queue)), 'technical');
}

function buildBehavioralQueue(prepProfile) {
  const staticBroad = getQuestionsForCategory('behavioral')
    .filter((question) => questionMatchesExperience(question, prepProfile) && questionMatchesLeadership(question, prepProfile))
    .filter((question) => !/resume|student investment fund|finance club|athletics|built something from scratch/i.test(question.prompt));
  const generic = behavioralQuestionMix.filter((question) => question.tailoringLevel === 'generic').map((question) => makeQueueQuestion(question, 'behavioral'));
  const light = behavioralQuestionMix.filter((question) => question.tailoringLevel === 'light').map((question) => makeQueueQuestion(question, 'behavioral'));
  const specificSlots =
    prepProfile?.practiceMode === 'resume-aware' && prepProfile?.resumeText
      ? [
          makeQueueQuestion({ prompt: 'Tell me about one experience from your resume that you would want an interviewer to ask about.', sourceType: 'ai_slot', tailoringLevel: 'specific', questionCategory: 'resume-deep-dive' }, 'behavioral')
        ]
      : [];
  return uniqueQuestionCategories(uniqueQuestions(shuffleQuestions([...generic, ...staticBroad, ...generic, ...light, ...specificSlots])));
}

function buildFitQueue(prepProfile) {
  const primaryGroup = getPrimaryProfileGroup(prepProfile);
  const mandatory = [
    makeQueueQuestion({ prompt: 'Why investment banking?', mandatory: true, questionCategory: 'whyIB' }, 'fit'),
    makeQueueQuestion({ prompt: 'Why this group?', mandatory: true, groupTags: primaryGroup === 'Generalist' ? [] : [primaryGroup], questionCategory: 'whyGroup' }, 'fit'),
    makeQueueQuestion({ prompt: 'Why this bank?', mandatory: true, questionCategory: 'whyBank' }, 'fit')
  ];
  const eligible = getQuestionsForCategory('fit')
    .map((question) => {
      const prompt = question.prompt || '';
      const questionCategory =
        /Why investment banking/i.test(prompt) ? 'whyIB' :
          /Why this firm|Why this bank|platform|boutique|middle-market|regional/i.test(prompt) ? 'whyBank' :
            /Why .*interested in|Why this group/i.test(prompt) ? 'whyGroup' :
              /Walk me through your story|resume|background/i.test(prompt) ? 'resumeWalkthrough' :
                /transition|without prior finance/i.test(prompt) ? 'careerTransition' :
                  /skills|hire|differentiates/i.test(prompt) ? 'transferableSkills' :
                    'motivation';
      return makeQueueQuestion({ ...question, questionCategory }, 'fit');
    })
    .filter((question) => questionMatchesExperience(question, prepProfile) && questionMatchesLeadership(question, prepProfile))
    .filter((question) => questionMatchesSelectedGroups(question, prepProfile) && !questionIsBlocked(question, prepProfile))
    .filter((question) => !mandatory.some((mandatoryQuestion) => mandatoryQuestion.questionCategory === question.questionCategory))
    .filter((question) => !/office|connect .* experience|transition from|corporate development|TAS|audit/i.test(question.prompt) || prepProfile?.practiceMode === 'resume-aware');
  const aiSlots =
    prepProfile?.practiceMode === 'resume-aware' && prepProfile?.resumeText
      ? [
          makeQueueQuestion({ prompt: 'Ask a simple resume walkthrough question using at most one explicit resume detail.', sourceType: 'ai_slot', tailoringLevel: 'specific', questionCategory: 'resumeWalkthrough' }, 'fit'),
          makeQueueQuestion({ prompt: 'Ask a simple career transition or motivation question using at most one explicit resume detail.', sourceType: 'ai_slot', tailoringLevel: 'specific', questionCategory: 'careerTransition' }, 'fit'),
          makeQueueQuestion({ prompt: 'Ask a simple transferable skills question using at most one explicit resume detail.', sourceType: 'ai_slot', tailoringLevel: 'specific', questionCategory: 'transferableSkills' }, 'fit')
        ]
      : [];
  return uniqueQuestionCategories(uniqueQuestions([...mandatory, ...shuffleQuestions([...aiSlots, ...eligible])]));
}

function buildMarketQueue(prepProfile) {
  const eligible = marketQuestionMix
    .map((question) => makeQueueQuestion(question, 'markets'))
    .filter((question) => questionMatchesSelectedGroups(question, prepProfile) && !questionIsBlocked(question, prepProfile))
    .filter((question) => isAdvancedQuestionAllowed(question, prepProfile));
  const basic = eligible.filter((question) => question.tailoringLevel === 'generic');
  const tailored = eligible.filter((question) => question.tailoringLevel === 'group');
  const advanced = eligible.filter((question) => question.tailoringLevel === 'advanced');
  return uniqueQuestionCategories(uniqueQuestions(shuffleQuestions([...basic, ...basic, ...tailored, ...advanced])));
}

function buildQuestionQueue(categoryId, prepProfile) {
  if (categoryId === 'technical') return buildTechnicalQueue(prepProfile);
  if (categoryId === 'behavioral') return buildBehavioralQueue(prepProfile);
  if (categoryId === 'fit') return buildFitQueue(prepProfile);
  if (categoryId === 'markets') return buildMarketQueue(prepProfile);
  const mixedBlocks = [
    ...buildFitQueue(prepProfile).slice(0, 3),
    ...buildTechnicalQueue(prepProfile).slice(0, 6),
    ...buildBehavioralQueue(prepProfile).slice(0, 5),
    ...buildMarketQueue(prepProfile).slice(0, 4)
  ];
  return shuffleQuestions(avoidRecentQuestions(uniqueQuestionCategories(uniqueQuestions(mixedBlocks)), 'mixed'));
}

function toggleArrayValue(values, value) {
  return values.includes(value) ? values.filter((currentValue) => currentValue !== value) : [...values, value];
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getSupportedInterviewAudioMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  return [
    'audio/webm;codecs=opus',
    'audio/webm',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg'
  ].find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || '';
}

function isSupportedRecordedAudioBlob(blob) {
  return Boolean(blob?.type) && /^(audio|video)\/(webm|mp4|ogg)/i.test(blob.type);
}

export default function InterviewPrepPage({ onBack }) {
  const [prepProfile, setPrepProfile] = useState(() => readStoredPrepProfile());
  const [setupDraft, setSetupDraft] = useState(() => readStoredPrepProfile() || emptyPrepProfile);
  const [setupError, setSetupError] = useState('');
  const [resumeUploadStatus, setResumeUploadStatus] = useState('');
  const [resumeUploading, setResumeUploading] = useState(false);
  const [editingPrepProfile, setEditingPrepProfile] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [lastAnsweredQuestion, setLastAnsweredQuestion] = useState(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(() => typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined');
  const [speechMessage, setSpeechMessage] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [isTranscribingAnswer, setIsTranscribingAnswer] = useState(false);
  const [recordingPhase, setRecordingPhase] = useState('idle');
  const [capturedAudioUrl, setCapturedAudioUrl] = useState('');
  const [audioDebugInfo, setAudioDebugInfo] = useState({});
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordedAudioBlobRef = useRef(null);
  const capturedAudioUrlRef = useRef('');
  const isStartingRecordingRef = useRef(false);
  const discardNextRecordingRef = useRef(false);
  const questionQueuesRef = useRef({});
  const usedResumeExperienceIdsRef = useRef({});
  const generatedQuestionHistoryRef = useRef({});

  const selectedCategory = categoryCards.find((category) => category.id === selectedCategoryId);
  const audioDebugEnabled = import.meta.env.DEV;
  const recordingIsTransitioning = recordingPhase === 'starting' || recordingPhase === 'stopping' || recordingPhase === 'analyzing';
  const voiceControlsDisabled = feedbackLoading || isTranscribingAnswer || recordingIsTransitioning || (!speechSupported && !isRecording);
  const voiceStatusLabel =
    recordingPhase === 'starting'
      ? 'Starting microphone...'
      : recordingPhase === 'recording'
        ? 'Listening...'
        : recordingPhase === 'stopping'
          ? 'Finalizing recording...'
          : isTranscribingAnswer
            ? 'Transcribing...'
            : recordingPhase === 'analyzing' || feedbackLoading
              ? 'Evaluating...'
            : 'Start speaking';

  useEffect(() => {
    const supportsAudioRecording = Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined';
    setSpeechSupported(supportsAudioRecording);
    if (!supportsAudioRecording) {
      setShowTextInput(true);
      setSpeechMessage('Audio recording is not supported in this browser. Please type your answer.');
    }

    return () => {
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
      if (capturedAudioUrlRef.current) URL.revokeObjectURL(capturedAudioUrlRef.current);
    };
  }, []);

  const updateAudioDebugInfo = (nextInfo) => {
    setAudioDebugInfo((current) => ({ ...current, ...nextInfo, updatedAt: new Date().toLocaleTimeString() }));
  };

  const resetVoiceAnswerState = (showFallback = !speechSupported) => {
    if (mediaRecorderRef.current?.state === 'recording') {
      discardNextRecordingRef.current = true;
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
    audioChunksRef.current = [];
    recordedAudioBlobRef.current = null;
    isStartingRecordingRef.current = false;
    if (capturedAudioUrlRef.current) {
      URL.revokeObjectURL(capturedAudioUrlRef.current);
      capturedAudioUrlRef.current = '';
    }
    setCapturedAudioUrl('');
    setAnswer('');
    setShowTextInput(showFallback);
    setIsRecording(false);
    setIsTranscribingAnswer(false);
    setRecordingPhase('idle');
    updateAudioDebugInfo({
      reset: true,
      streamActive: false,
      audioTrackCount: 0,
      recorderState: 'reset',
      chunksCount: 0,
      finalBlobSize: 0,
      finalBlobType: ''
    });
    setSpeechMessage(showFallback && !speechSupported ? 'Audio recording is not supported in this browser. Please type your answer.' : '');
  };

  const generateAiQuestion = async (categoryId, previousPrompt = '', questionPlan = null) => {
    const generatedHistory = generatedQuestionHistoryRef.current[categoryId] || [];
    const response = await fetch('/api/interview-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId,
        categoryTitle: questionBanks[categoryId]?.title || 'Mixed Mock Interview',
        previousPrompt,
        prepProfile,
        questionPlan,
        generatedQuestionHistory: generatedHistory.slice(-8)
      })
    });

    if (!response.ok) {
      let details = '';
      try {
        const errorPayload = await response.json();
        details = [errorPayload.error, errorPayload.details].filter(Boolean).join(' ');
      } catch {
        details = await response.text();
      }
      throw new Error(details || `Question generation failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      ...(questionPlan ? makeQueueQuestion(questionPlan, categoryId) : createGeneratedQuestion(categoryId, prepProfile)),
      prompt: data.question,
      sourceType: 'ai_generated',
      generatedFromProfile: true
    };
  };

  const resolveQueuedQuestion = async (queuedQuestion, previousPrompt = '') => {
    if (!queuedQuestion) return null;
    if (queuedQuestion.sourceType === 'ai_slot') {
      const experienceHistoryKey = selectedCategoryId === 'mixed' ? 'mixed' : queuedQuestion.categoryId;
      const usedIds = usedResumeExperienceIdsRef.current[experienceHistoryKey] || [];
      const resumeExperience =
        prepProfile?.practiceMode === 'resume-aware' && queuedQuestion.tailoringLevel === 'specific'
          ? chooseResumeExperience(prepProfile, usedIds)
          : null;
      const resolved = await generateAiQuestion(queuedQuestion.categoryId, previousPrompt, {
        ...queuedQuestion,
        resumeExperience: resumeExperience
          ? {
              id: resumeExperience.id,
              type: resumeExperience.type,
              organization: resumeExperience.organization,
              title: resumeExperience.title,
              dates: resumeExperience.dates,
              bullets: resumeExperience.bullets.slice(0, 3),
              strongestThemes: resumeExperience.strongestThemes,
              tier: resumeExperience.tier,
              subtype: resumeExperience.subtype,
              selectionGuidance:
                resumeExperience.tier === 1
                  ? 'This is a high-priority resume experience; ask a realistic banker-style deep dive.'
                  : resumeExperience.tier === 2
                    ? 'This is a secondary but meaningful experience; ask a simple question about what the candidate learned, transferable skills, communication, teamwork, or attention to detail.'
                    : 'This is a supporting resume experience; keep the question broad, realistic, and simple, such as what the candidate learned or how they balanced responsibilities.'
            }
          : null
      });
      if (resumeExperience) {
        usedResumeExperienceIdsRef.current[experienceHistoryKey] = [...usedIds, resumeExperience.id];
      }
      return resolved;
    }
    return { ...queuedQuestion, sourceType: queuedQuestion.sourceType || 'static' };
  };

  const createAiFallbackQuestionPlan = (categoryId) => {
    const effectiveCategoryId = categoryId === 'mixed'
      ? ['fit', 'behavioral', 'markets', 'technical'][Math.floor(Math.random() * 4)]
      : categoryId;
    if (effectiveCategoryId === 'technical') {
      const topic = getPrimaryProfileGroup(prepProfile) === 'Generalist' ? 'universal core accounting or valuation' : `${getPrimaryProfileGroup(prepProfile)} technical fundamentals`;
      return makeQueueQuestion({
        prompt: `Generate one simple ${topic} technical question.`,
        sourceType: 'ai_slot',
        tailoringLevel: 'generic',
        questionCategory: `ai-technical-${Date.now()}`,
        topic,
        difficultyLevel: 'beginner'
      }, 'technical');
    }
    if (effectiveCategoryId === 'fit') {
      return makeQueueQuestion({
        prompt: 'Generate one simple fit question that is not Why IB, Why this bank, or Why this group.',
        sourceType: 'ai_slot',
        tailoringLevel: prepProfile?.practiceMode === 'resume-aware' ? 'specific' : 'generic',
        questionCategory: `ai-fit-${Date.now()}`
      }, 'fit');
    }
    if (effectiveCategoryId === 'behavioral') {
      return makeQueueQuestion({
        prompt: 'Generate one realistic behavioral interview question.',
        sourceType: 'ai_slot',
        tailoringLevel: prepProfile?.practiceMode === 'resume-aware' ? 'light' : 'generic',
        questionCategory: `ai-behavioral-${Date.now()}`
      }, 'behavioral');
    }
    return makeQueueQuestion({
      prompt: 'Generate one simple analyst-level market or deal discussion question.',
      sourceType: 'ai_slot',
      tailoringLevel: 'generic',
      questionCategory: `ai-market-${Date.now()}`
    }, 'markets');
  };

  const loadPracticeQuestion = async (categoryId, previousPrompt = '') => {
    if (!questionQueuesRef.current[categoryId]) {
      questionQueuesRef.current[categoryId] = buildQuestionQueue(categoryId, prepProfile);
    }
    let nextQuestion = questionQueuesRef.current[categoryId].length
      ? questionQueuesRef.current[categoryId].shift()
      : createAiFallbackQuestionPlan(categoryId);
    if (nextQuestion?.prompt === previousPrompt && questionQueuesRef.current[categoryId].length) {
      questionQueuesRef.current[categoryId].push(nextQuestion);
      nextQuestion = questionQueuesRef.current[categoryId].shift();
    }
    try {
      const resolvedQuestion = await resolveQueuedQuestion(nextQuestion, previousPrompt);
      if (resolvedQuestion) {
        rememberRecentQuestion(resolvedQuestion);
        if (resolvedQuestion.sourceType === 'ai_generated') {
          generatedQuestionHistoryRef.current[categoryId] = [
            ...(generatedQuestionHistoryRef.current[categoryId] || []),
            resolvedQuestion.prompt
          ].slice(-12);
        }
        return resolvedQuestion;
      }
      const fallback = createGeneratedQuestion(categoryId === 'mixed' ? 'technical' : categoryId, prepProfile);
      rememberRecentQuestion(fallback);
      return fallback;
    } catch (error) {
      console.error('[interview-question] Falling back to local generated question', error);
      setQuestionError('AI question generation was unavailable, so a backup question was used.');
      return createGeneratedQuestion(nextQuestion?.categoryId || categoryId, prepProfile);
    }
  };

  const startPractice = async (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentQuestion(null);
    setLastAnsweredQuestion(null);
    resetVoiceAnswerState(!speechSupported);
    setFeedback(null);
    setFeedbackError('');
    setQuestionError('');
    setQuestionLoading(true);
    questionQueuesRef.current[categoryId] = buildQuestionQueue(categoryId, prepProfile);
    usedResumeExperienceIdsRef.current[categoryId] = [];
    generatedQuestionHistoryRef.current[categoryId] = [];
    try {
      setCurrentQuestion(await loadPracticeQuestion(categoryId));
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setSetupDraft((current) => ({ ...current, resumeText: '', resumeContext: null, resumeFileName: '' }));
      setResumeUploadStatus('');
      setSetupError('Please upload a PDF resume.');
      return;
    }
    setSetupError('');
    setResumeUploading(true);
    setResumeUploadStatus('Processing PDF...');
    try {
      const dataUrl = await fileToDataUrl(file);
      const response = await fetch('/api/resume-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: 'application/pdf',
          dataUrl
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.resumeText) {
        throw new Error(payload.error || 'We could not process that PDF. Please retry the upload.');
      }
      setSetupDraft((current) => ({
        ...current,
        practiceMode: 'resume-aware',
        resumeText: payload.resumeText,
        resumeContext: buildResumeContext(payload.resumeText),
        resumeFileName: file.name
      }));
      setResumeUploadStatus(`${file.name} uploaded for this session.`);
    } catch (error) {
      setSetupDraft((current) => ({ ...current, resumeText: '', resumeContext: null, resumeFileName: '' }));
      setResumeUploadStatus('');
      setSetupError(error.message || 'We could not process that PDF. Please retry the upload.');
    } finally {
      setResumeUploading(false);
      event.target.value = '';
    }
  };

  const completePrepSetup = (event) => {
    event.preventDefault();
    if (!setupDraft.recruitingGoal || !setupDraft.targetBankTier || !setupDraft.targetGroups.length) {
      setSetupError('Choose a recruiting goal, target groups, and target bank tier to personalize your practice.');
      return;
    }
    if (setupDraft.practiceMode === 'resume-aware' && !setupDraft.resumeText) {
      setSetupError('Upload a PDF resume or switch to Generic Practice.');
      return;
    }
    const normalizedProfile = normalizePrepProfile(setupDraft);
    setPrepProfile(normalizedProfile);
    window.sessionStorage.setItem(prepProfileSessionKey, JSON.stringify(getProfileForSessionStorage(normalizedProfile)));
    setEditingPrepProfile(false);
    setSetupError('');
    setResumeUploadStatus('');
  };

  const editPrepProfile = () => {
    setSetupDraft(normalizePrepProfile(prepProfile) || emptyPrepProfile);
    setEditingPrepProfile(true);
    setSetupError('');
    setResumeUploadStatus(
      prepProfile?.practiceMode === 'resume-aware' && prepProfile?.resumeText
        ? `${prepProfile.resumeFileName || 'Resume'} uploaded for this session.`
        : ''
    );
  };

  const goBackToPrep = () => {
    setSelectedCategoryId(null);
    setCurrentQuestion(null);
    setLastAnsweredQuestion(null);
    setQuestionLoading(false);
    setQuestionError('');
    resetVoiceAnswerState();
    setFeedback(null);
    setFeedbackLoading(false);
    setFeedbackError('');
  };

  const submitAnswerForFeedback = async (answerText) => {
    setFeedback(null);
    setFeedbackError('');
    setFeedbackLoading(true);

    const feedbackEndpoint = '/api/interview-feedback';
    const payload = {
      category: currentQuestion.categoryTitle,
      question: currentQuestion.prompt,
      userAnswer: answerText,
      followUpContext: currentQuestion.isFollowUp
        ? {
            parentQuestion: currentQuestion.parentQuestion,
            parentAnswer: currentQuestion.parentAnswer
          }
        : null,
      prepProfile
    };

    try {
      console.log('[interview-feedback] Submitting answer for AI feedback', {
        endpoint: feedbackEndpoint,
        category: payload.category,
        questionPreview: payload.question.slice(0, 90),
        answerLength: payload.userAnswer.length
      });

      const response = await fetch(feedbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let details = '';
        try {
          const errorPayload = await response.json();
          details = [errorPayload.error, errorPayload.details].filter(Boolean).join(' ');
        } catch {
          details = await response.text();
        }
        throw new Error(details || `Feedback request failed with status ${response.status}`);
      }

      const data = await response.json();
      const requiredFields = [
        'scoreOutOf10',
        'whatWentWell',
        'whatWasMissing',
        'improvedAnswerStructure',
        'tenOutOfTenExampleResponse',
        'followUpQuestion'
      ];
      const missingFields = requiredFields.filter((field) => data[field] === undefined);
      if (missingFields.length) {
        throw new Error(`AI feedback response was missing: ${missingFields.join(', ')}`);
      }

      setFeedback({
        score: data.scoreOutOf10,
        whatWentWell: data.whatWentWell,
        whatWasMissing: data.whatWasMissing,
        suggestedStructure: data.improvedAnswerStructure,
        exampleResponse: data.tenOutOfTenExampleResponse,
        followUpQuestion: data.followUpQuestion,
        transcript: answerText
      });
      setLastAnsweredQuestion({
        question: currentQuestion.prompt,
        answer: answerText,
        categoryTitle: currentQuestion.categoryTitle,
        categoryId: currentQuestion.categoryId,
        concepts: currentQuestion.concepts,
        structureHint: currentQuestion.structureHint,
        followUps: currentQuestion.followUps
      });
      return true;
    } catch (error) {
      console.error('[interview-feedback] Feedback request failed', {
        endpoint: feedbackEndpoint,
        payload: {
          category: payload.category,
          questionPreview: payload.question.slice(0, 90),
          answerLength: payload.userAnswer.length,
          followUpContext: Boolean(payload.followUpContext),
          prepProfile: {
            recruitingGoal: prepProfile?.recruitingGoal,
            targetGroups: prepProfile?.targetGroups,
            targetBankTier: prepProfile?.targetBankTier,
            practiceMode: prepProfile?.practiceMode,
            hasResumeText: Boolean(prepProfile?.resumeText)
          }
        },
        error
      });
      const isNetworkFailure = error instanceof TypeError || /load failed|failed to fetch|networkerror/i.test(error.message || '');
      const baseMessage = isNetworkFailure
        ? 'AI backend is not reachable. Start the backend server and try again.'
        : 'We couldn’t evaluate your answer. Please try again.';
      setFeedbackError(import.meta.env.DEV && error.message && !isNetworkFailure ? `${baseMessage} ${error.message}` : baseMessage);
      return false;
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!answer.trim()) return;
    await submitAnswerForFeedback(answer.trim());
  };

  const transcribeAndEvaluateAudio = async (audioBlob) => {
    updateAudioDebugInfo({
      finalBlobType: audioBlob?.type || '',
      finalBlobSize: audioBlob?.size || 0,
      transcriptionPayloadFields: 'file',
      transcriptionOpenAIFileField: 'file',
      transcriptionFileName: 'interview-answer.webm'
    });
    console.info('[interview-audio] recording finalized', {
      type: audioBlob?.type,
      size: audioBlob?.size
    });
    if (!audioBlob || audioBlob.size <= 0 || !isSupportedRecordedAudioBlob(audioBlob)) {
      console.error('[interview-audio] empty or invalid audio blob', {
        hasBlob: Boolean(audioBlob),
        type: audioBlob?.type,
        size: audioBlob?.size,
        supportedType: isSupportedRecordedAudioBlob(audioBlob)
      });
      setRecordingPhase('idle');
      setIsRecording(false);
      setIsTranscribingAnswer(false);
      setFeedbackLoading(false);
      setSpeechMessage('No audio was captured. Please check microphone permissions and try again.');
      setFeedbackError('No audio was captured. Please check microphone permissions and try again.');
      return;
    }
    console.info('[interview-transcribe] sending shared transcription payload', {
      blobType: audioBlob.type,
      blobSize: audioBlob.size,
      browserPayloadFields: ['file'],
      fileName: 'interview-answer.webm',
      backendOpenAIFileField: 'file'
    });
    setIsTranscribingAnswer(true);
    setRecordingPhase('analyzing');
    setFeedbackLoading(true);
    setFeedbackError('');
    setSpeechMessage('Transcribing...');
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'interview-answer.webm');
      const transcriptionUrl = '/api/audio-transcribe';
      updateAudioDebugInfo({ transcriptionUrl });
      console.info('Interview Prep transcription request starting', {
        url: transcriptionUrl,
        method: 'POST',
        formDataKey: 'file',
        fileName: 'interview-answer.webm',
        blobType: audioBlob.type,
        blobSize: audioBlob.size
      });
      const response = await fetch(transcriptionUrl, {
        method: 'POST',
        body: formData
      });
      const payload = await response.json().catch(() => ({}));
      console.info('Interview Prep transcription response received', {
        status: response.status,
        ok: response.ok,
        error: payload.error
      });
      updateAudioDebugInfo({
        transcriptionStatus: response.status,
        transcriptionOk: response.ok,
        transcriptionError: payload.error || '',
        transcriptionDetails: payload.details ? String(payload.details).slice(0, 240) : '',
        transcriptLength: payload.transcript?.length || 0
      });
      console.info('[interview-transcribe] API response received', {
        status: response.status,
        ok: response.ok,
        hasTranscript: Boolean(payload.transcript),
        error: payload.error,
        details: payload.details
      });
      if (!response.ok || !payload.transcript) {
        throw new Error(payload.error || 'We couldn’t clearly transcribe your answer. Please try again or use Type Instead.');
      }
      setAnswer(payload.transcript);
      setSpeechMessage('Evaluating...');
      const evaluated = await submitAnswerForFeedback(payload.transcript);
      setSpeechMessage(evaluated ? 'Answer analyzed.' : 'Evaluation failed. Please try again.');
    } catch (error) {
      console.error('[interview-transcribe] Audio transcription/evaluation failed', error);
      updateAudioDebugInfo({
        transcriptionError: error.message || 'Transcription request failed',
        transcriptionOk: false
      });
      setFeedbackLoading(false);
      setFeedbackError(error.message || 'We couldn’t clearly transcribe your answer. Please try again or use Type Instead.');
      setSpeechMessage('Transcription failed. Please try again or use Type Instead.');
      setRecordingPhase('idle');
    } finally {
      setIsTranscribingAnswer(false);
      setRecordingPhase((current) => (current === 'analyzing' ? 'idle' : current));
    }
  };

  const handleNextQuestion = async () => {
    const previousPrompt = currentQuestion.prompt;
    setCurrentQuestion(null);
    resetVoiceAnswerState(!speechSupported);
    setFeedback(null);
    setFeedbackLoading(false);
    setFeedbackError('');
    setQuestionError('');
    setQuestionLoading(true);
    try {
      setCurrentQuestion(await loadPracticeQuestion(selectedCategoryId, previousPrompt));
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleAnswerFollowUp = () => {
    if (!feedback?.followUpQuestion) return;
    const sourceQuestion = lastAnsweredQuestion || currentQuestion;
    setCurrentQuestion({
      ...sourceQuestion,
      prompt: feedback.followUpQuestion,
      categoryId: sourceQuestion.categoryId || selectedCategoryId,
      categoryTitle: sourceQuestion.categoryTitle || selectedCategory?.title || 'Follow-Up Question',
      isFollowUp: true,
      parentQuestion: sourceQuestion.question || currentQuestion.prompt,
      parentAnswer: sourceQuestion.answer || answer,
      applicablePracticeTypes: [selectedCategoryId],
      difficulty: 'Follow-up',
      sourceType: 'ai_followup'
    });
    resetVoiceAnswerState(!speechSupported);
    setFeedback(null);
    setFeedbackLoading(false);
    setFeedbackError('');
  };

  const handleTryAgain = () => {
    resetVoiceAnswerState(!speechSupported);
    setFeedback(null);
    setFeedbackLoading(false);
    setFeedbackError('');
  };

  const handleStartRecording = async () => {
    if (isStartingRecordingRef.current || recordingPhase === 'starting' || recordingPhase === 'stopping' || recordingPhase === 'analyzing' || mediaRecorderRef.current?.state === 'recording') return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setSpeechSupported(false);
      setSpeechMessage('Audio recording is not available in this browser. You can still type your answer below.');
      setShowTextInput(true);
      return;
    }

    try {
      isStartingRecordingRef.current = true;
      setRecordingPhase('starting');
      mediaRecorderRef.current = null;
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
      audioChunksRef.current = [];
      discardNextRecordingRef.current = false;
      setAnswer('');
      setShowTextInput(false);
      setIsTranscribingAnswer(false);
      setFeedback(null);
      setFeedbackError('');
      const nextStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = nextStream;
      audioChunksRef.current = [];
      const audioTracks = nextStream.getAudioTracks().filter((track) => track.readyState === 'live');
      updateAudioDebugInfo({
        reset: false,
        streamActive: nextStream.active,
        audioTrackCount: nextStream.getAudioTracks().length,
        liveAudioTrackCount: audioTracks.length,
        audioTrackEnabled: nextStream.getAudioTracks()[0]?.enabled || false,
        audioTrackReadyState: nextStream.getAudioTracks()[0]?.readyState || '',
        chunksCount: 0,
        finalBlobSize: 0,
        finalBlobType: '',
        transcriptionStatus: '',
        transcriptionError: ''
      });
      if (!audioTracks.length) {
        throw new Error('We could not detect microphone audio. Please check microphone permission and retry.');
      }
      const audioStream = new MediaStream(audioTracks);
      const audioMimeType = getSupportedInterviewAudioMimeType();
      const recorder = audioMimeType ? new MediaRecorder(audioStream, { mimeType: audioMimeType }) : new MediaRecorder(audioStream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
        updateAudioDebugInfo({
          recorderState: recorder.state,
          latestChunkSize: event.data.size,
          chunksCount: audioChunksRef.current.length,
          totalChunkBytes: audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)
        });
        console.info('[interview-audio] dataavailable', {
          chunkSize: event.data.size,
          chunksCount: audioChunksRef.current.length,
          recorderState: recorder.state
        });
      };
      recorder.onerror = (event) => {
        console.error('[interview-audio] recorder error', event.error || event);
        updateAudioDebugInfo({
          recorderError: event.error?.message || event.error?.name || 'Recorder error',
          recorderState: recorder.state
        });
      };
      recorder.onstop = () => {
        const shouldDiscard = discardNextRecordingRef.current;
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || audioMimeType });
        if (capturedAudioUrlRef.current) URL.revokeObjectURL(capturedAudioUrlRef.current);
        const nextAudioUrl = audioBlob.size > 0 ? URL.createObjectURL(audioBlob) : '';
        recordedAudioBlobRef.current = audioBlob;
        capturedAudioUrlRef.current = nextAudioUrl;
        setCapturedAudioUrl(nextAudioUrl);
        updateAudioDebugInfo({
          streamActive: nextStream.active,
          recorderState: recorder.state,
          chunksCount: audioChunksRef.current.length,
          totalChunkBytes: audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0),
          finalBlobSize: audioBlob.size,
          finalBlobType: audioBlob.type,
          audioCaptured: audioBlob.size > 0,
          discarded: shouldDiscard
        });
        console.info('[interview-audio] recorder stopped', {
          discarded: shouldDiscard,
          mimeType: recorder.mimeType || audioMimeType,
          blobType: audioBlob.type,
          blobSize: audioBlob.size,
          chunkCount: audioChunksRef.current.length,
          audioTracks: audioTracks.length
        });
        audioStreamRef.current?.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        discardNextRecordingRef.current = false;
        setIsRecording(false);
        if (shouldDiscard) {
          setRecordingPhase('idle');
          return;
        }
        if (audioBlob.size <= 0) {
          setRecordingPhase('idle');
          setFeedbackLoading(false);
          setIsTranscribingAnswer(false);
          setSpeechMessage('No audio was captured. Please check microphone permissions and try again.');
          setFeedbackError('No audio was captured. Please check microphone permissions and try again.');
          return;
        }
        transcribeAndEvaluateAudio(audioBlob);
      };
      mediaRecorderRef.current = recorder;
      console.info('[interview-audio] recording started', {
        audioMimeType: recorder.mimeType || audioMimeType || 'browser-default',
        audioTracks: audioTracks.length
      });
      updateAudioDebugInfo({
        recorderState: recorder.state,
        selectedMimeType: recorder.mimeType || audioMimeType || 'browser-default'
      });
      recorder.start(1000);
      setIsRecording(true);
      setRecordingPhase('recording');
      updateAudioDebugInfo({ recorderState: recorder.state });
      setSpeechMessage('Listening...');
    } catch (error) {
      console.error('[interview-audio] Failed to start recording', error);
      setIsRecording(false);
      setRecordingPhase('idle');
      setSpeechMessage('Microphone access failed. Please try again or use Type Instead.');
      setFeedbackError(error.message || 'We couldn’t access your microphone. Please try again or use Type Instead.');
    } finally {
      isStartingRecordingRef.current = false;
    }
  };

  const handleStopRecording = () => {
    if (recordingPhase === 'stopping' || recordingPhase === 'analyzing') return;
    if (mediaRecorderRef.current?.state === 'recording') {
      setRecordingPhase('stopping');
      setSpeechMessage('Finalizing recording...');
      updateAudioDebugInfo({
        recorderState: mediaRecorderRef.current.state,
        stopRequested: true,
        chunksCountBeforeStop: audioChunksRef.current.length
      });
      try {
        mediaRecorderRef.current.requestData();
      } catch {
        // Some browsers do not support manual data flushing before stop.
      }
      mediaRecorderRef.current.stop();
    } else {
      setIsRecording(false);
      setRecordingPhase('idle');
    }
  };

  if (!prepProfile || editingPrepProfile) {
    return (
      <>
        <button type="button" className="back-button" onClick={onBack}>
          Back to Home
        </button>

        <section className="panel interview-setup-panel">
          <div className="networking-header">
            <div>
              <div className="beta-title-row">
                <span className="feature-eyebrow">Interview Prep setup</span>
                <span className="beta-badge">Beta</span>
              </div>
              <h2>Personalize your practice</h2>
              <p className="beta-note">Beta: This feature is actively improving. Results should be used as guidance, not guarantees.</p>
              <p>Answer a few quick questions so practice prompts and feedback match your recruiting path.</p>
            </div>
          </div>

          <form className="interview-setup-form" onSubmit={completePrepSetup}>
            <section>
              <h3>Recruiting Goal</h3>
              <div className="choice-grid compact">
                {recruitingGoals.map((goal) => (
                  <button
                    type="button"
                    className={setupDraft.recruitingGoal === goal ? 'choice-card selected' : 'choice-card'}
                    key={goal}
                    onClick={() => setSetupDraft((current) => ({ ...current, recruitingGoal: goal }))}
                  >
                    <strong>{goal}</strong>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3>Target Groups / Areas of Interest</h3>
              <div className="setup-chip-grid">
                {targetGroupOptions.map((group) => (
                  <button
                    type="button"
                    className={setupDraft.targetGroups.includes(group) ? 'chip selected' : 'chip'}
                    key={group}
                    onClick={() =>
                      setSetupDraft((current) => ({
                        ...current,
                        targetGroups: toggleArrayValue(current.targetGroups, group)
                      }))
                    }
                  >
                    {group}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3>Target Bank Tier</h3>
              <div className="choice-grid compact">
                {bankTierOptions.map((tier) => (
                  <button
                    type="button"
                    className={setupDraft.targetBankTier === tier ? 'choice-card selected' : 'choice-card'}
                    key={tier}
                    onClick={() => setSetupDraft((current) => ({ ...current, targetBankTier: tier }))}
                  >
                    <strong>{tier}</strong>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3>Practice Mode</h3>
              <div className="choice-grid compact">
                {[
                  {
                    value: 'resume-aware',
                    title: 'Resume-Aware Practice',
                    description: 'Upload a PDF resume so some prompts can reference your actual background.'
                  },
                  {
                    value: 'generic',
                    title: 'Generic Practice',
                    description: 'Practice broad interview questions without resume personalization.'
                  }
                ].map((mode) => (
                  <button
                    type="button"
                    className={setupDraft.practiceMode === mode.value ? 'choice-card selected' : 'choice-card'}
                    key={mode.value}
                    onClick={() => {
                      setSetupError('');
                      setResumeUploadStatus('');
                      setSetupDraft((current) => ({
                        ...current,
                        practiceMode: mode.value,
                        resumeText: mode.value === 'generic' ? '' : current.resumeText,
                        resumeContext: mode.value === 'generic' ? null : current.resumeContext,
                        resumeFileName: mode.value === 'generic' ? '' : current.resumeFileName
                      }));
                    }}
                  >
                    <strong>{mode.title}</strong>
                    <span>{mode.description}</span>
                  </button>
                ))}
              </div>

              {setupDraft.practiceMode === 'resume-aware' ? (
                <label className="file-upload-panel">
                  Upload PDF Resume
                  <input type="file" accept="application/pdf,.pdf" onChange={handleResumeUpload} disabled={resumeUploading} />
                  <span className="muted">
                    {resumeUploadStatus || 'PDF only. Extracted text is used internally for this session and is not shown.'}
                  </span>
                </label>
              ) : (
                <p className="muted">Generic mode will use only your recruiting goal, selected groups, and target bank tier.</p>
              )}
            </section>

            {setupError ? <p className="error">{setupError}</p> : null}

            <div className="survey-actions">
              {editingPrepProfile ? (
                <button type="button" className="secondary" onClick={() => setEditingPrepProfile(false)}>
                  Cancel
                </button>
              ) : null}
              <button type="submit" className="primary">
                Continue to Practice Menu
              </button>
            </div>
          </form>
        </section>
      </>
    );
  }

  if (selectedCategory && questionLoading) {
    return (
      <>
        <div className="button-row">
          <button type="button" className="back-button" onClick={goBackToPrep}>
            Back to Interview Prep
          </button>
          <button type="button" className="back-button" onClick={onBack}>
            Back to Home
          </button>
        </div>

        <section className="panel practice-panel">
          <div className="practice-header">
            <div>
              <span className="feature-eyebrow">{selectedCategory.title}</span>
              <h2>Building your next question...</h2>
              <p className="muted">
                {prepProfile.practiceMode === 'resume-aware'
                  ? 'Balancing general prompts with resume-aware personalization.'
                  : 'Building a broad practice prompt from your goal, groups, and bank tier.'}
              </p>
            </div>
          </div>
        </section>
      </>
    );
  }

  if (selectedCategory && currentQuestion) {
    return (
      <>
        <div className="button-row">
          <button type="button" className="back-button" onClick={goBackToPrep}>
            Back to Interview Prep
          </button>
          <button type="button" className="back-button" onClick={onBack}>
            Back to Home
          </button>
        </div>

        <section className="panel practice-panel">
          <div className="practice-header">
            <div>
              <span className="feature-eyebrow">{selectedCategory.title}</span>
              <h2>{currentQuestion.categoryTitle}</h2>
              <p className="muted">{selectedCategory.description}</p>
            </div>
          </div>

          <div className="question-card">
            <span className="question-label">{currentQuestion.isFollowUp ? 'Follow-Up Question' : 'Practice Question'}</span>
            {currentQuestion.sourceType === 'ai_generated' ? <span className="question-source-badge">AI Tailored Question</span> : null}
            {currentQuestion.sourceType === 'ai_followup' ? <span className="question-source-badge">AI Follow-Up</span> : null}
            <p>{currentQuestion.prompt}</p>
          </div>

          <form className="answer-form" onSubmit={handleSubmit}>
            <section className={isRecording ? 'voice-answer-panel recording' : 'voice-answer-panel'}>
	              <button
	                type="button"
	                className={isRecording ? 'mic-button recording' : 'mic-button'}
	                onClick={isRecording ? handleStopRecording : handleStartRecording}
	                disabled={voiceControlsDisabled}
	                aria-label={isRecording ? 'Stop speaking' : 'Start speaking'}
	              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="mic-icon">
                  <path d="M12 15.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v6a3.5 3.5 0 0 0 3.5 3.5Z" />
                  <path d="M5 11.5a7 7 0 0 0 14 0" />
                  <path d="M12 18.5V22" />
                  <path d="M8.5 22h7" />
                </svg>
              </button>
	              <div className="voice-answer-copy">
	                <strong>{voiceStatusLabel}</strong>
                <span>
                  {speechSupported
                    ? speechMessage || 'Answer out loud like you would in an interview. When you stop, Banker Builder will evaluate it automatically.'
                    : 'Audio recording is not supported in this browser. Please type your answer.'}
                </span>
              </div>
	              <div className="voice-answer-actions">
	                {isRecording ? (
	                  <button type="button" className="secondary" onClick={handleStopRecording} disabled={recordingPhase === 'stopping' || recordingPhase === 'analyzing'}>
	                    {recordingPhase === 'stopping' ? 'Finalizing...' : 'Stop speaking'}
	                  </button>
	                ) : null}
                {!showTextInput ? (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      resetVoiceAnswerState(true);
                      setSpeechMessage('Type your answer, then submit for evaluation.');
                    }}
	                    disabled={feedbackLoading || isTranscribingAnswer || recordingIsTransitioning}
                  >
                    Type instead
                  </button>
                ) : null}
              </div>
            </section>

            {capturedAudioUrl ? (
              <section className="audio-capture-confirmation">
                <strong>Audio captured</strong>
                <audio controls src={capturedAudioUrl} />
              </section>
            ) : null}

            {audioDebugEnabled ? (
              <details className="audio-debug-panel">
                <summary>Audio capture debug</summary>
                <dl>
                  <div>
                    <dt>Stream active</dt>
                    <dd>{String(Boolean(audioDebugInfo.streamActive))}</dd>
                  </div>
                  <div>
                    <dt>Audio tracks</dt>
                    <dd>{audioDebugInfo.audioTrackCount ?? 0} total / {audioDebugInfo.liveAudioTrackCount ?? 0} live</dd>
                  </div>
                  <div>
                    <dt>Track enabled</dt>
                    <dd>{String(Boolean(audioDebugInfo.audioTrackEnabled))} {audioDebugInfo.audioTrackReadyState ? `(${audioDebugInfo.audioTrackReadyState})` : ''}</dd>
                  </div>
                  <div>
                    <dt>Recorder state</dt>
                    <dd>{audioDebugInfo.recorderState || recordingPhase}</dd>
                  </div>
                  <div>
                    <dt>Chunks</dt>
                    <dd>{audioDebugInfo.chunksCount ?? 0} chunks / {audioDebugInfo.totalChunkBytes ?? 0} bytes</dd>
                  </div>
                  <div>
                    <dt>Final blob</dt>
                    <dd>{audioDebugInfo.finalBlobSize ?? 0} bytes / {audioDebugInfo.finalBlobType || 'none'}</dd>
                  </div>
                  <div>
                    <dt>Transcription</dt>
                    <dd>{audioDebugInfo.transcriptionStatus || 'not sent'} {audioDebugInfo.transcriptionOk === false ? 'failed' : ''}</dd>
                  </div>
                  <div>
                    <dt>Route</dt>
                    <dd>{audioDebugInfo.transcriptionUrl || 'not sent'}</dd>
                  </div>
                  <div>
                    <dt>Payload</dt>
                    <dd>{audioDebugInfo.transcriptionPayloadFields || 'none'} → {audioDebugInfo.transcriptionOpenAIFileField || 'file'}</dd>
                  </div>
                  {audioDebugInfo.transcriptionError ? (
                    <div>
                      <dt>Error</dt>
                      <dd>{audioDebugInfo.transcriptionError}</dd>
                    </div>
                  ) : null}
                </dl>
              </details>
            ) : null}

            {showTextInput ? (
              <label className="typed-answer-fallback">
                Your answer
                <textarea
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Type your answer as if you were speaking to an interviewer..."
                  rows="8"
                />
                {answer.trim() ? <span className="muted">Typed fallback answers are evaluated when you submit.</span> : null}
              </label>
            ) : null}
            <div className="practice-actions">
              {showTextInput ? (
                <button type="submit" className="primary" disabled={!answer.trim() || feedbackLoading}>
                  {feedbackLoading ? 'Analyzing...' : 'Submit Typed Answer'}
                </button>
              ) : null}
              <button type="button" className="secondary" onClick={handleTryAgain}>
                Try Again
              </button>
              <button type="button" className="secondary" onClick={handleNextQuestion} disabled={questionLoading}>
                {questionLoading ? 'Loading...' : 'Next Question'}
              </button>
            </div>
          </form>

          {feedbackLoading ? <p className="muted">Analyzing your answer...</p> : null}
          {feedbackError ? <p className="error">{feedbackError}</p> : null}
          {questionError ? <p className="muted">{questionError}</p> : null}

          {feedback ? (
            <section className="feedback-card" aria-live="polite">
              <div className="feedback-score">
                <span>Score</span>
                <strong>{feedback.score}/10</strong>
              </div>

              <div className="feedback-grid">
                <div>
                  <h3>What Went Well</h3>
                  <ul>
                    {feedback.whatWentWell.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>What Was Missing</h3>
                  <ul>
                    {feedback.whatWasMissing.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="feedback-note">
                <h3>Suggested Improved Answer Structure</h3>
                <p>{feedback.suggestedStructure}</p>
              </div>

              {feedback.transcript ? (
                <details className="feedback-note">
                  <summary>Transcript</summary>
                  <p>{feedback.transcript}</p>
                </details>
              ) : null}

              <div className="feedback-note example-response">
                <h3>10/10 Example Response</h3>
                <p>{feedback.exampleResponse}</p>
              </div>

              <div className="feedback-note">
                <h3>Follow-Up Question</h3>
                <p>{feedback.followUpQuestion}</p>
                <button type="button" className="secondary" onClick={handleAnswerFollowUp}>
                  Answer Follow-Up
                </button>
              </div>
            </section>
          ) : null}
        </section>
      </>
    );
  }

  return (
    <>
      <button type="button" className="back-button" onClick={onBack}>
        Back to Home
      </button>

      <section className="panel">
        <div className="target-results-header">
          <div>
            <div className="beta-title-row">
              <h2>Interview Prep</h2>
              <span className="beta-badge">Beta</span>
            </div>
            <p className="beta-note">Beta: This feature is actively improving. Results should be used as guidance, not guarantees.</p>
            <p className="muted">
              {prepProfile.practiceMode === 'resume-aware' ? 'Resume-Aware Practice' : 'Generic Practice'} · {prepProfile.recruitingGoal} · {prepProfile.targetBankTier} · {prepProfile.targetGroups.slice(0, 3).join(', ')}
              {prepProfile.targetGroups.length > 3 ? ` +${prepProfile.targetGroups.length - 3} more` : ''}
            </p>
          </div>
          <button type="button" className="secondary edit-inputs-button" onClick={editPrepProfile}>
            Edit Prep Profile
          </button>
        </div>
        <div className="home-grid">
          {categoryCards.map((category) => (
            <button type="button" className="feature-card" key={category.id} onClick={() => startPractice(category.id)}>
              <span className="feature-eyebrow">Mock Interview</span>
              <strong>{category.cardTitle}</strong>
              <span>{category.description}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
