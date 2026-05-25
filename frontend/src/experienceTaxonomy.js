export const bankInstitutionTypeOptions = [
  'Bulge Bracket / Major Global Bank',
  'Elite Boutique',
  'Middle Market Bank',
  'Regional Bank',
  'Regional / Local Boutique',
  'Other Financial Institution'
];

export const undergraduateWorkTypeOptions = [
  'Investment Banking Internship',
  'Private Equity Internship',
  'Accounting / Audit Internship',
  'TAS / Business Valuation Internship',
  'Corporate Finance / Corporate Accounting Internship',
  'Consulting Internship',
  'Front Office Finance Internship',
  'Middle Office Finance Internship',
  'Back Office / Operations Finance Internship',
  'Venture Capital Internship',
  'General / Other Experience'
];

export const undergraduateExperienceFollowUps = {
  'Investment Banking Internship': [
    { key: 'firmTier', label: 'Firm Tier', options: ['Elite Platform (BB / EB)', 'Strong MM', 'Middle Market', 'Regional Boutique', 'Small / Local Boutique'] }
  ],
  'Private Equity Internship': [
    { key: 'fundTier', label: 'Fund Tier', options: ['Megafund', 'Upper Middle Market', 'Middle Market', 'Lower Middle Market', 'Independent Sponsor / Small Fund'] }
  ],
  'Accounting / Audit Internship': [
    { key: 'firmTier', label: 'Firm Tier', options: ['Big 4', 'National / Next Tier', 'Top 100', 'Local / Small Firm'] },
    { key: 'function', label: 'Function', options: ['Audit', 'Tax'] }
  ],
  'TAS / Business Valuation Internship': [
    { key: 'firmTier', label: 'Firm Tier', options: ['Big 4', 'National / Next Tier', 'Top 100', 'Local / Small Firm'] }
  ],
  'Corporate Finance / Corporate Accounting Internship': [
    { key: 'companyPrestige', label: 'Company Prestige', options: ['F100', 'F500', 'Large Private / Mid-Market', 'Small Company'] },
    { key: 'roleType', label: 'Role Type', options: ['Corporate Development', 'Strategy / Finance Rotation', 'FP&A', 'Treasury', 'Corporate Accounting'] }
  ],
  'Consulting Internship': [
    { key: 'firmTier', label: 'Firm Tier', options: ['MBB', 'Tier 2 Strategy Consulting', 'Big 4 Consulting', 'Middle Market / Boutique Consulting', 'Local / Small Consulting Firm'] }
  ],
  'Front Office Finance Internship': [
    { key: 'institutionType', label: 'Institution Type', options: bankInstitutionTypeOptions }
  ],
  'Middle Office Finance Internship': [
    { key: 'institutionType', label: 'Institution Type', options: bankInstitutionTypeOptions }
  ],
  'Back Office / Operations Finance Internship': [
    { key: 'institutionType', label: 'Institution Type', options: bankInstitutionTypeOptions }
  ],
  'Venture Capital Internship': [
    { key: 'fundTier', label: 'Fund Tier', options: ['Top-Tier VC Fund', 'Established Institutional VC', 'Smaller VC Fund', 'Angel / Independent / Tiny Fund'] }
  ],
  'General / Other Experience': [
    { key: 'generalType', label: 'Experience Type', options: ['Part-Time Job', 'Campus Job', 'Leadership Program', 'Search Fund Internship', 'Student Research', 'Entrepreneurship / Startup', 'Military Experience', 'Other Internship'] }
  ]
};

