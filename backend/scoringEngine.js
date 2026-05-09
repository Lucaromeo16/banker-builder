import businessSchools from '../data/businessSchools.json' with { type: 'json' };
import { opportunities, opportunityGroups } from './firms.js';

const internshipBrandScores = {
  'bulge bracket / elite boutique IB': 10,
  'middle-market IB': 8.6,
  'small regional boutique IB': 7.1,
  'search fund / unpaid boutique IB': 5.7,
  none: 1.5
};

const exposureScores = {
  high: 10,
  moderate: 7,
  low: 4,
  none: 1
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
  rice: ['Houston'],
  'houston-bauer': ['Houston'],
  'smu-cox': ['Dallas'],
  'ohio-state-fisher': ['Columbus'],
  'cincinnati-lindner': ['Cincinnati'],
  'case-western-weatherhead': ['Cleveland'],
  'michigan-ross': ['Detroit'],
  'michigan-state-broad': ['Detroit'],
  uchicago: ['Chicago'],
  northwestern: ['Chicago'],
  'illinois-gies': ['Chicago'],
  'washu-olin': ['St. Louis'],
  'emory-goizueta': ['Atlanta'],
  'georgia-terry': ['Atlanta'],
  'georgia-tech-scheller': ['Atlanta'],
  vanderbilt: ['Nashville'],
  'unc-kenan-flagler': ['Raleigh', 'Charlotte'],
  duke: ['Raleigh', 'Charlotte'],
  'uva-mcintire': ['Washington', 'Richmond'],
  georgetown: ['Washington'],
  'maryland-smith': ['Washington', 'Baltimore'],
  'washington-foster': ['Seattle'],
  wisconsin: ['Milwaukee'],
  'minnesota-carlson': ['Minneapolis'],
  'florida-warrington': ['Miami', 'Tampa'],
  'miami-herbert': ['Miami'],
  'arizona-state-carey': ['Phoenix'],
  'denver-daniels': ['Denver'],
  'colorado-boulder-leeds': ['Denver']
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

const selectivityScores = {
  'highly selective': 10,
  selective: 8,
  moderate: 5.5,
  'open enrollment': 2.5
};

const relevanceScores = {
  high: 10,
  moderate: 6.5,
  low: 3.5,
  none: 1
};

export const groupOptions = opportunityGroups;

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

const resumeProfileWeights = {
  academic: 0.4,
  experience: 0.36,
  extracurricular: 0.24
};

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

function comparableLocation(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/,\s*[a-z]{2}$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function locationsMatch(office, preference) {
  return comparableLocation(office) === comparableLocation(preference);
}

function schoolToScore(school) {
  const fallbackSchool = businessSchools.find((entry) => entry.id === 'other-not-listed');

  if (school && typeof school === 'object') {
    const matched = businessSchools.find((entry) => entry.id === school.id) || school;
    const ibStrength = Number(matched.ibStrength);
    const financePrestige = Number(matched.financePrestige);

    if (!Number.isFinite(ibStrength)) return fallbackSchool?.ibStrength ?? 4.5;
    if (!Number.isFinite(financePrestige)) return ibStrength;

    return ibStrength * 0.75 + financePrestige * 0.25;
  }

  const normalized = String(school || '').trim().toLowerCase();
  if (!normalized) return fallbackSchool?.ibStrength ?? 4.5;

  const matched = businessSchools.find(
    (entry) =>
      entry.name.toLowerCase() === normalized ||
      entry.shortName.toLowerCase() === normalized ||
      entry.university.toLowerCase() === normalized
  );
  const selectedSchool = matched || fallbackSchool;
  return (selectedSchool.ibStrength * 0.75) + (selectedSchool.financePrestige * 0.25);
}

function dynamicSoftCutoff(baseCutoff, competitiveness) {
  return clamp(baseCutoff + (competitiveness - 7.5) * 0.08, 3.45, 3.9);
}

function gpaToNonlinearScore(gpa, competitiveness) {
  const cutoff = dynamicSoftCutoff(3.7, competitiveness);

  if (gpa < 2.7) {
    return 0.5;
  }

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

function experienceScore(internshipType, exposureLevel) {
  const brand = internshipBrandScores[internshipType] ?? 3;
  const exposure = exposureScores[exposureLevel] ?? 2;
  return clamp(brand * 0.6 + exposure * 0.4);
}

function workTypeScore(workType) {
  return clamp(workTypeScores[workType] ?? workTypeScores['Other internship']);
}

const experienceFollowUps = {
  'Investment Banking Internship': [
    { key: 'firmTier', options: ['Elite Platform (BB / EB)', 'Strong MM', 'Middle Market', 'Regional Boutique', 'Small / Local Boutique'] }
  ],
  'Private Equity Internship': [
    { key: 'fundTier', options: ['Megafund', 'Upper Middle Market', 'Middle Market', 'Lower Middle Market', 'Independent Sponsor / Small Fund'] }
  ],
  'Accounting / Audit Internship': [
    { key: 'firmTier', options: ['Big 4', 'National / Next Tier', 'Top 100', 'Local / Small Firm'] },
    { key: 'function', options: ['Audit', 'Tax'] }
  ],
  'TAS / Business Valuation Internship': [
    { key: 'firmTier', options: ['Big 4', 'National / Next Tier', 'Top 100', 'Local / Small Firm'] }
  ],
  'Corporate Finance / Corporate Accounting Internship': [
    { key: 'companyPrestige', options: ['F100', 'F500', 'Large Private / Mid-Market', 'Small Company'] },
    { key: 'roleType', options: ['Corporate Development', 'Strategy / Finance Rotation', 'FP&A', 'Treasury', 'Corporate Accounting'] }
  ],
  'Consulting Internship': [
    { key: 'firmTier', options: ['MBB', 'Tier 2 Strategy Consulting', 'Big 4 Consulting', 'Middle Market / Boutique Consulting', 'Local / Small Consulting Firm'] }
  ],
  'Wealth Management Internship': [
    { key: 'platformTier', options: ['Elite / BB Platform', 'Large National Platform', 'Regional Platform', 'Local RIA / Small Practice'] }
  ],
  'Venture Capital Internship': [
    { key: 'fundTier', options: ['Top-Tier VC Fund', 'Established Institutional VC', 'Smaller VC Fund', 'Angel / Independent / Tiny Fund'] }
  ],
  'Other High Finance Internship': [
    { key: 'industry', options: ['Hedge Fund', 'Equity Research', 'Sales & Trading', 'Asset Management'] },
    { key: 'platformPrestige', options: ['Elite Platform', 'Strong Institutional Platform', 'Mid-Tier Platform', 'Small / Unknown Platform'] }
  ],
  'Commercial Banking Internship': [
    { key: 'platformTier', options: ['Bulge Bracket / Major Bank', 'Super-Regional / Strong National Bank', 'Regional Bank', 'Local / Community Bank'] }
  ],
  'Real Estate / CRE Internship': [
    { key: 'platformTier', options: ['Institutional Platform', 'Large Brokerage / Advisory Platform', 'Regional Firm', 'Small / Local Firm'] }
  ],
  'General / Other Experience': [
    { key: 'generalType', options: ['Part-Time Job', 'Campus Job', 'Leadership Program', 'Search Fund Internship', 'Student Research', 'Entrepreneurship / Startup', 'Military Experience', 'Other Internship'] }
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

function defaultFollowUpValues(experienceType) {
  return Object.fromEntries((experienceFollowUps[experienceType] || []).map((field) => [field.key, field.options[0]]));
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
    ['M&A', 'Financial Sponsors', 'Generalist'].forEach((target) => affinities.add(target));
  } else if (type === 'Private Equity Internship') {
    signals.add('private equity experience');
    score = { Megafund: 9.2, 'Upper Middle Market': 8.5, 'Middle Market': 8, 'Lower Middle Market': 7.4, 'Independent Sponsor / Small Fund': 6.7 }[experience.fundTier] ?? 7.8;
    affinities.add('Financial Sponsors');
  } else if (type === 'Accounting / Audit Internship') {
    signals.add('accounting internship');
    const tierScore = { 'Big 4': 6.9, 'National / Next Tier': 6.2, 'Top 100': 5.6, 'Local / Small Firm': 4.9 }[experience.firmTier] ?? 5.8;
    score = tierScore + (experience.function === 'Audit' ? 0.35 : -0.25);
    affinities.add('Financial Institutions');
  } else if (type === 'TAS / Business Valuation Internship') {
    signals.add('TAS / valuation experience');
    score = { 'Big 4': 8.1, 'National / Next Tier': 7.4, 'Top 100': 6.8, 'Local / Small Firm': 6.1 }[experience.firmTier] ?? 7.2;
    ['M&A', 'Generalist'].forEach((target) => affinities.add(target));
  } else if (type === 'Corporate Finance / Corporate Accounting Internship') {
    const prestige = { F100: 1, F500: 0.65, 'Large Private / Mid-Market': 0.25, 'Small Company': -0.25 }[experience.companyPrestige] ?? 0;
    const role = { 'Corporate Development': 7.6, 'Strategy / Finance Rotation': 6.8, 'FP&A': 6.1, Treasury: 5.9, 'Corporate Accounting': 5.2 }[experience.roleType] ?? 5.9;
    score = role + prestige;
    signals.add(experience.roleType === 'Corporate Development' ? 'corporate development experience' : 'corporate finance experience');
    if (experience.roleType === 'Corporate Development') affinities.add('M&A');
  } else if (type === 'Consulting Internship') {
    signals.add('consulting experience');
    score = { MBB: 8.3, 'Tier 2 Strategy Consulting': 7.6, 'Big 4 Consulting': 6.7, 'Middle Market / Boutique Consulting': 6.1, 'Local / Small Consulting Firm': 5.3 }[experience.firmTier] ?? 6.5;
    ['M&A', 'Generalist'].forEach((target) => affinities.add(target));
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
    ['DCM', 'Financial Institutions'].forEach((target) => affinities.add(target));
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
  const sourceExperiences = Array.isArray(profile.workExperiences) && profile.workExperiences.length
    ? profile.workExperiences
    : [{ workType: profile.workType || 'None' }];
  const experiences = sourceExperiences.map((experience) => scoreSingleExperience(experience, hireType));
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

function normalizeWorkExperiences(profile) {
  if (Array.isArray(profile.workExperiences)) {
    return profile.workExperiences
      .map((experience) => experience?.workType)
      .filter(Boolean);
  }

  if (profile.workType) {
    return [profile.workType];
  }

  return ['None'];
}

function resumeExperienceScore(profile) {
  const ranked = normalizeWorkExperiences(profile)
    .map(workTypeScore)
    .sort((a, b) => b - a);

  if (!ranked.length) return workTypeScore('None');

  const primary = ranked[0];
  const incremental = ranked.slice(1).reduce((sum, score, index) => {
    const weight = index === 0 ? 0.35 : index === 1 ? 0.2 : 0.1;
    return sum + score * weight;
  }, 0);

  return clamp(primary + incremental, 0, 10);
}

function networkingScore(networking) {
  const points =
    networking.initialChats * 1 +
    networking.followUps * 1.5 +
    networking.strongRelationships * 5 +
    networking.referrals * 7;

  const seniority = contactSeniorityMultiplier[networking.strongestContactSeniority] ?? 1;
  const connection = connectionMultiplier[networking.connectionType] ?? 1;

  const adjusted = points * seniority * connection;
  return clamp((adjusted / 120) * 10);
}

function normalizeActivities(profile) {
  if (Array.isArray(profile.activities)) {
    return profile.activities;
  }

  if (profile.clubType || profile.leadershipLevel) {
    return [
      {
        activityType:
          profile.clubType === 'IB club'
            ? 'Selective IB club'
            : profile.clubType === 'business org'
              ? 'Finance/business club'
              : profile.clubType === 'non-business org'
                ? 'Non-business leadership organization'
                : 'Other',
        selectivity: profile.clubType === 'none' ? 'open enrollment' : 'moderate',
        leadershipLevel: profile.leadershipLevel || 'none',
        businessRelevance: profile.clubType === 'non-business org' ? 'low' : 'moderate'
      }
    ];
  }

  return [];
}

function activityScore(activity) {
  const type = activityTypeScores[activity.activityType] ?? activityTypeScores.Other;
  const selectivity = selectivityScores[activity.selectivity] ?? 4;
  const leadership = leadershipScores[activity.leadershipLevel] ?? 0;
  const relevance = relevanceScores[activity.businessRelevance] ?? relevanceScores.moderate;

  const base = type * 0.33 + selectivity * 0.2 + leadership * 0.32 + relevance * 0.15;
  const openEnrollmentMemberPenalty =
    activity.selectivity === 'open enrollment' &&
    (!activity.leadershipLevel || ['member', 'none'].includes(activity.leadershipLevel))
      ? 1.6
      : 0;

  return clamp(base - openEnrollmentMemberPenalty);
}

function extracurricularScore(profile) {
  const activities = normalizeActivities(profile).filter(Boolean);
  if (!activities.length) return 0;

  const ranked = activities.map(activityScore).sort((a, b) => b - a);
  const primary = ranked[0] ?? 0;
  const secondary = ranked.slice(1).reduce((sum, score, index) => {
    const weight = index === 0 ? 0.45 : 0.25;
    return sum + score * weight;
  }, 0);

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
    gateReasons.push('GPA profile is below this office\'s adjusted soft cutoff.');
  }

  return { classification: updated, gateReasons };
}

function buildStrengths(scoreBreakdown, profile) {
  const strengths = [];
  if (scoreBreakdown.networking >= 7) strengths.push('Strong networking engine with meaningful touchpoints and relationship depth.');
  if (scoreBreakdown.experience >= 7) strengths.push('Experience profile signals credible deal-readiness and relevant exposure.');
  if (scoreBreakdown.academic >= 7) strengths.push('Academic profile clears most resume screens for IB analyst recruiting.');
  if (scoreBreakdown.extracurricular >= 7) strengths.push('Activities & Leadership show credible operating responsibility and campus signal.');
  if (profile.preferredLocations?.length) strengths.push(`Clear office preference (${profile.preferredLocations.join(', ')}) helps focus outreach.`);
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

function buildActionSteps(scoreBreakdown, profile, { includeFinanceChair = true } = {}) {
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
    steps.push(
      includeFinanceChair
        ? 'Pursue a selective finance activity or a President, VP, Treasurer, or Finance Chair role with measurable responsibility.'
        : 'Pursue a selective finance activity or a President, VP, or Treasurer role with measurable responsibility.'
    );
  }
  if (steps.length < 2) {
    steps.push('Target analysts/alumni in preferred offices for referral-oriented outreach with tailored firm-specific pitches.');
  }
  return steps.slice(0, 3);
}

function buildResumeActionSteps(scoreBreakdown, profile) {
  const steps = [];
  if (profile.gpa < 3.7) {
    steps.push('Raise academic signal via next-term GPA improvement and technical prep to offset transcript concerns.');
  }
  if (scoreBreakdown.experience < 7) {
    steps.push('Add stronger resume work experience through a finance internship, search fund role, or transaction-relevant project work.');
  }
  if (scoreBreakdown.extracurricular < 6) {
    steps.push('Pursue a selective finance activity or a President, VP, Treasurer, or Finance Chair role with measurable responsibility.');
  }
  if (steps.length < 2) {
    steps.push('Keep building resume proof points that show finance interest, analytical reps, and leadership responsibility.');
  }
  return steps.slice(0, 3);
}

function profileScores(
  profile,
  competitiveness = 8,
  weights = profileWeights['Summer Analyst'],
  hireType = 'Summer Analyst',
  targetGroup = 'Generalist'
) {
  const schoolScore = schoolToScore(profile.school || '');
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

  return {
    schoolScore,
    gpaScore,
    academic,
    experience,
    networking,
    extracurricular,
    total,
    experienceResult
  };
}

function resumeProfileScores(profile, competitiveness = 8) {
  const schoolScore = schoolToScore(profile.school || '');
  const gpaScore = gpaToNonlinearScore(profile.gpa, competitiveness);
  const academic = clamp(schoolScore * 0.45 + gpaScore * 0.55);
  const experience = resumeExperienceScore(profile);
  const extracurricular = extracurricularScore(profile);

  const total = clamp(
    academic * resumeProfileWeights.academic +
      experience * resumeProfileWeights.experience +
      extracurricular * resumeProfileWeights.extracurricular
  );

  return {
    schoolScore,
    gpaScore,
    academic,
    experience,
    extracurricular,
    total
  };
}

function hireTypeDifficultyAdjustment(hireType, profile) {
  const weights = profileWeights[hireType];
  const experience = structuredExperienceScore(profile, hireType, 'Generalist').score;
  const schoolScore = schoolToScore(profile.school || '');
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

export function scoreProfile(profile) {
  const baseScores = resumeProfileScores(profile);

  const results = opportunities
    .filter((opportunity) => {
      if (!profile.preferredLocations?.length) return true;
      return profile.preferredLocations.some((location) => locationsMatch(opportunity.office, location));
    })
    .map((opportunity) => {
      const {
        schoolScore,
        gpaScore,
        academic,
        experience,
        extracurricular,
        total
      } = resumeProfileScores(profile, opportunity.competitiveness);

      const delta = total - opportunity.competitiveness;
      const initialClass = baseClassification(delta);
      const { classification, gateReasons } = applyGates({
        classification: initialClass,
        gpa: profile.gpa,
        networking: 10,
        experience,
        competitiveness: opportunity.competitiveness,
        gpaScore
      });

      const scoreBreakdown = {
        academic: Number(academic.toFixed(2)),
        experience: Number(experience.toFixed(2)),
        extracurricular: Number(extracurricular.toFixed(2)),
        total: Number(total.toFixed(2)),
        school: Number(schoolScore.toFixed(2)),
        gpa: Number(gpaScore.toFixed(2))
      };

      return {
        id: opportunity.id,
        firm: opportunity.firm,
        office: opportunity.office,
        group: opportunity.group,
        tier: opportunity.tier,
        type: opportunity.type,
        competitiveness: opportunity.competitiveness,
        prestigeStars: opportunity.prestigeStars,
        payStars: opportunity.payStars,
        competitivenessStars: opportunity.competitivenessStars,
        classification,
        confidence: confidenceFromDelta(delta),
        scoreBreakdown,
        strengths: buildStrengths(scoreBreakdown, profile),
        gaps: buildGaps(scoreBreakdown, gateReasons),
        actionSteps: buildResumeActionSteps(scoreBreakdown, profile),
        reason: `Your total score (${total.toFixed(2)}) is ${delta >= 0 ? 'above' : 'below'} this opportunity's competitiveness benchmark (${opportunity.competitiveness.toFixed(1)}).`
      };
    })
    .sort((a, b) => b.competitiveness - a.competitiveness);

  return {
    profileSummary: {
      schoolScore: Number(baseScores.schoolScore.toFixed(2)),
      experience: Number(baseScores.experience.toFixed(2)),
      extracurricular: Number(baseScores.extracurricular.toFixed(2))
    },
    results
  };
}

export function scoreInterviewOdds({ profile, firmName, office, group, hireType = 'Summer Analyst' }) {
  const weights = profileWeights[hireType];
  if (!weights) {
    throw new Error('Unknown hire type.');
  }

  const opportunity = opportunities.find(
    (item) => item.firm === firmName && item.office === office && item.group === group
  );

  if (!opportunity) {
    throw new Error('Unknown firm, office, and group combination.');
  }

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
  const classification = baseClassification(delta);
  const gateResult = applyGates({
    classification,
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
    actionSteps: buildActionSteps(scoreBreakdown, profile, { includeFinanceChair: false }),
    reason: `Your total score (${boostedTotal.toFixed(2)}) is ${delta >= 0 ? 'above' : 'below'} this ${hireType} ${opportunity.group} opportunity's adjusted benchmark (${adjustedCompetitiveness.toFixed(1)}).${regionalReason}${experienceReason}`
  };
}
