import { useEffect, useMemo, useState } from 'react';
import ScoreBreakdown from './ScoreBreakdown';
import SchoolAutocomplete from './SchoolAutocomplete';
import ibOffices from '../../../data/ibOffices.json';
import { defaultSchool, schoolDisplayName, schoolForPayload, schoolToScore } from '../schoolScoring';

const fallbackGroups = [
  'Generalist',
  'M&A',
  'Restructuring',
  'Financial Sponsors',
  'Technology',
  'Healthcare',
  'Industrials',
  'Consumer & Retail',
  'Financial Institutions'
];

const activityTypeOptions = [
  'Selective IB club',
  'Investment fund / student-run fund',
  'Business fraternity',
  'Scholars Group',
  'Social fraternity / sorority executive board',
  'Finance/business club',
  'Consulting club',
  'Entrepreneurship club',
  'Non-business leadership organization',
  'Other'
];

function activityTypeLabel(option) {
  if (option === 'Social fraternity / sorority executive board') return 'Social Fraternity/Sorority';
  return option;
}

const selectivityOptions = [
  { value: 'highly selective', label: 'Highly selective' },
  { value: 'selective', label: 'Selective' },
  { value: 'moderate', label: 'Moderate signal' },
  { value: 'open enrollment', label: 'Open enrollment' }
];

const leadershipOptions = [
  { value: 'president', label: 'President' },
  { value: 'vp', label: 'VP' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'committee lead', label: 'Committee Lead' },
  { value: 'member', label: 'Member' },
  { value: 'none', label: 'None' }
];

const groupAdjustments = {
  Restructuring: 0.25,
  'M&A': 0.15,
  'Financial Sponsors': 0.1,
  Technology: 0.08,
  Healthcare: 0.05,
  'Activism / Strategic Advisory': 0.05,
  'Financial Institutions': 0,
  Industrials: -0.02,
  Energy: -0.04,
  'Consumer & Retail': -0.05,
  'Business Services': -0.08,
  'Healthcare Services': -0.08,
  Generalist: -0.1
};

const workTypeScores = {
  'Investment banking internship': 10,
  'Private equity internship': 8.8,
  'Search fund internship': 8.2,
  'Corporate finance internship': 6.4,
  'Accounting / audit internship': 6.1,
  'Wealth management internship': 5.8,
  'Other finance internship': 6,
  'Other internship': 4.4,
  'Part-time job': 3.6,
  'Campus job': 3.3,
  None: 1.2
};

const activityTypeScores = {
  'Selective IB club': 9.4,
  'Investment fund / student-run fund': 9,
  'Business fraternity': 8.2,
  'Social fraternity / sorority executive board': 8,
  'Scholars Group': 6.8,
  'Finance/business club': 6.5,
  'Consulting club': 5.8,
  'Entrepreneurship club': 5.8,
  'Non-business leadership organization': 5.2,
  Other: 3.5
};

const selectivityScores = {
  'highly selective': 10,
  selective: 8,
  moderate: 5.5,
  'open enrollment': 2.5
};

const leadershipScores = {
  president: 10,
  vp: 9,
  VP: 9,
  treasurer: 9,
  'finance chair': 9,
  'committee lead': 7,
  member: 3.2,
  none: 0
};

const relevanceScores = {
  high: 10,
  moderate: 6.5,
  low: 3.5,
  none: 1
};

const contactSeniorityMultiplier = {
  analyst: 1,
  associate: 1.15,
  'vp+': 1.35
};

const connectionMultiplier = {
  cold: 1,
  alumni: 1.2,
  'close connection': 1.45
};

const stateRegions = {
  CT: 'Northeast',
  MA: 'Northeast',
  ME: 'Northeast',
  NH: 'Northeast',
  NY: 'Northeast',
  RI: 'Northeast',
  VT: 'Northeast',
  DC: 'Mid-Atlantic',
  DE: 'Mid-Atlantic',
  MD: 'Mid-Atlantic',
  NJ: 'Mid-Atlantic',
  PA: 'Mid-Atlantic',
  VA: 'Mid-Atlantic',
  AL: 'Southeast',
  FL: 'Southeast',
  GA: 'Southeast',
  KY: 'Southeast',
  LA: 'Southeast',
  MS: 'Southeast',
  NC: 'Southeast',
  SC: 'Southeast',
  TN: 'Southeast',
  IL: 'Midwest',
  IN: 'Midwest',
  IA: 'Midwest',
  MI: 'Midwest',
  MN: 'Midwest',
  MO: 'Midwest',
  OH: 'Midwest',
  WI: 'Midwest',
  TX: 'Texas',
  AZ: 'Southwest',
  NM: 'Southwest',
  OK: 'Southwest',
  AR: 'Southwest',
  CO: 'Mountain West',
  ID: 'Mountain West',
  MT: 'Mountain West',
  NV: 'Mountain West',
  UT: 'Mountain West',
  WY: 'Mountain West',
  CA: 'West Coast',
  OR: 'West Coast',
  WA: 'West Coast'
};

const adjacentRegions = {
  Northeast: ['Mid-Atlantic'],
  'Mid-Atlantic': ['Northeast', 'Southeast', 'Midwest'],
  Southeast: ['Mid-Atlantic', 'Texas'],
  Midwest: ['Mid-Atlantic', 'Texas', 'Mountain West'],
  Texas: ['Southeast', 'Southwest', 'Midwest'],
  Southwest: ['Texas', 'Mountain West', 'West Coast'],
  'Mountain West': ['Southwest', 'Midwest', 'West Coast'],
  'West Coast': ['Southwest', 'Mountain West']
};

const schoolMetroMap = {
  'nyu-stern': ['New York'],
  columbia: ['New York'],
  'fordham-gabelli': ['New York'],
  'baruch-zicklin': ['New York'],
  'cuny-transfer': ['New York'],
  harvard: ['Boston'],
  'mit-sloan': ['Boston'],
  'bc-carroll': ['Boston'],
  northeastern: ['Boston'],
  bentley: ['Boston'],
  babson: ['Boston'],
  stanford: ['Palo Alto', 'Menlo Park', 'San Francisco'],
  'berkeley-haas': ['San Francisco'],
  ucla: ['Los Angeles'],
  'usc-marshall': ['Los Angeles'],
  'texas-mccombs': ['Austin'],
  'rice': ['Houston'],
  'houston-bauer': ['Houston'],
  'smu-cox': ['Dallas'],
  'ohio-state-fisher': ['Columbus'],
  'cincinnati-lindner': ['Cincinnati'],
  'case-western-weatherhead': ['Cleveland'],
  'michigan-ross': ['Detroit'],
  'michigan-state-broad': ['Detroit'],
  'uchicago': ['Chicago'],
  northwestern: ['Chicago'],
  'illinois-gies': ['Chicago'],
  'washu-olin': ['St. Louis'],
  'emory-goizueta': ['Atlanta'],
  'georgia-terry': ['Atlanta'],
  'georgia-tech-scheller': ['Atlanta'],
  'vanderbilt': ['Nashville'],
  'unc-kenan-flagler': ['Raleigh', 'Charlotte'],
  duke: ['Raleigh', 'Charlotte'],
  'uva-mcintire': ['Washington', 'Richmond'],
  georgetown: ['Washington'],
  'maryland-smith': ['Washington', 'Baltimore'],
  'washington-foster': ['Seattle'],
  'wisconsin': ['Milwaukee'],
  'minnesota-carlson': ['Minneapolis'],
  'florida-warrington': ['Miami', 'Tampa'],
  'miami-herbert': ['Miami'],
  'arizona-state-carey': ['Phoenix'],
  'denver-daniels': ['Denver'],
  'colorado-boulder-leeds': ['Denver']
};