export const undergraduateLegacyWorkTypeMap = {
  'Investment banking internship': { experienceType: 'Investment Banking Internship', firmTier: 'Middle Market' },
  'Private equity internship': { experienceType: 'Private Equity Internship', fundTier: 'Middle Market' },
  'Search fund internship': { experienceType: 'General / Other Experience', generalType: 'Search Fund Internship' },
  'Corporate finance internship': {
    experienceType: 'Corporate Finance / Corporate Accounting Internship',
    companyPrestige: 'Large Private / Mid-Market',
    roleType: 'FP&A'
  },
  'Accounting / audit internship': { experienceType: 'Accounting / Audit Internship', firmTier: 'National / Next Tier', function: 'Audit' },
  'Wealth management internship': { experienceType: 'Front Office Finance Internship', institutionType: 'Other Financial Institution' },
  'Other high finance internship': { experienceType: 'Front Office Finance Internship', institutionType: 'Other Financial Institution' },
  'Other finance internship': { experienceType: 'Front Office Finance Internship', institutionType: 'Other Financial Institution' },
  'Commercial banking internship': { experienceType: 'Middle Office Finance Internship', institutionType: 'Regional Bank' },
  'Real estate / cre internship': { experienceType: 'Front Office Finance Internship', institutionType: 'Other Financial Institution' },
  'Other internship': { experienceType: 'General / Other Experience', generalType: 'Other Internship' },
  'Part-time job': { experienceType: 'General / Other Experience', generalType: 'Part-Time Job' },
  'Campus job': { experienceType: 'General / Other Experience', generalType: 'Campus Job' },
  None: { experienceType: 'General / Other Experience', generalType: 'Other Internship' }
};

export function defaultExperienceFollowUpValues(experienceType, followUps = undergraduateExperienceFollowUps) {
  return Object.fromEntries((followUps[experienceType] || []).map((field) => [field.key, field.options[0]]));
}

export function normalizeUndergraduateExperience(experience = {}) {
  const legacyFromWorkType = undergraduateLegacyWorkTypeMap[experience.workType];
  const legacyFromExperienceType = undergraduateLegacyWorkTypeMap[String(experience.experienceType || '').toLowerCase()];
  const base = legacyFromExperienceType || legacyFromWorkType || undergraduateLegacyWorkTypeMap.None;
  const normalized = {
    ...base,
    ...experience
  };

  if (legacyFromExperienceType) {
    normalized.experienceType = legacyFromExperienceType.experienceType;
  }

  return {
    ...defaultExperienceFollowUpValues(normalized.experienceType),
    ...normalized
  };
}

export function financeInstitutionAdjustment(institutionType, roleCategory) {
  const table = {
    'Front Office Finance Internship': {
      'Bulge Bracket / Major Global Bank': 0.75,
      'Elite Boutique': 0.65,
      'Middle Market Bank': 0.45,
      'Regional Bank': 0.05,
      'Regional / Local Boutique': -0.1,
      'Other Financial Institution': -0.2
    },
    'Middle Office Finance Internship': {
      'Bulge Bracket / Major Global Bank': 0.85,
      'Elite Boutique': 0.55,
      'Middle Market Bank': 0.4,
      'Regional Bank': 0.15,
      'Regional / Local Boutique': -0.15,
      'Other Financial Institution': -0.3
    },
    'Back Office / Operations Finance Internship': {
      'Bulge Bracket / Major Global Bank': 0.65,
      'Elite Boutique': 0.35,
      'Middle Market Bank': 0.2,
      'Regional Bank': 0,
      'Regional / Local Boutique': -0.2,
      'Other Financial Institution': -0.35
    }
  };

  return table[roleCategory]?.[institutionType] ?? 0;
}

