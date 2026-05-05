import { useEffect, useRef, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

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
      { prompt: 'Tell me about a time you worked on a team.', keywords: ['team', 'role', 'collaboration', 'result', 'learned'] },
      { prompt: 'Tell me about a time you failed.', keywords: ['failed', 'mistake', 'learned', 'improved', 'result'] },
      { prompt: 'Tell me about a time you led a group.', keywords: ['led', 'team', 'goal', 'action', 'result'] },
      { prompt: 'Tell me about a time you handled conflict.', keywords: ['conflict', 'listen', 'resolve', 'team', 'outcome'] },
      { prompt: 'What is your greatest weakness?', keywords: ['weakness', 'example', 'improve', 'steps', 'progress'] },
      { prompt: 'What is an accomplishment you are proud of?', keywords: ['accomplishment', 'challenge', 'action', 'impact', 'proud'] },
      { prompt: 'Tell me about a time you worked under pressure.', keywords: ['pressure', 'deadline', 'prioritize', 'execute', 'result'] },
      { prompt: 'Tell me about a time you received difficult feedback.', keywords: ['feedback', 'listened', 'improved', 'changed', 'result'] }
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
      { prompt: 'Why investment banking?', keywords: ['transactions', 'finance', 'analytical', 'learning', 'client', 'pace'] },
      { prompt: 'Why this firm?', keywords: ['firm', 'culture', 'platform', 'deals', 'people', 'fit'] },
      { prompt: 'Why this group?', keywords: ['group', 'industry', 'transactions', 'interest', 'experience', 'fit'] },
      { prompt: 'Why this office?', keywords: ['office', 'market', 'location', 'team', 'clients', 'fit'] },
      { prompt: 'Why are you interested in M&A?', keywords: ['strategic', 'valuation', 'synergies', 'transactions', 'companies'] },
      { prompt: 'Why are you interested in restructuring?', keywords: ['distressed', 'capital structure', 'creditors', 'liquidity', 'turnaround'] },
      { prompt: 'Why should we hire you?', keywords: ['skills', 'work ethic', 'experience', 'team', 'impact'] },
      { prompt: 'What differentiates you from other candidates?', keywords: ['differentiates', 'experience', 'skill', 'perspective', 'evidence'] },
      { prompt: 'Where do you see yourself in five years?', keywords: ['banking', 'develop', 'responsibility', 'clients', 'long term'] },
      { prompt: 'Why banking instead of consulting or corporate finance?', keywords: ['transactions', 'finance', 'ownership', 'pace', 'valuation'] }
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
      { prompt: 'How would higher interest rates affect M&A activity?', keywords: ['rates', 'debt', 'financing', 'valuation', 'buyers'] },
      { prompt: 'What industries are you currently following?', keywords: ['industry', 'trend', 'growth', 'companies', 'risks'] },
      { prompt: 'Pitch me a company.', keywords: ['company', 'business model', 'growth', 'valuation', 'risks'] },
      { prompt: 'What is one macro trend affecting investment banking?', keywords: ['macro', 'rates', 'inflation', 'markets', 'issuance'] },
      { prompt: 'What makes a company an attractive acquisition target?', keywords: ['growth', 'margin', 'market position', 'cash flow', 'synergies'] },
      { prompt: 'How would you think about synergies in a merger?', keywords: ['cost synergies', 'revenue synergies', 'integration', 'timing', 'risk'] },
      { prompt: 'What is happening in the IPO market?', keywords: ['ipo', 'equity markets', 'volatility', 'rates', 'investor demand'] },
      { prompt: 'What recent transaction stood out to you and why?', keywords: ['transaction', 'rationale', 'valuation', 'market', 'risk'] }
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
    concepts: bank.concepts,
    structureHint: bank.structureHint,
    followUps: bank.followUps
  }))
);

function getQuestionsForCategory(categoryId) {
  if (categoryId === 'mixed') {
    return allPracticeQuestions;
  }

  const bank = questionBanks[categoryId];
  return bank.questions.map((question) => ({
    ...question,
    categoryId,
    categoryTitle: bank.title,
    concepts: bank.concepts,
    structureHint: bank.structureHint,
    followUps: bank.followUps
  }));
}