const profileWeights = {
  'Summer Analyst': {
    academic: 0.28,
    experience: 0.22,
    networking: 0.36,
    extracurricular: 0.14,
    baseDifficultyAdjustment: 0
  },
  'Lateral Hire': {
    academic: 0.16,
    experience: 0.42,
    networking: 0.34,
    extracurricular: 0.08,
    baseDifficultyAdjustment: 0.15
  },
  'MBA Associate': {
    academic: 0.34,
    experience: 0.34,
    networking: 0.24,
    extracurricular: 0.08,
    baseDifficultyAdjustment: 0.25
  }
};

const workTypeOptions = [
  'Investment Banking Internship',
  'Private Equity Internship',
  'Accounting / Audit Internship',
  'TAS / Business Valuation Internship',
  'Corporate Finance / Corporate Accounting Internship',
  'Consulting Internship',
  'Wealth Management Internship',
  'Venture Capital Internship',
  'Other High Finance Internship',
  'Commercial Banking Internship',
  'Real Estate / CRE Internship',
  'General / Other Experience'
];

const recencyOptions = [
  'Current / most recent',
  'Past 1-2 years',
  'Older experience'
];

const experienceFollowUps = {
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
  'Wealth Management Internship': [
    { key: 'platformTier', label: 'Platform Tier', options: ['Elite / BB Platform', 'Large National Platform', 'Regional Platform', 'Local RIA / Small Practice'] }
  ],
  'Venture Capital Internship': [
    { key: 'fundTier', label: 'Fund Tier', options: ['Top-Tier VC Fund', 'Established Institutional VC', 'Smaller VC Fund', 'Angel / Independent / Tiny Fund'] }
  ],
  'Other High Finance Internship': [
    { key: 'industry', label: 'Industry', options: ['Hedge Fund', 'Equity Research', 'Sales & Trading', 'Asset Management'] },
    { key: 'platformPrestige', label: 'Platform Prestige', options: ['Elite Platform', 'Strong Institutional Platform', 'Mid-Tier Platform', 'Small / Unknown Platform'] }
  ],
  'Commercial Banking Internship': [
    { key: 'platformTier', label: 'Platform Tier', options: ['Bulge Bracket / Major Bank', 'Super-Regional / Strong National Bank', 'Regional Bank', 'Local / Community Bank'] }
  ],
  'Real Estate / CRE Internship': [
    { key: 'platformTier', label: 'Platform Tier', options: ['Institutional Platform', 'Large Brokerage / Advisory Platform', 'Regional Firm', 'Small / Local Firm'] }
  ],
  'General / Other Experience': [
    { key: 'generalType', label: 'Experience Type', options: ['Part-Time Job', 'Campus Job', 'Leadership Program', 'Search Fund Internship', 'Student Research', 'Entrepreneurship / Startup', 'Military Experience', 'Other Internship'] }
  ]
};

const legacyWorkTypeMap = {
  'Investment banking internship': { experienceType: 'Investment Banking Internship', firmTier: 'Middle Market' },
  'Private equity internship': { experienceType: 'Private Equity Internship', fundTier: 'Middle Market' },
  'Search fund internship': { experienceType: 'General / Other Experience', generalType: 'Search Fund Internship' },
  'Corporate finance internship': {
    experienceType: 'Corporate Finance / Corporate Accounting Internship',
    companyPrestige: 'Large Private / Mid-Market',
    roleType: 'FP&A'
  },
  'Accounting / audit internship': { experienceType: 'Accounting / Audit Internship', firmTier: 'National / Next Tier', function: 'Audit' },
  'Wealth management internship': { experienceType: 'Wealth Management Internship', platformTier: 'Large National Platform' },
  'Other finance internship': { experienceType: 'Other High Finance Internship', industry: 'Asset Management', platformPrestige: 'Mid-Tier Platform' },
  'Other internship': { experienceType: 'General / Other Experience', generalType: 'Other Internship' },
  'Part-time job': { experienceType: 'General / Other Experience', generalType: 'Part-Time Job' },
  'Campus job': { experienceType: 'General / Other Experience', generalType: 'Campus Job' },
  None: { experienceType: 'General / Other Experience', generalType: 'Other Internship' }
};

const seniorityOptions = [
  { value: 'analyst', label: 'Analyst' },
  { value: 'associate', label: 'Associate' },
  { value: 'vp', label: 'VP' },
  { value: 'director', label: 'Director' },
  { value: 'md', label: 'Managing Director' }
];

const connectionOptions = [
  { value: 'none', label: 'No clear connection' },
  { value: 'cold outreach', label: 'Cold outreach' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'employee referral', label: 'Employee referral' },
  { value: 'family/friend', label: 'Family / friend' }
];

const stepTitles = [
  'Bank + Office Selection',
  'Hire Type',
  'Group Selection',
  'Academic Info',
  'Extracurriculars & Leadership',
  'Prior Work / Internship Experience',
  'Networking Info',
  'Review Your Inputs'
];

const createActivity = () => ({
  id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  activityType: 'Selective IB club',
  selectivity: 'selective',
  leadershipLevel: 'member'
});

const createWorkExperience = () => ({
  id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  experienceType: 'General / Other Experience',
  generalType: 'Other Internship',
  recency: 'Current / most recent'
});

function defaultFollowUpValues(experienceType) {
  return Object.fromEntries((experienceFollowUps[experienceType] || []).map((field) => [field.key, field.options[0]]));
}

const defaultProfile = {
  school: defaultSchool,
  gpa: 3.7,
  workType: 'None',
  workExperiences: [createWorkExperience()],
  activities: [createActivity()],
  networking: {
    initialChats: 0,
    followUps: 0,
    strongRelationships: 0,
    referrals: 0,
    strongestContactSeniority: 'analyst',
    connectionType: 'cold outreach'
  }
};

function createOpportunitiesFromOffices(offices = []) {
  return offices.flatMap((office) =>
    (office.groups || []).map((group) => {
      const competitiveness = clamp(office.competitivenessScore + (groupAdjustments[group] ?? 0));

      return {
        id: `${office.id}-${group}`,
        officeId: office.id,
        firm: office.firm,
        name: office.firm,
        office: office.officeCity,
        officeCity: office.officeCity,
        state: office.state,
        group,
        tier: office.type,
        type: office.type,
        competitiveness: Number(competitiveness.toFixed(2)),
        competitivenessScore: office.competitivenessScore,
        prestigeStars: office.prestigeStars,
        payStars: office.payStars,
        competitivenessStars: office.competitivenessStars
      };
    })
  );
}

function normalizeOpportunityData(data) {
  const sourceOpportunities = Array.isArray(data?.opportunities)
    ? data.opportunities
    : Array.isArray(data?.firms)
      ? data.firms
      : [];
  const opportunities = sourceOpportunities.length
    ? sourceOpportunities.map((opportunity) => ({
        ...opportunity,
        office: opportunity.office || opportunity.officeCity,
        competitiveness:
          typeof opportunity.competitiveness === 'number'
            ? opportunity.competitiveness
            : Number(clamp((opportunity.competitivenessScore || 0) + (groupAdjustments[opportunity.group] ?? 0)).toFixed(2))
      }))
    : createOpportunitiesFromOffices(data?.offices);
  const groups = Array.isArray(data?.groups) && data.groups.length
    ? data.groups
    : [...new Set(opportunities.map((opportunity) => opportunity.group).filter(Boolean))].sort();

  if (!opportunities.length) {
    throw new Error('No firm office opportunities were available.');
  }

  return {
    ...data,
    opportunities,
    firms: opportunities,
    groups: groups.length ? groups : fallbackGroups
  };
}