export function scoreUndergraduateExperience(rawExperience, clamp = (value) => Math.max(0, Math.min(10, value))) {
  const experience = normalizeUndergraduateExperience(rawExperience);
  const type = experience.experienceType;
  const signals = new Set();
  const affinities = new Set();
  let score = 3.2;
  let eliteIb = false;

  if (type === 'Investment Banking Internship') {
    signals.add('direct IB experience');
    score = {
      'Elite Platform (BB / EB)': 9.9,
      'Strong MM': 9.1,
      'Middle Market': 8.6,
      'Regional Boutique': 8,
      'Small / Local Boutique': 7.4
    }[experience.firmTier] ?? 8.4;
    eliteIb = experience.firmTier === 'Elite Platform (BB / EB)';
    ['M&A', 'Financial Sponsors', 'Generalist'].forEach((group) => affinities.add(group));
  } else if (type === 'Private Equity Internship') {
    signals.add('private equity experience');
    score = {
      Megafund: 9.2,
      'Upper Middle Market': 8.5,
      'Middle Market': 8,
      'Lower Middle Market': 7.4,
      'Independent Sponsor / Small Fund': 6.7
    }[experience.fundTier] ?? 7.8;
    affinities.add('Financial Sponsors');
  } else if (type === 'Accounting / Audit Internship') {
    signals.add('accounting internship');
    const tierScore = { 'Big 4': 6.9, 'National / Next Tier': 6.2, 'Top 100': 5.6, 'Local / Small Firm': 4.9 }[experience.firmTier] ?? 5.8;
    score = tierScore + (experience.function === 'Audit' ? 0.35 : -0.25);
    affinities.add('Financial Institutions');
  } else if (type === 'TAS / Business Valuation Internship') {
    signals.add('TAS / valuation experience');
    score = { 'Big 4': 8.1, 'National / Next Tier': 7.4, 'Top 100': 6.8, 'Local / Small Firm': 6.1 }[experience.firmTier] ?? 7.2;
    ['M&A', 'Generalist'].forEach((group) => affinities.add(group));
  } else if (type === 'Corporate Finance / Corporate Accounting Internship') {
    const prestige = { F100: 1, F500: 0.65, 'Large Private / Mid-Market': 0.25, 'Small Company': -0.25 }[experience.companyPrestige] ?? 0;
    const role = { 'Corporate Development': 7.6, 'Strategy / Finance Rotation': 6.8, 'FP&A': 6.1, Treasury: 5.9, 'Corporate Accounting': 5.2 }[experience.roleType] ?? 5.9;
    score = role + prestige;
    signals.add(experience.roleType === 'Corporate Development' ? 'corporate development experience' : 'corporate finance experience');
    if (experience.roleType === 'Corporate Development') affinities.add('M&A');
  } else if (type === 'Consulting Internship') {
    signals.add('consulting experience');
    score = { MBB: 8.3, 'Tier 2 Strategy Consulting': 7.6, 'Big 4 Consulting': 6.7, 'Middle Market / Boutique Consulting': 6.1, 'Local / Small Consulting Firm': 5.3 }[experience.firmTier] ?? 6.5;
    ['M&A', 'Generalist'].forEach((group) => affinities.add(group));
  } else if (type === 'Front Office Finance Internship') {
    signals.add('front office finance experience');
    score = 6.65 + financeInstitutionAdjustment(experience.institutionType, type);
    ['DCM', 'Debt Capital Markets', 'ECM', 'Equity Capital Markets', 'Capital Markets', 'Financial Institutions', 'Generalist'].forEach((group) => affinities.add(group));
  } else if (type === 'Middle Office Finance Internship') {
    signals.add('middle office finance experience');
    score = 5.75 + financeInstitutionAdjustment(experience.institutionType, type);
    ['DCM', 'Debt Capital Markets', 'LevFin', 'Leveraged Finance', 'Financial Institutions'].forEach((group) => affinities.add(group));
  } else if (type === 'Back Office / Operations Finance Internship') {
    signals.add('finance operations experience');
    score = 4.85 + financeInstitutionAdjustment(experience.institutionType, type);
    affinities.add('Financial Institutions');
  } else if (type === 'Venture Capital Internship') {
    signals.add('venture capital experience');
    score = { 'Top-Tier VC Fund': 8.1, 'Established Institutional VC': 7.3, 'Smaller VC Fund': 6.5, 'Angel / Independent / Tiny Fund': 5.7 }[experience.fundTier] ?? 6.8;
    affinities.add('Technology');
  } else {
    score = { 'Search Fund Internship': 6.5, 'Entrepreneurship / Startup': 5.9, 'Military Experience': 5.8, 'Leadership Program': 5.3, 'Student Research': 4.8, 'Other Internship': 4.4, 'Part-Time Job': 3.6, 'Campus Job': 3.3 }[experience.generalType] ?? 4.2;
    signals.add(experience.generalType === 'Search Fund Internship' ? 'search fund experience' : 'general work experience');
    if (experience.generalType === 'Entrepreneurship / Startup') ['Technology', 'Strategic Advisory'].forEach((group) => affinities.add(group));
  }

  return {
    score: clamp(score),
    signals: Array.from(signals),
    affinities: Array.from(affinities),
    eliteIb,
    experience
  };
}