function pickQuestion(categoryId, previousPrompt = '') {
  const questions = getQuestionsForCategory(categoryId);
  const availableQuestions = questions.length > 1 ? questions.filter((question) => question.prompt !== previousPrompt) : questions;
  return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
}

function countMatches(answer, terms) {
  return terms.reduce((total, term) => {
    const normalizedTerm = term.toLowerCase();
    return answer.includes(normalizedTerm) ? total + 1 : total;
  }, 0);
}

function evaluateAnswer(answer, question) {
  const normalizedAnswer = answer.toLowerCase();
  const words = normalizedAnswer.match(/\b[\w'-]+\b/g) || [];
  const wordCount = words.length;
  const keywordMatches = countMatches(normalizedAnswer, question.keywords);
  const conceptMatches = countMatches(normalizedAnswer, question.concepts);
  const hasStructure =
    /\b(first|second|third|finally|because|therefore|for example|in summary|the result|ultimately)\b/.test(normalizedAnswer) ||
    answer.includes('\n');
  const hasEvidence =
    /\b(example|result|impact|deal|company|team|client|model|valuation|learned|improved)\b/.test(normalizedAnswer);

  const lengthScore = wordCount >= 120 ? 3 : wordCount >= 80 ? 2.4 : wordCount >= 45 ? 1.8 : wordCount >= 20 ? 1 : 0.3;
  const keywordScore = Math.min(3, keywordMatches * 0.75);
  const structureScore = hasStructure ? 1.5 : 0.4;
  const evidenceScore = hasEvidence ? 1 : 0.3;
  const completenessScore = Math.min(1.5, conceptMatches * 0.4 + (keywordMatches >= 3 ? 0.5 : 0));
  const score = Math.max(1, Math.min(10, Math.round(lengthScore + keywordScore + structureScore + evidenceScore + completenessScore)));

  const wentWell = [];
  if (wordCount >= 80) {
    wentWell.push('You gave the answer enough substance to evaluate.');
  } else if (wordCount >= 35) {
    wentWell.push('You made a real start and avoided a one-line answer.');
  }

  if (keywordMatches >= 3) {
    wentWell.push('You included several concepts interviewers would expect for this prompt.');
  }

  if (hasStructure) {
    wentWell.push('Your answer showed some structure instead of sounding like a loose list.');
  }

  if (hasEvidence) {
    wentWell.push('You included evidence, examples, or banking-relevant language.');
  }

  if (!wentWell.length) {
    wentWell.push('You addressed the prompt, but the answer needs more detail before it would feel interview-ready.');
  }

  const missing = [];
  if (wordCount < 80) {
    missing.push('Add more depth. Strong interview answers usually need a concise setup, specific support, and a clear ending.');
  }

  if (keywordMatches < 3) {
    const missingKeywords = question.keywords.filter((keyword) => !normalizedAnswer.includes(keyword.toLowerCase())).slice(0, 4);
    missing.push(`Work in more core concepts, such as ${missingKeywords.join(', ')}.`);
  }

  if (!hasStructure) {
    missing.push('Use a cleaner structure so the interviewer can follow your logic.');
  }

  if (!hasEvidence) {
    missing.push('Add a concrete example, implication, or result to make the answer more credible.');
  }

  if (!missing.length) {
    missing.push('No major gaps for this simple rule-based check. The next improvement would be making the answer more concise and interviewer-ready.');
  }

  const followUpIndex = (wordCount + keywordMatches + conceptMatches) % question.followUps.length;

  return {
    score,
    whatWentWell: wentWell,
    whatWasMissing: missing,
    suggestedStructure: question.structureHint,
    exampleResponse: exampleResponses[question.prompt],
    followUpQuestion: question.followUps[followUpIndex]
  };
}

export default function InterviewPrepPage({ onBack }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechMessage, setSpeechMessage] = useState('');
  const recognitionRef = useRef(null);

  const selectedCategory = categoryCards.find((category) => category.id === selectedCategoryId);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRecognition));

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startPractice = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setCurrentQuestion(pickQuestion(categoryId));
    setAnswer('');
    setFeedback(null);
    setFeedbackError('');
    setSpeechMessage('');
  };

  const goBackToPrep = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setSelectedCategoryId(null);
    setCurrentQuestion(null);
    setAnswer('');
    setFeedback(null);
    setFeedbackLoading(false);
    setFeedbackError('');
    setIsRecording(false);
    setSpeechMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setFeedbackError('');
    setFeedbackLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/interview-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: currentQuestion.categoryTitle,
          question: currentQuestion.prompt,
          userAnswer: answer
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
        throw new Error(details || `Feedback request failed with status ${response.status}`);
      }

      const data = await response.json();
      setFeedback({
        score: data.scoreOutOf10,
        whatWentWell: data.whatWentWell,
        whatWasMissing: data.whatWasMissing,
        suggestedStructure: data.improvedAnswerStructure,
        exampleResponse: data.tenOutOfTenExampleResponse,
        followUpQuestion: data.followUpQuestion
      });
    } catch (error) {
      console.log('[interview-feedback] Feedback request failed', error);
      const baseMessage = 'Feedback could not be generated. Please try again.';
      setFeedbackError(import.meta.env.DEV && error.message ? `${baseMessage} ${error.message}` : baseMessage);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setCurrentQuestion(pickQuestion(selectedCategoryId, currentQuestion.prompt));
    setAnswer('');
    setFeedback(null);
    setFeedbackLoading(false);
    setFeedbackError('');
    setIsRecording(false);
    setSpeechMessage('');
  };

  const handleTryAgain = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setAnswer('');
    setFeedback(null);
    setFeedbackLoading(false);
    setFeedbackError('');
    setIsRecording(false);
    setSpeechMessage('');
  };

  const handleStartRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setSpeechMessage('Speech recognition is not available in this browser. You can still type your answer below.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setSpeechMessage('Listening...');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        setAnswer((currentAnswer) => `${currentAnswer}${currentAnswer.trim() ? ' ' : ''}${finalTranscript.trim()}`);
      }

      if (interimTranscript.trim()) {
        setSpeechMessage(`Listening... ${interimTranscript.trim()}`);
      } else {
        setSpeechMessage('Listening...');
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setSpeechMessage('Speech recognition stopped. You can start again or keep typing your answer.');
    };

    recognition.onend = () => {
      setIsRecording(false);
      setSpeechMessage((currentMessage) =>
        currentMessage.startsWith('Listening') ? 'Recording complete. You can edit the transcript before submitting.' : currentMessage
      );
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

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
            <span className="question-label">Practice Question</span>
            <p>{currentQuestion.prompt}</p>
          </div>

          <form className="answer-form" onSubmit={handleSubmit}>
            <label>
              Your answer
              <div className="voice-controls">
                <button type="button" className="secondary" onClick={handleStartRecording} disabled={isRecording}>
                  Start Recording
                </button>
                {isRecording ? (
                  <button type="button" className="secondary" onClick={handleStopRecording}>
                    Stop Recording
                  </button>
                ) : null}
                <span className={isRecording ? 'recording-status active' : 'recording-status'}>
                  {speechSupported ? speechMessage || 'Voice recording is optional.' : 'Speech recognition is unavailable. Typed answers still work.'}
                </span>
              </div>
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Type your answer as if you were speaking to an interviewer..."
                rows="8"
              />
            </label>
            <div className="practice-actions">
              <button type="submit" className="primary" disabled={!answer.trim() || feedbackLoading}>
                {feedbackLoading ? 'Analyzing...' : 'Submit Answer'}
              </button>
              <button type="button" className="secondary" onClick={handleTryAgain}>
                Try Again
              </button>
              <button type="button" className="secondary" onClick={handleNextQuestion}>
                Next Question
              </button>
            </div>
          </form>

          {feedbackLoading ? <p className="muted">Analyzing your answer...</p> : null}
          {feedbackError ? <p className="error">{feedbackError}</p> : null}

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

              <div className="feedback-note example-response">
                <h3>10/10 Example Response</h3>
                <p>{feedback.exampleResponse}</p>
              </div>

              <div className="feedback-note">
                <h3>Follow-Up Question</h3>
                <p>{feedback.followUpQuestion}</p>
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
        <h2>Interview Prep</h2>
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