function firstSelectionFromOpportunities(data) {
  const firstOpportunity = data.firms[0];

  return {
    hireType: 'Summer Analyst',
    firm: firstOpportunity?.firm || firstOpportunity?.name || '',
    office: firstOpportunity?.office || firstOpportunity?.officeCity || '',
    group: firstOpportunity?.group || data.groups[0] || 'Generalist'
  };
}

function clamp(value, min = 0, max = 10) {
  return Math.max(min, Math.min(max, value));
}

function normalizedRegionForState(state) {
  return stateRegions[String(state || '').toUpperCase()] || '';
}

function normalizedSchoolRegion(school) {
  const schoolStateRegion = normalizedRegionForState(school?.state);
  if (schoolStateRegion) return schoolStateRegion;

  const region = String(school?.region || '');
  if (region === 'West') return 'West Coast';
  if (region === 'Southwest' && school?.state === 'TX') return 'Texas';
  return region;
}

function normalizeCity(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function regionalAlignmentBoost(profile, opportunity, scores, adjustedCompetitiveness) {
  const school = profile.school && typeof profile.school === 'object' ? profile.school : null;
  if (!school || school.id === 'other-not-listed' || school.id === 'community-college-transfer') {
    return { points: 0, label: '' };
  }

  const schoolRegion = normalizedSchoolRegion(school);
  const officeRegion = normalizedRegionForState(opportunity.state);
  const schoolState = String(school.state || '').toUpperCase();
  const officeState = String(opportunity.state || '').toUpperCase();
  const officeCity = normalizeCity(opportunity.officeCity || opportunity.office);
  const schoolMetroCities = schoolMetroMap[school.id] || [];
  const sameMetro = schoolMetroCities.some((city) => normalizeCity(city) === officeCity);

  let points = 0;
  let label = '';

  if (sameMetro) {
    points = 0.7;
    label = 'local-market';
  } else if (schoolState && schoolState === officeState) {
    points = 0.5;
    label = 'in-state';
  } else if (schoolRegion && schoolRegion === officeRegion) {
    points = 0.3;
    label = 'regional';
  } else if (schoolRegion && adjacentRegions[schoolRegion]?.includes(officeRegion)) {
    points = 0.15;
    label = 'adjacent-region';
  }

  if (!points) return { points: 0, label: '' };

  let dampener = 1;
  if (profile.gpa < 3.5) dampener *= 0.35;
  if (scores.experience < 4.5) dampener *= 0.55;
  if (scores.networking < 3.2) dampener *= 0.65;
  if (adjustedCompetitiveness >= 8.8) dampener *= 0.65;

  return {
    points: Number((points * dampener).toFixed(2)),
    label
  };
}

function dynamicSoftCutoff(baseCutoff, competitiveness) {
  return clamp(baseCutoff + (competitiveness - 7.5) * 0.08, 3.45, 3.9);
}

function gpaToNonlinearScore(gpa, competitiveness) {
  const cutoff = dynamicSoftCutoff(3.7, competitiveness);

  if (gpa < 2.7) return 0.5;

  if (gpa < 3.5) {
    const severeBand = (gpa - 2.7) / 0.8;
    return clamp(1 + Math.pow(severeBand, 1.8) * 3.8);
  }

  const belowCutoffRange = Math.max(cutoff - 3.5, 0.1);
  if (gpa <= cutoff) {
    const normalized = (gpa - 3.5) / belowCutoffRange;
    return clamp(5 + Math.pow(normalized, 1.25) * 3.2);
  }

  const aboveRange = 4 - cutoff;
  const normalizedAbove = (gpa - cutoff) / Math.max(aboveRange, 0.05);
  const diminishingBonus = Math.log1p(normalizedAbove * 3) / Math.log(4);
  return clamp(8.2 + diminishingBonus * 1.8);
}

function workTypeScore(workType) {
  return clamp(workTypeScores[workType] ?? workTypeScores['Other internship']);
}

function normalizeExperience(experience = {}) {
  if (experience.experienceType) {
    return {
      ...defaultFollowUpValues(experience.experienceType),
      ...experience,
      recency: experience.recency || 'Current / most recent'
    };
  }

  return {
    ...(legacyWorkTypeMap[experience.workType] || legacyWorkTypeMap.None),
    ...experience,
    recency: experience.recency || 'Current / most recent'
  };
}

function experienceSummary(experience) {
  const normalized = normalizeExperience(experience);
  const detailValues = (experienceFollowUps[normalized.experienceType] || [])
    .map((field) => normalized[field.key])
    .filter(Boolean);

  return [normalized.experienceType, ...detailValues, normalized.recency].filter(Boolean).join(' · ');
}

function experienceReasonText(experienceResult) {
  if (!experienceResult?.signals?.length) return '';

  const signal = experienceResult.signals[0];
  const signalReason = experienceResult.eliteIb
    ? ' Your prior IB internship is a major recruiting signal and meaningfully strengthens your profile.'
    : ` Your ${signal} adds a relevant recruiting signal.`;
  const affinityReason = experienceResult.affinityBoost > 0
    ? ' Your prior experience also aligns with this target group.'
    : '';

  return `${signalReason}${affinityReason}`;
}

function recencyMultiplier(recency, hireType) {
  if (recency === 'Current / most recent') return 1;
  if (hireType === 'Summer Analyst') return recency === 'Past 1-2 years' ? 0.92 : 0.78;
  if (hireType === 'MBA Associate') return recency === 'Past 1-2 years' ? 0.72 : 0.42;
  return recency === 'Past 1-2 years' ? 0.82 : 0.55;
}

function scoreSingleExperience(rawExperience, hireType) {
  const experience = normalizeExperience(rawExperience);
  const type = experience.experienceType;
  let score = 3.2;
  const signals = new Set();
  const affinities = new Set();
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
  } else if (type === 'Wealth Management Internship') {
    signals.add('wealth management experience');
    score = { 'Elite / BB Platform': 6.1, 'Large National Platform': 5.4, 'Regional Platform': 4.8, 'Local RIA / Small Practice': 4.1 }[experience.platformTier] ?? 5;
  } else if (type === 'Venture Capital Internship') {
    signals.add('venture capital experience');
    score = { 'Top-Tier VC Fund': 8.1, 'Established Institutional VC': 7.3, 'Smaller VC Fund': 6.5, 'Angel / Independent / Tiny Fund': 5.7 }[experience.fundTier] ?? 6.8;
    affinities.add('Technology');
  } else if (type === 'Other High Finance Internship') {
    const industry = { 'Hedge Fund': 7.4, 'Equity Research': 7.2, 'Sales & Trading': 6.7, 'Asset Management': 6.5 }[experience.industry] ?? 6.6;
    const prestige = { 'Elite Platform': 0.8, 'Strong Institutional Platform': 0.45, 'Mid-Tier Platform': 0, 'Small / Unknown Platform': -0.45 }[experience.platformPrestige] ?? 0;
    score = industry + prestige;
    signals.add('high finance experience');
    if (experience.industry === 'Hedge Fund') affinities.add('Restructuring');
    if (experience.industry === 'Equity Research') affinities.add('Financial Institutions');
    if (experience.industry === 'Sales & Trading') affinities.add('DCM');
  } else if (type === 'Commercial Banking Internship') {
    signals.add('commercial banking experience');
    score = { 'Bulge Bracket / Major Bank': 6.8, 'Super-Regional / Strong National Bank': 6.3, 'Regional Bank': 5.7, 'Local / Community Bank': 5 }[experience.platformTier] ?? 5.8;
    ['DCM', 'Financial Institutions'].forEach((group) => affinities.add(group));
  } else if (type === 'Real Estate / CRE Internship') {
    signals.add('real estate finance experience');
    score = { 'Institutional Platform': 6.9, 'Large Brokerage / Advisory Platform': 6.3, 'Regional Firm': 5.7, 'Small / Local Firm': 5 }[experience.platformTier] ?? 5.9;
    affinities.add('Real Estate');
  } else {
    score = { 'Search Fund Internship': 6.5, 'Entrepreneurship / Startup': 5.9, 'Military Experience': 5.8, 'Leadership Program': 5.3, 'Student Research': 4.8, 'Other Internship': 4.4, 'Part-Time Job': 3.6, 'Campus Job': 3.3 }[experience.generalType] ?? 4.2;
    signals.add(experience.generalType === 'Search Fund Internship' ? 'search fund experience' : 'general work experience');
    if (experience.generalType === 'Entrepreneurship / Startup') affinities.add('Technology');
  }

  return {
    score: clamp(score * recencyMultiplier(experience.recency, hireType)),
    signals: Array.from(signals),
    affinities: Array.from(affinities),
    eliteIb
  };
}

function structuredExperienceScore(profile, hireType, targetGroup) {
  const experiences = (profile.workExperiences || []).map((experience) => scoreSingleExperience(experience, hireType));
  if (!experiences.length) return { score: workTypeScore(profile.workType), affinityBoost: 0, signals: [], eliteIb: false };

  const ranked = experiences.sort((a, b) => b.score - a.score);
  const primary = ranked[0];
  const secondary = ranked.slice(1).reduce((sum, experience, index) => sum + experience.score * (index === 0 ? 0.24 : 0.1), 0);
  const stackCap = primary.eliteIb ? 10 : primary.score >= 8.5 ? 9.4 : 8.8;
  const affinityBoost = ranked.some((experience) => experience.affinities.includes(targetGroup)) ? (primary.eliteIb ? 0.12 : 0.22) : 0;

  return {
    score: clamp(Math.min(primary.score + secondary, stackCap) + affinityBoost),
    affinityBoost,
    signals: [...new Set(ranked.flatMap((experience) => experience.signals))],
    eliteIb: ranked.some((experience) => experience.eliteIb)
  };
}

function normalizeNetworkingForScoring(networking = {}) {
  const seniority = ['vp', 'director', 'md'].includes(networking.strongestContactSeniority)
    ? 'vp+'
    : networking.strongestContactSeniority;
  const connectionType =
    networking.connectionType === 'cold outreach'
      ? 'cold'
      : ['employee referral', 'family/friend'].includes(networking.connectionType)
        ? 'close connection'
        : networking.connectionType;

  return {
    ...networking,
    strongestContactSeniority: seniority || 'associate',
    connectionType: connectionType || 'alumni'
  };
}

function normalizeProfileForScoring(profile) {
  return {
    ...profile,
    networking: normalizeNetworkingForScoring(profile.networking)
  };
}

function networkingScore(networking) {
  const points =
    networking.initialChats * 1 +
    networking.followUps * 1.5 +
    networking.strongRelationships * 5 +
    networking.referrals * 7;

  const seniority = contactSeniorityMultiplier[networking.strongestContactSeniority] ?? 1;
  const connection = connectionMultiplier[networking.connectionType] ?? 1;

  return clamp(((points * seniority * connection) / 120) * 10);
}

function activityScore(activity) {
  const type = activityTypeScores[activity.activityType] ?? activityTypeScores.Other;
  const selectivity = selectivityScores[activity.selectivity] ?? 4;
  const leadership = leadershipScores[activity.leadershipLevel] ?? 0;
  const relevance = relevanceScores[activity.businessRelevance] ?? relevanceScores.moderate;
  const openEnrollmentMemberPenalty =
    activity.selectivity === 'open enrollment' &&
    (!activity.leadershipLevel || ['member', 'none'].includes(activity.leadershipLevel))
      ? 1.6
      : 0;

  return clamp(type * 0.33 + selectivity * 0.2 + leadership * 0.32 + relevance * 0.15 - openEnrollmentMemberPenalty);
}

function extracurricularScore(profile) {
  const ranked = (profile.activities || []).map(activityScore).sort((a, b) => b - a);
  const primary = ranked[0] ?? 0;
  const secondary = ranked.slice(1).reduce((sum, score, index) => sum + score * (index === 0 ? 0.45 : 0.25), 0);
  return clamp(primary + secondary, 0, 10);
}

function confidenceFromDelta(delta) {
  if (Math.abs(delta) >= 1.3) return 'high';
  if (Math.abs(delta) >= 0.6) return 'medium';
  return 'low';
}

function baseClassification(delta) {
  if (delta >= 0.8) return 'Safety';
  if (delta >= -0.6) return 'Target';
  return 'Reach';
}

function applyGates({ classification, gpa, networking, experience, competitiveness, gpaScore }) {
  let updated = classification;
  const gateReasons = [];

  if (gpa < 3.5) {
    updated = 'Reach';
    gateReasons.push('GPA below 3.5 creates a strong screening risk for many IB processes.');
  }

  if (networking < 3.2 && competitiveness > 8.0 && updated !== 'Reach') {
    updated = 'Reach';
    gateReasons.push('Low networking activity reduces interview conversion at competitive firms.');
  }

  if (experience < 4.5 && competitiveness >= 8.5 && updated === 'Safety') {
    updated = 'Target';
    gateReasons.push('Limited deal-relevant experience caps upside for top-tier roles.');
  }

  if (gpaScore < 4.5 && competitiveness >= 8.8 && updated !== 'Reach') {
    updated = 'Reach';
    gateReasons.push("GPA profile is below this office's adjusted soft cutoff.");
  }

  return { classification: updated, gateReasons };
}

function buildStrengths(scoreBreakdown) {
  const strengths = [];
  if (scoreBreakdown.networking >= 7) strengths.push('Strong networking engine with meaningful touchpoints and relationship depth.');
  if (scoreBreakdown.experience >= 7) strengths.push('Experience profile signals credible deal-readiness and relevant exposure.');
  if (scoreBreakdown.academic >= 7) strengths.push('Academic profile clears most resume screens for IB analyst recruiting.');
  if (scoreBreakdown.extracurricular >= 7) strengths.push('Activities & Leadership show credible operating responsibility and campus signal.');
  return strengths.slice(0, 3);
}

function buildGaps(scoreBreakdown, gateReasons) {
  const gaps = [...gateReasons];
  if (scoreBreakdown.networking < 6) gaps.push('Networking volume and referral depth should be built further.');
  if (scoreBreakdown.experience < 6) gaps.push('Experience quality needs stronger transaction or valuation exposure.');
  if (scoreBreakdown.academic < 6) gaps.push('Academic profile is below average for top investment banking pipelines.');
  if (scoreBreakdown.extracurricular < 5) gaps.push('Activities & Leadership signal is light; selective finance groups or real operating roles would help.');
  return [...new Set(gaps)].slice(0, 3);
}

function buildActionSteps(scoreBreakdown, profile) {
  const steps = [];
  if (scoreBreakdown.networking < 7) {
    steps.push('Run a 6-week networking sprint: 8-10 new chats/week with 48-hour follow-ups and weekly relationship tracking.');
  }
  if (profile.gpa < 3.7) {
    steps.push('Raise academic signal via next-term GPA improvement and technical prep to offset transcript concerns.');
  }
  if (scoreBreakdown.experience < 7) {
    steps.push('Add transaction-relevant reps (LBO comps, CIM teardown, valuation case writeups) and highlight them on your resume.');
  }
  if (scoreBreakdown.extracurricular < 6) {
    steps.push('Pursue a selective finance activity or a President, VP, or Treasurer role with measurable responsibility.');
  }
  if (steps.length < 2) {
    steps.push('Target analysts/alumni in preferred offices for referral-oriented outreach with tailored firm-specific pitches.');
  }
  return steps.slice(0, 3);
}

function profileScores(profile, competitiveness, weights, hireType, targetGroup) {
  const schoolScore = schoolToScore(profile.school);
  const gpaScore = gpaToNonlinearScore(profile.gpa, competitiveness);
  const academic = clamp(schoolScore * 0.45 + gpaScore * 0.55);
  const experienceResult = structuredExperienceScore(profile, hireType, targetGroup);
  const experience = experienceResult.score;
  const networking = networkingScore(profile.networking);
  const extracurricular = extracurricularScore(profile);
  const total = clamp(
    academic * weights.academic +
      experience * weights.experience +
      networking * weights.networking +
      extracurricular * weights.extracurricular
  );

  return { schoolScore, gpaScore, academic, experience, networking, extracurricular, total, experienceResult };
}

function hireTypeDifficultyAdjustment(hireType, profile) {
  const weights = profileWeights[hireType];
  const experience = structuredExperienceScore(profile, hireType, 'Generalist').score;
  const schoolScore = schoolToScore(profile.school);
  let adjustment = weights.baseDifficultyAdjustment;

  if (hireType === 'Lateral Hire') {
    if (experience < 6) adjustment += 0.65;
    if (experience >= 8) adjustment -= 0.2;
  }

  if (hireType === 'MBA Associate') {
    if (schoolScore < 7.5) adjustment += 0.35;
    if (experience < 5.5) adjustment += 0.25;
    if (schoolScore >= 8.8 && experience >= 7) adjustment -= 0.2;
  }

  return adjustment;
}

function scoreInterviewOddsLocally({ profile, firmName, office, group, hireType = 'Summer Analyst' }, opportunities) {
  const weights = profileWeights[hireType];
  if (!weights) throw new Error('Unknown hire type.');

  const opportunity = opportunities.find(
    (item) => item.firm === firmName && item.office === office && item.group === group
  );
  if (!opportunity) throw new Error('Unknown firm, office, and group combination.');

  const adjustedCompetitiveness = clamp(
    opportunity.competitiveness + hireTypeDifficultyAdjustment(hireType, profile)
  );
  const scores = profileScores(profile, adjustedCompetitiveness, weights, hireType, opportunity.group);
  const regionalBoost = regionalAlignmentBoost(profile, opportunity, scores, adjustedCompetitiveness);
  const boostedTotal = clamp(scores.total + regionalBoost.points);
  const delta = boostedTotal - adjustedCompetitiveness;
  const unboostedDelta = scores.total - adjustedCompetitiveness;
  const unboostedLikelihood = 100 / (1 + Math.exp(-1.15 * (unboostedDelta + 0.1)));
  const rawLikelihood = 100 / (1 + Math.exp(-1.15 * (delta + 0.1)));
  const likelihood = Math.round(Math.max(3, Math.min(92, Math.min(rawLikelihood, unboostedLikelihood + 7))));
  const gateResult = applyGates({
    classification: baseClassification(delta),
    gpa: profile.gpa,
    networking: scores.networking,
    experience: scores.experience,
    competitiveness: adjustedCompetitiveness,
    gpaScore: scores.gpaScore
  });
  const scoreBreakdown = {
    academic: Number(scores.academic.toFixed(2)),
    experience: Number(scores.experience.toFixed(2)),
    networking: Number(scores.networking.toFixed(2)),
    extracurricular: Number(scores.extracurricular.toFixed(2)),
    total: Number(boostedTotal.toFixed(2)),
    school: Number(scores.schoolScore.toFixed(2)),
    gpa: Number(scores.gpaScore.toFixed(2))
  };
  const regionalReason = regionalBoost.points > 0
    ? ' Your school has regional alignment with this office, which modestly improves your odds.'
    : '';
  const experienceReason = experienceReasonText(scores.experienceResult);

  return {
    opportunity: {
      id: opportunity.id,
      firm: opportunity.firm,
      office: opportunity.office,
      group: opportunity.group,
      tier: opportunity.tier,
      type: opportunity.type,
      prestigeStars: opportunity.prestigeStars,
      payStars: opportunity.payStars,
      competitivenessStars: opportunity.competitivenessStars,
      competitiveness: Number(adjustedCompetitiveness.toFixed(2))
    },
    hireType,
    likelihood,
    classification: gateResult.classification,
    confidence: confidenceFromDelta(delta),
    scoreBreakdown,
    strengths: buildStrengths(scoreBreakdown, profile),
    gaps: buildGaps(scoreBreakdown, gateResult.gateReasons),
    actionSteps: buildActionSteps(scoreBreakdown, profile),
    reason: `Your total score (${boostedTotal.toFixed(2)}) is ${delta >= 0 ? 'above' : 'below'} this ${hireType} ${opportunity.group} opportunity's adjusted benchmark (${adjustedCompetitiveness.toFixed(1)}).${regionalReason}${experienceReason}`
  };
}

function cloneProfile(profile) {
  return {
    ...profile,
    networking: { ...profile.networking },
    activities: (profile.activities || []).map((activity) => ({ ...activity })),
    workExperiences: (profile.workExperiences || []).map((experience) => ({ ...experience }))
  };
}

function bestWorkScore(profile) {
  return structuredExperienceScore(profile, 'Summer Analyst', 'Generalist').score;
}

function buildNeedleProjection(scoringPayload, opportunities, currentResult) {
  const currentOdds = currentResult.likelihood;
  const baseProfile = scoringPayload.profile;
  const scenarios = [];

  const addScenario = (title, updateProfile) => {
    const profile = updateProfile(cloneProfile(baseProfile));

    try {
      const projected = scoreInterviewOddsLocally({ ...scoringPayload, profile }, opportunities);
      const improvement = projected.likelihood - currentOdds;
      if (improvement > 0) {
        scenarios.push({
          title,
          projectedOdds: projected.likelihood,
          improvement
        });
      }
    } catch (err) {
      console.error('Failed to project improvement scenario.', err);
    }
  };

  if ((baseProfile.networking?.initialChats || 0) < 8 || (baseProfile.networking?.followUps || 0) < 6) {
    addScenario('Secure 2 additional meaningful conversations with this office', (profile) => {
      profile.networking.initialChats = (profile.networking.initialChats || 0) + 2;
      profile.networking.followUps = (profile.networking.followUps || 0) + 2;
      return profile;
    });
  }

  if ((baseProfile.networking?.referrals || 0) < 1) {
    addScenario('Convert one contact into a referral', (profile) => {
      profile.networking.referrals = 1;
      profile.networking.strongRelationships = Math.max(profile.networking.strongRelationships || 0, 1);
      profile.networking.connectionType = 'close connection';
      return profile;
    });
  }

  if (bestWorkScore(baseProfile) < 7.5) {
    addScenario('Add a stronger finance/investing internship', (profile) => {
      const upgradedExperience = bestWorkScore(profile) < 5.5
        ? {
            id: 'projected-work',
            experienceType: 'Corporate Finance / Corporate Accounting Internship',
            companyPrestige: 'F500',
            roleType: 'FP&A',
            recency: 'Current / most recent'
          }
        : {
            id: 'projected-work',
            experienceType: 'Investment Banking Internship',
            firmTier: 'Middle Market',
            recency: 'Current / most recent'
          };
      profile.workExperiences = profile.workExperiences.length
        ? [upgradedExperience, ...profile.workExperiences.slice(1)]
        : [upgradedExperience];
      return profile;
    });
  }

  if (baseProfile.gpa < 3.7) {
    addScenario(baseProfile.gpa < 3.5 ? 'Raise GPA to the 3.5 screening threshold' : 'Raise GPA closer to a 3.7 recruiting screen', (profile) => {
      profile.gpa = baseProfile.gpa < 3.5 ? 3.5 : 3.7;
      return profile;
    });
  }

  if (extracurricularScore(baseProfile) < 6.5) {
    addScenario('Add selective leadership in a finance or Scholars Group activity', (profile) => {
      profile.activities = [
        {
          id: 'projected-activity',
          activityType: 'Scholars Group',
          selectivity: 'selective',
          leadershipLevel: 'committee lead',
          businessRelevance: 'moderate'
        },
        ...profile.activities
      ];
      return profile;
    });
  }

  return {
    currentOdds,
    gpaConstraintNote:
      baseProfile.gpa < 3.5
        ? 'GPA below 3.5 creates material screening risk, so upside may remain capped until the academic screen improves.'
        : '',
    scenarios: scenarios
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 3)
  };
}

function oddsStatus(likelihood) {
  if (likelihood >= 55) return { label: 'Strong', className: 'strong' };
  if (likelihood >= 25) return { label: 'Moderate', className: 'moderate' };
  return { label: 'Low', className: 'low' };
}

function NumberField({ label, value, onChange, step = 1, min = 0, max = 100 }) {
  return (
    <label>
      <span>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export default function InterviewOddsPage({ onBack }) {
  const [showIntro, setShowIntro] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [opportunities, setOpportunities] = useState({ firms: [], groups: fallbackGroups });
  const [firmSearch, setFirmSearch] = useState('');
  const [isFirmSelectorOpen, setIsFirmSelectorOpen] = useState(false);
  const [selection, setSelection] = useState({
    hireType: 'Summer Analyst',
    firm: '',
    office: '',
    group: 'Generalist'
  });
  const [profile, setProfile] = useState(defaultProfile);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadOpportunities() {
      try {
        const response = await fetch('http://localhost:4000/api/opportunities');
        if (!response.ok) throw new Error('Failed to load opportunities');
        const data = normalizeOpportunityData(await response.json());
        if (ignore) return;

        setOpportunities(data);
        const initialSelection = firstSelectionFromOpportunities(data);
        setSelection(initialSelection);
        setFirmSearch(initialSelection.firm);
        setError('');
      } catch (err) {
        console.error('Failed to load opportunities from API. Falling back to local office dataset.', err);

        try {
          const fallbackData = normalizeOpportunityData({ offices: ibOffices });
          if (ignore) return;

          setOpportunities(fallbackData);
          const initialSelection = firstSelectionFromOpportunities(fallbackData);
          setSelection(initialSelection);
          setFirmSearch(initialSelection.firm);
          setError('');
        } catch (fallbackErr) {
          console.error('Failed to load local office dataset fallback.', fallbackErr);
          if (!ignore) setError('Could not load firm and office options.');
        }
      }
    }

    loadOpportunities();

    return () => {
      ignore = true;
    };
  }, []);

  const firmOptions = useMemo(
    () => [...new Set(opportunities.firms.map((opportunity) => opportunity.firm || opportunity.name))].filter(Boolean).sort(),
    [opportunities.firms]
  );

  const matchingFirmOptions = useMemo(() => {
    const query = firmSearch.trim().toLowerCase();
    if (!query) return [];

    return firmOptions.filter((firm) => firm.toLowerCase().includes(query)).slice(0, 8);
  }, [firmOptions, firmSearch]);

  const officeOptions = useMemo(
    () =>
      [
        ...new Set(
          opportunities.firms
            .filter((opportunity) => (opportunity.firm || opportunity.name) === selection.firm)
            .map((opportunity) => opportunity.office)
        )
      ],
    [opportunities.firms, selection.firm]
  );

  const groupOptions = useMemo(
    () =>
      opportunities.firms
        .filter(
          (opportunity) =>
            (opportunity.firm || opportunity.name) === selection.firm &&
            opportunity.office === selection.office
        )
        .map((opportunity) => opportunity.group)
        .filter(Boolean),
    [opportunities.firms, selection.firm, selection.office]
  );

  const activeGroupOptions = groupOptions.length ? groupOptions : opportunities.groups || fallbackGroups;
  const progressPercent = ((currentStep + 1) / stepTitles.length) * 100;
  const status = result ? oddsStatus(result.likelihood) : null;

  const handleFirmChange = (firmName) => {
    const nextFirm = opportunities.firms.find((opportunity) => (opportunity.firm || opportunity.name) === firmName);
    const nextOffice = nextFirm?.office || '';
    const nextGroup = opportunities.firms.find(
      (opportunity) => (opportunity.firm || opportunity.name) === firmName && opportunity.office === nextOffice
    )?.group;

    setSelection((prev) => ({
      ...prev,
      firm: firmName,
      office: nextOffice,
      group: nextGroup || prev.group
    }));
    setFirmSearch(firmName);
    setIsFirmSelectorOpen(false);
    setError('');
    setResult(null);
  };

  const handleOfficeChange = (office) => {
    const nextOpportunity = opportunities.firms.find(
      (opportunity) => (opportunity.firm || opportunity.name) === selection.firm && opportunity.office === office
    );

    setSelection((prev) => ({
      ...prev,
      office,
      group: nextOpportunity?.group || prev.group
    }));
    setResult(null);
  };

  const setNetworking = (key, value) => {
    setProfile((prev) => ({
      ...prev,
      networking: {
        ...prev.networking,
        [key]: value
      }
    }));
  };

  const addActivity = () => {
    setProfile((prev) => ({ ...prev, activities: [...prev.activities, createActivity()] }));
  };

  const updateActivity = (id, key, value) => {
    setProfile((prev) => ({
      ...prev,
      activities: prev.activities.map((activity) => (activity.id === id ? { ...activity, [key]: value } : activity))
    }));
  };

  const removeActivity = (id) => {
    setProfile((prev) => ({ ...prev, activities: prev.activities.filter((activity) => activity.id !== id) }));
  };

  const addWorkExperience = () => {
    setProfile((prev) => ({ ...prev, workExperiences: [...prev.workExperiences, createWorkExperience()] }));
  };

  const updateWorkExperience = (id, key, value) => {
    setProfile((prev) => ({
      ...prev,
      workExperiences: prev.workExperiences.map((experience) => {
        if (experience.id !== id) return experience;

        if (key === 'experienceType') {
          return {
            id: experience.id,
            experienceType: value,
            ...defaultFollowUpValues(value),
            recency: experience.recency || 'Current / most recent'
          };
        }

        return { ...normalizeExperience(experience), [key]: value };
      })
    }));
  };

  const removeWorkExperience = (id) => {
    setProfile((prev) => ({ ...prev, workExperiences: prev.workExperiences.filter((experience) => experience.id !== id) }));
  };

  const goNext = () => {
    setError('');
    if (currentStep === 0 && !firmOptions.includes(selection.firm)) {
      setError('Select a bank from the search results before continuing.');
      return;
    }
    if (currentStep === 3 && !profile.school) {
      setError('Select a school from the search results or choose Other / Not Listed.');
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, stepTitles.length - 1));
  };

  const goBack = () => {
    setError('');
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const startOver = () => {
    setShowIntro(true);
    setCurrentStep(0);
    setProfile(defaultProfile);
    setResult(null);
    setLoading(false);
    setError('');
    setIsFirmSelectorOpen(false);
  };

  const handleFirmSearchChange = (value) => {
    setFirmSearch(value);
    setResult(null);
    setIsFirmSelectorOpen(true);

    if (!value.trim() || value !== selection.firm) {
      setSelection((prev) => ({
        ...prev,
        firm: '',
        office: '',
        group: 'Generalist'
      }));
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    const normalizedWorkExperiences = (profile.workExperiences || []).map(normalizeExperience);
    const profilePayload = {
      ...normalizeProfileForScoring(profile),
      school: schoolForPayload(profile.school),
      workExperiences: normalizedWorkExperiences,
      workType: normalizedWorkExperiences[0]?.experienceType || 'None'
    };
    const scoringPayload = {
      firmName: selection.firm,
      office: selection.office,
      group: selection.group,
      hireType: selection.hireType,
      profile: profilePayload
    };

    try {
      const [response] = await Promise.all([
        fetch('http://localhost:4000/api/interview-odds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scoringPayload)
        }),
        new Promise((resolve) => setTimeout(resolve, 1200))
      ]);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.details || errorData?.error || `Failed to calculate interview odds (${response.status})`);
      }

      const data = await response.json();
      setResult({
        ...data,
        movesNeedle: buildNeedleProjection(scoringPayload, opportunities.firms, data)
      });
    } catch (err) {
      console.error('Backend interview odds calculation failed. Falling back to local scoring.', err);

      try {
        const fallbackResult = scoreInterviewOddsLocally(scoringPayload, opportunities.firms);
        setResult({
          ...fallbackResult,
          movesNeedle: buildNeedleProjection(scoringPayload, opportunities.firms, fallbackResult)
        });
        setError('');
      } catch (fallbackErr) {
        console.error('Local interview odds calculation failed.', fallbackErr);
        const message = fallbackErr.message || err.message || 'Could not calculate interview odds.';
        setError(`Could not calculate interview odds: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <>
          <h2>Which bank and office are you targeting?</h2>
          <div className="grid">
            <label className="firm-search-field">
              <span>Firm</span>
              <div className="firm-autocomplete">
                <input
                  type="search"
                  value={firmSearch}
                  placeholder="Search for a bank..."
                  autoComplete="off"
                  onChange={(e) => handleFirmSearchChange(e.target.value)}
                  onFocus={() => setIsFirmSelectorOpen(Boolean(firmSearch.trim()))}
                  onBlur={() => setTimeout(() => setIsFirmSelectorOpen(false), 120)}
                />
                {isFirmSelectorOpen && firmSearch.trim() ? (
                  <div className="firm-autocomplete-menu">
                    {matchingFirmOptions.length ? (
                      matchingFirmOptions.map((firm) => (
                        <button type="button" key={firm} onMouseDown={(event) => event.preventDefault()} onClick={() => handleFirmChange(firm)}>
                          {firm}
                        </button>
                      ))
                    ) : (
                      <p>No matching banks found.</p>
                    )}
                  </div>
                ) : null}
              </div>
            </label>
            <label>
              <span>Office</span>
              <select value={selection.office} onChange={(e) => handleOfficeChange(e.target.value)} disabled={!selection.firm}>
                {officeOptions.map((office) => (
                  <option key={office} value={office}>
                    {office}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      );
    }

    if (currentStep === 1) {
      return (
        <>
          <h2>What type of role are you recruiting for?</h2>
          <div className="choice-grid">
            {['Summer Analyst', 'Lateral Hire', 'MBA Associate'].map((hireType) => (
              <button
                type="button"
                key={hireType}
                className={selection.hireType === hireType ? 'choice-card selected' : 'choice-card'}
                onClick={() => setSelection((prev) => ({ ...prev, hireType }))}
              >
                {hireType}
              </button>
            ))}
          </div>
        </>
      );
    }

    if (currentStep === 2) {
      return (
        <>
          <h2>Which group are you targeting?</h2>
          <label>
            <span>Group</span>
            <select value={selection.group} onChange={(e) => setSelection({ ...selection, group: e.target.value })}>
              {activeGroupOptions.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
        </>
      );
    }

    if (currentStep === 3) {
      return (
        <>
          <h2>Academic Info</h2>
          <div className="grid">
            <label className="school-search-field">
              <span>School</span>
              <SchoolAutocomplete value={profile.school} onChange={(school) => setProfile({ ...profile, school })} />
            </label>
            <NumberField
              label="GPA"
              value={profile.gpa}
              min={2}
              max={4}
              step={0.01}
              onChange={(value) => setProfile({ ...profile, gpa: value })}
            />
          </div>
        </>
      );
    }

    if (currentStep === 4) {
      return (
        <>
          <div className="section-heading">
            <h2>Extracurriculars & Leadership</h2>
            <button type="button" className="secondary" onClick={addActivity}>
              Add Activity
            </button>
          </div>
          <div className="activity-list">
            {profile.activities.map((activity, index) => (
              <article className="activity-card" key={activity.id}>
                <div className="activity-card-heading">
                  <h4>Activity {index + 1}</h4>
                  <button type="button" className="text-button" onClick={() => removeActivity(activity.id)}>
                    Remove
                  </button>
                </div>
                <label>
                  <span>Activity type</span>
                  <select value={activity.activityType} onChange={(e) => updateActivity(activity.id, 'activityType', e.target.value)}>
                    {activityTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {activityTypeLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Selectivity / resume signal</span>
                  <select value={activity.selectivity} onChange={(e) => updateActivity(activity.id, 'selectivity', e.target.value)}>
                    {selectivityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Leadership level</span>
                  <select value={activity.leadershipLevel} onChange={(e) => updateActivity(activity.id, 'leadershipLevel', e.target.value)}>
                    {leadershipOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </article>
            ))}
          </div>
        </>
      );
    }

    if (currentStep === 5) {
      return (
        <>
          <div className="section-heading">
            <h2>Prior Work / Internship Experience</h2>
            <button type="button" className="secondary" onClick={addWorkExperience}>
              Add Experience
            </button>
          </div>
          <div className="activity-list">
            {profile.workExperiences.map((experience, index) => {
              const normalizedExperience = normalizeExperience(experience);
              const followUps = experienceFollowUps[normalizedExperience.experienceType] || [];

              return (
              <article className="activity-card" key={experience.id}>
                <div className="activity-card-heading">
                  <h4>Experience {index + 1}</h4>
                  <button type="button" className="text-button" onClick={() => removeWorkExperience(experience.id)}>
                    Remove
                  </button>
                </div>
                <label>
                  <span>Experience category</span>
                  <select
                    value={normalizedExperience.experienceType}
                    onChange={(e) => updateWorkExperience(experience.id, 'experienceType', e.target.value)}
                  >
                    {workTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="experience-follow-up-panel">
                  <div className="experience-follow-up-grid">
                    {followUps.map((field) => (
                      <label key={field.key}>
                        <span>{field.label}</span>
                        <select
                          value={normalizedExperience[field.key] || field.options[0]}
                          onChange={(e) => updateWorkExperience(experience.id, field.key, e.target.value)}
                        >
                          {field.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                    <label>
                      <span>Timing</span>
                      <select
                        value={normalizedExperience.recency}
                        onChange={(e) => updateWorkExperience(experience.id, 'recency', e.target.value)}
                      >
                        {recencyOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        </>
      );
    }

    if (currentStep === 6) {
      return (
        <>
          <h2>Networking Info</h2>
          <div className="grid">
            <NumberField label="Initial chats" value={profile.networking.initialChats} onChange={(value) => setNetworking('initialChats', value)} />
            <NumberField label="Follow-ups" value={profile.networking.followUps} onChange={(value) => setNetworking('followUps', value)} />
            <NumberField
              label="Strong relationships"
              value={profile.networking.strongRelationships}
              onChange={(value) => setNetworking('strongRelationships', value)}
            />
            <NumberField label="Referrals" value={profile.networking.referrals} onChange={(value) => setNetworking('referrals', value)} />
            <label>
              <span>Strongest contact seniority</span>
              <select
                value={profile.networking.strongestContactSeniority}
                onChange={(e) => setNetworking('strongestContactSeniority', e.target.value)}
              >
                {seniorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Connection type</span>
              <select value={profile.networking.connectionType} onChange={(e) => setNetworking('connectionType', e.target.value)}>
                {connectionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      );
    }

    return (
      <>
        <h2>Review Your Inputs</h2>
        <div className="review-grid">
          <section>
            <h3>Opportunity</h3>
            <p>{selection.firm} · {selection.office} · {selection.group}</p>
            <p>{selection.hireType}</p>
          </section>
          <section>
            <h3>Academic Info</h3>
            <p>{schoolDisplayName(profile.school) || 'School not entered'}</p>
            <p>GPA: {profile.gpa}</p>
          </section>
          <section>
            <h3>Activities</h3>
            {profile.activities.map((activity) => (
              <p key={activity.id}>{activityTypeLabel(activity.activityType)} · {activity.selectivity} · {activity.leadershipLevel}</p>
            ))}
          </section>
          <section>
            <h3>Work Experience</h3>
            {profile.workExperiences.map((experience) => (
              <p key={experience.id}>{experienceSummary(experience)}</p>
            ))}
          </section>
          <section>
            <h3>Networking</h3>
            <p>
              {profile.networking.initialChats} chats · {profile.networking.followUps} follow-ups ·{' '}
              {profile.networking.strongRelationships} strong relationships · {profile.networking.referrals} referrals
            </p>
            <p>{profile.networking.strongestContactSeniority} · {profile.networking.connectionType}</p>
          </section>
        </div>
      </>
    );
  };

  if (showIntro) {
    return (
      <>
        <button type="button" className="back-button" onClick={onBack}>
          Back to Home
        </button>

        <section className="panel intro-panel">
          <div className="intro-content">
            <span className="feature-eyebrow">Firm-specific recruiting model</span>
            <h2>Interview Odds Calculator</h2>
            <p className="intro-subtitle">
              Estimate your likelihood of receiving an interview at a specific investment bank, office, and group based on your profile.
            </p>

            <div className="intro-copy">
              <p>This tool models recruiting competitiveness across firms, offices, and groups.</p>
              <p>It accounts for academics, experience, networking, and leadership signals in your profile.</p>
              <p>Results are directional and meant to guide your recruiting strategy, not predict outcomes with certainty.</p>
            </div>

            <ul className="intro-list">
              <li>Firm / office / group-specific analysis</li>
              <li>Nonlinear GPA and experience weighting</li>
              <li>Actionable feedback to improve your odds</li>
            </ul>

            <button type="button" className="primary intro-cta" onClick={() => setShowIntro(false)}>
              Get Started
            </button>
          </div>
        </section>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <button type="button" className="back-button" onClick={onBack}>
          Back to Home
        </button>
        <section className="panel survey-card thinking-card">
          <span className="feature-eyebrow">Analyzing your profile...</span>
          <h2>Comparing against firm, office, and group competitiveness...</h2>
        </section>
      </>
    );
  }

  if (result) {
    return (
      <>
        <div className="button-row">
          <button type="button" className="back-button" onClick={startOver}>
            Start Over
          </button>
          <button type="button" className="back-button" onClick={onBack}>
            Back to Home
          </button>
        </div>

        <section className={`panel odds-result ${status.className}`}>
          <div>
            <span className="feature-eyebrow">Estimated interview odds</span>
            <div className="odds-score-row">
              <h2>{result.likelihood}%</h2>
              <span className={`classification-pill ${status.className}`}>{status.label}</span>
            </div>
            <p>
              {result.hireType} · {result.opportunity.firm} · {result.opportunity.office} · {result.opportunity.group}
            </p>
            <p>{result.reason}</p>
          </div>

          <ScoreBreakdown scores={result.scoreBreakdown} />

          <div className="columns">
            <section>
              <h4>Strengths</h4>
              <ul>
                {result.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h4>Constraints / Gaps</h4>
              <ul>
                {result.gaps.length ? result.gaps.map((item) => <li key={item}>{item}</li>) : <li>No major gaps flagged for this opportunity.</li>}
              </ul>
            </section>

            <section>
              <h4>Action Steps</h4>
              <ul>
                {result.actionSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          {result.movesNeedle ? (
            <section className="needle-section">
              <div className="section-heading">
                <div>
                  <h3>What Moves the Needle</h3>
                  <p>Current odds: {result.movesNeedle.currentOdds}%</p>
                </div>
              </div>

              {result.movesNeedle.gpaConstraintNote ? <p className="needle-note">{result.movesNeedle.gpaConstraintNote}</p> : null}

              <ol className="needle-list">
                {result.movesNeedle.scenarios.length ? (
                  result.movesNeedle.scenarios.map((scenario) => (
                    <li key={scenario.title}>
                      <span>{scenario.title}</span>
                      <strong>Projected odds: {scenario.projectedOdds}%</strong>
                    </li>
                  ))
                ) : (
                  <li>
                    <span>Your current profile has fewer obvious single-step improvements. Keep executing the action steps above.</span>
                    <strong>Projected odds: {result.movesNeedle.currentOdds}%</strong>
                  </li>
                )}
              </ol>
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

      <section className="panel survey-card">
        <div className="survey-progress">
          <span>
            Step {currentStep + 1} of {stepTitles.length}
          </span>
          <strong>{stepTitles[currentStep]}</strong>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="survey-step">{renderStep()}</div>

        {error ? <p className="error">{error}</p> : null}

        <div className="survey-actions">
          {currentStep > 0 ? (
            <button type="button" className="secondary" onClick={goBack}>
              Back
            </button>
          ) : (
            <span />
          )}
          {currentStep < stepTitles.length - 1 ? (
            <button type="button" className="primary" onClick={goNext}>
              Next
            </button>
          ) : (
            <button type="button" className="primary" onClick={handleCalculate}>
              Calculate Interview Odds
            </button>
          )}
        </div>
      </section>
    </>
  );
}
