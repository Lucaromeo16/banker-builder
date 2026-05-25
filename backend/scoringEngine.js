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
  'Front office finance internship': 6.7,
  'Middle office finance internship': 5.8,
  'Back office / operations finance internship': 4.9,
  'Other internship': 4.4,
  'Part-time job': 3.6,
  'Campus job': 3.3,
  None: 1.2
};

const networkingLevels = [
  { key: 'analyst', label: 'Analyst Contacts', shortLabel: 'Analyst' },
  { key: 'associate', label: 'Associate Contacts', shortLabel: 'Associate' },
  { key: 'vpPlus', label: 'VP+ Contacts', shortLabel: 'VP+' }
];

const postGradHireTypes = new Set(['Lateral Hire', 'MBA Associate']);

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
  'Investment fund / student-run fund': 9.1,
  'Business fraternity': 6.5,
  'Social fraternity / sorority executive board': 6.2,
  'Scholars Group': 6.8,
  'Finance/business club': 5.8,
  'Consulting club': 5.3,
  'Entrepreneurship club': 5.7,
  'Non-business leadership organization': 4.8,
  Other: 3.2
};

const leadershipScores = {
  president: 7.2,
  vp: 6.4,
  VP: 6.4,
  treasurer: 6.4,
  'finance chair': 6.4,
  'committee lead': 5.4,
  member: 3,
  none: 0
};

const selectivityScores = {
  'highly selective': 9.2,
  selective: 7.2,
  moderate: 5.1,
  'open enrollment': 2.2
};

const relevanceScores = {
  high: 9,
  moderate: 6,
  low: 3.2,
  none: 1
};

const eliteFinanceActivityTypes = new Set(['Selective IB club', 'Investment fund / student-run fund']);
const financeRelevantActivityTypes = new Set(['Selective IB club', 'Investment fund / student-run fund', 'Finance/business club']);
const genericLeadershipActivityTypes = new Set([
  'Business fraternity',
  'Social fraternity / sorority executive board',
  'Non-business leadership organization'
]);
const meaningfulLeadershipLevels = new Set(['president', 'vp', 'VP', 'treasurer', 'finance chair', 'committee lead']);

export const groupOptions = opportunityGroups;

const profileWeights = {
  'Summer Analyst': {
    academic: 0.28,
    experience: 0.22,
    networking: 0.36,
    extracurricular: 0.14,
    baseDifficultyAdjustment: 0
  },
  'Undergrad Full-Time': {
    academic: 0.26,
    experience: 0.28,
    networking: 0.34,
    extracurricular: 0.12,
    baseDifficultyAdjustment: 0.75
  },
  'Lateral Hire': {
    academic: 0.14,
    experience: 0.52,
    networking: 0.3,
    extracurricular: 0.04,
    baseDifficultyAdjustment: 0.15
  },
  'MBA Associate': {
    academic: 0.34,
    experience: 0.44,
    networking: 0.18,
    extracurricular: 0.04,
    baseDifficultyAdjustment: 0.25
  }
};

const resumeProfileWeights = {
  academic: 0.4,
  experience: 0.36,
  extracurricular: 0.24
};

const yearsExperienceOptions = ['0-1 years', '1-2 years', '2-4 years', '4+ years'];
const dealExposureOptions = ['High transaction exposure', 'Moderate transaction exposure', 'Limited transaction exposure', 'No transaction exposure'];
const currentPlatformTierOptions = ['Elite / BB / EB Platform', 'Strong Institutional Platform', 'Middle Market / National Platform', 'Regional / Boutique Platform', 'Small / Unknown Platform'];

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

function isHyperEliteOpportunity(opportunity = {}, competitiveness = 0) {
  const firm = String(opportunity.firm || opportunity.name || '').toLowerCase();
  const group = String(opportunity.group || '').toLowerCase();
  const office = String(opportunity.office || opportunity.officeCity || '').toLowerCase();
  const eliteFirm = /(centerview|qatalyst|evercore|pjt|goldman sachs|morgan stanley|j\.p\. morgan)/.test(firm);
  const eliteGroup = /(restructuring|rssg|technology|tmt|financial sponsors|m&a)/.test(group);
  const eliteOffice = /(menlo park|new york|san francisco)/.test(office);

  return competitiveness >= 9 || (eliteFirm && eliteGroup) || (firm.includes('evercore') && office.includes('menlo')) || (eliteFirm && eliteOffice && competitiveness >= 8.7);
}

function gpaBand(gpa) {
  if (gpa >= 3.7) return 'strong';
  if (gpa >= 3.5) return 'baseline';
  if (gpa >= 3.3) return 'penalty';
  return 'severe';
}

function gpaToNonlinearScore(gpa, competitiveness) {
  const numericGpa = Number(gpa);
  if (!Number.isFinite(numericGpa)) return 0;
  const hyperPressure = competitiveness >= 8.9 ? 0.35 : 0;

  // GPA cliff: 3.5 is treated as a real screening breakpoint, with sub-3.3 near-disqualifying.
  if (numericGpa < 3.3) return clamp(0.7 + Math.max(numericGpa - 2.7, 0) * 1.8 - hyperPressure, 0.4, 2.1);
  if (numericGpa < 3.5) return clamp(2.2 + ((numericGpa - 3.3) / 0.2) * 2.1 - hyperPressure, 1.8, 4.4);
  if (numericGpa < 3.7) return clamp(5.6 + ((numericGpa - 3.5) / 0.2) * 1.4 - hyperPressure * 0.45, 5.1, 7.1);

  const cutoff = dynamicSoftCutoff(3.7, competitiveness);
  const aboveRange = 4 - cutoff;
  const normalizedAbove = (numericGpa - cutoff) / Math.max(aboveRange, 0.05);
  const diminishingBonus = Math.log1p(Math.max(normalizedAbove, 0) * 3) / Math.log(4);
  return clamp(8 + diminishingBonus * 1.9 - hyperPressure * 0.2, 7.8, 9.9);
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
  ],
  'Current Investment Banking Role': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Current Private Equity Role': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Current Consulting Role': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Current Corporate Development Role': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Current Corporate Finance / FP&A Role': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Current Big 4 / Accounting Role': [
    { key: 'platformTier', options: ['Big 4', 'National / Next Tier', 'Top 100', 'Local / Small Firm'] },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Current TAS / Valuation Role': [
    { key: 'platformTier', options: ['Big 4', 'National / Next Tier', 'Top 100', 'Local / Small Firm'] },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Current Commercial Banking Role': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Current Asset Management / HF / ER Role': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Current Industry / Operating Role': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Other Current Professional Role': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Investment Banking Analyst': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Private Equity': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  Consulting: [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Corporate Development': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Corporate Finance / FP&A': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Big 4 / Accounting': [
    { key: 'platformTier', options: ['Big 4', 'National / Next Tier', 'Top 100', 'Local / Small Firm'] },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'TAS / Valuation': [
    { key: 'platformTier', options: ['Big 4', 'National / Next Tier', 'Top 100', 'Local / Small Firm'] },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Commercial Banking': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Asset Management / Hedge Fund / Equity Research': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Industry / Operating Role': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
  ],
  'Other Professional Experience': [
    { key: 'platformTier', options: currentPlatformTierOptions },
    { key: 'yearsExperience', options: yearsExperienceOptions },
    { key: 'dealExposure', options: dealExposureOptions }
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

function financeInstitutionAdjustment(institutionType, roleCategory) {
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

function defaultFollowUpValues(experienceType) {
  return Object.fromEntries((experienceFollowUps[experienceType] || []).map((field) => [field.key, field.options[0]]));
}

function normalizeExperience(experience = {}) {
  const legacyFromExperienceType = legacyWorkTypeMap[String(experience.experienceType || '').toLowerCase()];
  if (legacyFromExperienceType) {
    return {
      ...defaultFollowUpValues(legacyFromExperienceType.experienceType),
      ...legacyFromExperienceType,
      ...experience,
      experienceType: legacyFromExperienceType.experienceType,
      recency: experience.recency || 'Current / most recent'
    };
  }

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
  if (['Summer Analyst', 'Undergrad Full-Time'].includes(hireType)) return recency === 'Past 1-2 years' ? 0.95 : 0.86;
  if (hireType === 'MBA Associate') return recency === 'Past 1-2 years' ? 0.25 : 0.08;
  return recency === 'Past 1-2 years' ? 0.76 : 0.48;
}

function scoreProfessionalExperience(experience, hireType) {
  const type = experience.experienceType;
  const signals = new Set();
  const affinities = new Set();
  let eliteIb = false;
  const platform = {
    'Elite / BB / EB Platform': 1.1,
    'Strong Institutional Platform': 0.65,
    'Middle Market / National Platform': 0.25,
    'Regional / Boutique Platform': -0.2,
    'Small / Unknown Platform': -0.6,
    'Big 4': 0.7,
    'National / Next Tier': 0.25,
    'Top 100': -0.15,
    'Local / Small Firm': -0.6
  }[experience.platformTier] ?? 0;
  const years = { '0-1 years': -0.25, '1-2 years': 0.15, '2-4 years': 0.45, '4+ years': 0.35 }[experience.yearsExperience] ?? 0.15;
  const exposure = {
    'High transaction exposure': 0.85,
    'Moderate transaction exposure': 0.35,
    'Limited transaction exposure': -0.1,
    'No transaction exposure': -0.55
  }[experience.dealExposure] ?? 0.2;
  let base = 5.2;

  if (['Current Investment Banking Role', 'Investment Banking Analyst'].includes(type)) {
    base = hireType === 'MBA Associate' ? 9 : 9.3;
    eliteIb = experience.platformTier === 'Elite / BB / EB Platform';
    signals.add(hireType === 'MBA Associate' ? 'pre-MBA investment banking experience' : 'current investment banking role');
    ['M&A', 'Financial Sponsors', 'Generalist'].forEach((target) => affinities.add(target));
  } else if (['Current Private Equity Role', 'Private Equity'].includes(type)) {
    base = 8.4;
    signals.add('private equity experience');
    affinities.add('Financial Sponsors');
  } else if (['Current Consulting Role', 'Consulting'].includes(type)) {
    base = 7.4;
    signals.add('consulting experience');
    ['M&A', 'Generalist', 'Strategic Advisory'].forEach((target) => affinities.add(target));
  } else if (['Current Corporate Development Role', 'Corporate Development'].includes(type)) {
    base = 7.8;
    signals.add('corporate development experience');
    affinities.add('M&A');
  } else if (['Current Corporate Finance / FP&A Role', 'Corporate Finance / FP&A'].includes(type)) {
    base = 6.6;
    signals.add('corporate finance experience');
  } else if (['Current Big 4 / Accounting Role', 'Big 4 / Accounting'].includes(type)) {
    base = 6.4;
    signals.add('accounting experience');
    affinities.add('Financial Institutions');
  } else if (['Current TAS / Valuation Role', 'TAS / Valuation'].includes(type)) {
    base = 7.8;
    signals.add('TAS / valuation experience');
    ['M&A', 'Generalist'].forEach((target) => affinities.add(target));
  } else if (['Current Commercial Banking Role', 'Commercial Banking'].includes(type)) {
    base = 6.6;
    signals.add('commercial banking experience');
    ['DCM', 'LevFin', 'Financial Institutions'].forEach((target) => affinities.add(target));
  } else if (['Current Asset Management / HF / ER Role', 'Asset Management / Hedge Fund / Equity Research'].includes(type)) {
    base = 6.9;
    signals.add('public markets experience');
    ['Restructuring', 'Financial Sponsors'].forEach((target) => affinities.add(target));
  } else if (['Current Industry / Operating Role', 'Industry / Operating Role'].includes(type)) {
    base = 5.8;
    signals.add('industry operating experience');
  } else {
    base = 5.1;
    signals.add('professional experience');
  }

  return {
    score: clamp(base + platform + years + exposure),
    signals: Array.from(signals),
    affinities: Array.from(affinities),
    eliteIb
  };
}

function scoreSingleExperience(rawExperience, hireType) {
  const experience = normalizeExperience(rawExperience);
  if (['Lateral Hire', 'MBA Associate'].includes(hireType)) {
    return scoreProfessionalExperience(experience, hireType);
  }

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
  } else if (type === 'Front Office Finance Internship') {
    signals.add('front office finance experience');
    score = 6.65 + financeInstitutionAdjustment(experience.institutionType, type);
    ['DCM', 'Debt Capital Markets', 'ECM', 'Equity Capital Markets', 'Capital Markets', 'Financial Institutions', 'Generalist'].forEach((target) => affinities.add(target));
  } else if (type === 'Middle Office Finance Internship') {
    signals.add('middle office finance experience');
    score = 5.75 + financeInstitutionAdjustment(experience.institutionType, type);
    ['DCM', 'Debt Capital Markets', 'LevFin', 'Leveraged Finance', 'Financial Institutions'].forEach((target) => affinities.add(target));
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
    if (experience.generalType === 'Entrepreneurship / Startup') ['Technology', 'Strategic Advisory'].forEach((target) => affinities.add(target));
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
  const relevantExperiences = ['Lateral Hire', 'MBA Associate'].includes(hireType)
    ? sourceExperiences.slice(0, 1)
    : sourceExperiences;
  const experiences = relevantExperiences.map((experience) => scoreSingleExperience(experience, hireType));
  if (!experiences.length) return { score: workTypeScore(profile.workType), affinityBoost: 0, signals: [], eliteIb: false };

  const ranked = experiences.sort((a, b) => b.score - a.score);
  const primary = ranked[0];
  // Multi-experience cap: strongest experience dominates; extras help, but weak roles cannot stack into elite odds.
  const secondary = ['Lateral Hire', 'MBA Associate'].includes(hireType)
    ? 0
    : ranked.slice(1).reduce((sum, experience, index) => sum + experience.score * (index === 0 ? 0.22 : index === 1 ? 0.11 : 0.04), 0);
  const stackCap = primary.eliteIb ? 10 : primary.score >= 8.5 ? 9.35 : primary.score >= 7 ? 8.8 : 7.2;
  const normalizedTargetGroup = String(targetGroup || '');
  const affinityBoost = ranked.some((experience) => experience.affinities.includes(normalizedTargetGroup)) ? (primary.eliteIb ? 0.1 : 0.2) : 0;

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
    return profile.workExperiences.filter(Boolean);
  }

  if (profile.workType) {
    return [{ workType: profile.workType }];
  }

  return [{ workType: 'None' }];
}

function resumeExperienceScore(profile) {
  const ranked = normalizeWorkExperiences(profile)
    .map((experience) => scoreSingleExperience(experience, 'Summer Analyst').score)
    .sort((a, b) => b - a);

  if (!ranked.length) return workTypeScore('None');

  const primary = ranked[0];
  const incremental = ranked.slice(1).reduce((sum, score, index) => {
    const weight = index === 0 ? 0.24 : index === 1 ? 0.12 : 0.05;
    return sum + score * weight;
  }, 0);
  const stackCap = primary >= 9.5 ? 10 : primary >= 8.5 ? 9.35 : primary >= 7 ? 8.8 : 7.2;

  return clamp(Math.min(primary + incremental, stackCap), 0, 10);
}

function createDefaultNetworking() {
  return Object.fromEntries(networkingLevels.map((level) => [level.key, { initialChats: 0, strongRelationships: 0, referrals: 0 }]));
}

function legacyNetworkingLevelKey(seniority) {
  if (['vp', 'director', 'md', 'vp+'].includes(seniority)) return 'vpPlus';
  if (seniority === 'analyst') return 'analyst';
  return 'associate';
}

function normalizeNetworkingForScoring(networking = {}) {
  const source = networking.matrix || networking;
  const normalized = createDefaultNetworking();
  const hasMatrixValues = networkingLevels.some(({ key }) => source[key] && typeof source[key] === 'object');

  networkingLevels.forEach(({ key }) => {
    const level = source[key] || {};
    normalized[key] = {
      initialChats: Math.max(0, Number(level.initialChats || 0)),
      strongRelationships: Math.max(0, Number(level.strongRelationships || 0)),
      referrals: Math.max(0, Number(level.referrals || 0))
    };
  });

  if (!hasMatrixValues) {
    const fallbackLevel = legacyNetworkingLevelKey(source.strongestContactSeniority);
    normalized[fallbackLevel] = {
      initialChats: Math.max(0, Number(source.initialChats || 0) + Number(source.followUps || 0)),
      strongRelationships: Math.max(0, Number(source.strongRelationships || 0)),
      referrals: Math.max(0, Number(source.referrals || 0))
    };
  }

  return normalized;
}

function networkingRows(networking = {}) {
  const normalized = normalizeNetworkingForScoring(networking);
  return networkingLevels.map((level) => ({ ...level, ...(normalized[level.key] || {}) }));
}

function networkingTotals(networking = {}) {
  return networkingRows(networking).reduce(
    (totals, row) => ({
      initialChats: totals.initialChats + Number(row.initialChats || 0),
      strongRelationships: totals.strongRelationships + Number(row.strongRelationships || 0),
      referrals: totals.referrals + Number(row.referrals || 0)
    }),
    { initialChats: 0, strongRelationships: 0, referrals: 0 }
  );
}

function networkingStrength(networking = {}, metric) {
  const weights = {
    initialChats: { analyst: 0.08, associate: 0.12, vpPlus: 0.18 },
    strongRelationships: { analyst: 0.52, associate: 0.76, vpPlus: 1.14 },
    referrals: { analyst: 1.05, associate: 1.55, vpPlus: 2.35 }
  };

  return networkingRows(networking).reduce((sum, row) => {
    const count = Number(row[metric] || 0);
    if (!count) return sum;
    const diminishingCount = metric === 'initialChats'
      ? Math.min(count, 8) + Math.min(Math.max(count - 8, 0), 12) * 0.25
      : 1 + Math.min(Math.max(count - 1, 0), 2) * 0.45 + Math.min(Math.max(count - 3, 0), 3) * 0.18;
    return sum + diminishingCount * (weights[metric]?.[row.key] || 0);
  }, 0);
}

function bestNetworkingLevelWith(networking = {}, metric) {
  const rows = networkingRows(networking);
  if (Number(rows.find((row) => row.key === 'vpPlus')?.[metric] || 0) > 0) return 'vpPlus';
  if (Number(rows.find((row) => row.key === 'associate')?.[metric] || 0) > 0) return 'associate';
  if (Number(rows.find((row) => row.key === 'analyst')?.[metric] || 0) > 0) return 'analyst';
  return null;
}

function networkingScore(networking) {
  const chatStrength = networkingStrength(networking, 'initialChats');
  const relationshipStrength = networkingStrength(networking, 'strongRelationships');
  const referralStrength = networkingStrength(networking, 'referrals');
  return clamp(((chatStrength + relationshipStrength * 2.15 + referralStrength * 2.65) / 11.8) * 10);
}

function networkingConversionBoost(networking = {}, scores, adjustedCompetitiveness) {
  const hasCredibleBaseline = scores.gpaScore >= 4 && scores.experience >= 4.8;
  if (!hasCredibleBaseline) return 0;

  const referralStrength = networkingStrength(networking, 'referrals');
  const relationshipStrength = networkingStrength(networking, 'strongRelationships');
  const referralBoost = referralStrength > 0 ? Math.min(0.9, 0.22 + referralStrength * 0.2) : 0;
  const relationshipBoost = relationshipStrength > 0 ? Math.min(0.42, 0.1 + relationshipStrength * 0.11) : 0;
  const competitivenessDampener = adjustedCompetitiveness >= 8.8 ? 0.62 : adjustedCompetitiveness >= 8 ? 0.8 : 1;
  return Math.min(1.05, referralBoost + relationshipBoost) * competitivenessDampener;
}

function networkingLikelihoodFloor(networking = {}, scores, adjustedCompetitiveness) {
  const plausibleCandidate = scores.gpaScore >= 4.4 && scores.experience >= 4.8;
  if (!plausibleCandidate) return 3;

  const bestReferral = bestNetworkingLevelWith(networking, 'referrals');
  const bestRelationship = bestNetworkingLevelWith(networking, 'strongRelationships');
  const floorByCompetitiveness = (values) => {
    if (adjustedCompetitiveness >= 8.8) return values.hyper;
    if (adjustedCompetitiveness >= 8) return values.elite;
    if (adjustedCompetitiveness >= 7) return values.competitive;
    return values.accessible;
  };

  if (bestReferral) {
    const floors = {
      analyst: { hyper: 9, elite: 13, competitive: 19, accessible: 26 },
      associate: { hyper: 11, elite: 16, competitive: 24, accessible: 32 },
      vpPlus: { hyper: 14, elite: 21, competitive: 31, accessible: 40 }
    };
    const floor = floorByCompetitiveness(floors[bestReferral]);
    return scores.experience < 5.8 ? Math.min(floor, 18) : floor;
  }

  if (bestRelationship) {
    const floors = {
      analyst: { hyper: 6, elite: 9, competitive: 14, accessible: 19 },
      associate: { hyper: 8, elite: 12, competitive: 18, accessible: 24 },
      vpPlus: { hyper: 10, elite: 15, competitive: 23, accessible: 30 }
    };
    const floor = floorByCompetitiveness(floors[bestRelationship]);
    return scores.experience < 5.8 ? Math.min(floor, 14) : floor;
  }

  return 3;
}

function hasZeroNetworking(networking = {}) {
  const totals = networkingTotals(networking);
  return totals.initialChats === 0 && totals.strongRelationships === 0 && totals.referrals === 0;
}

function certificationScore(profile, hireType, targetGroup, experienceResult) {
  if (!postGradHireTypes.has(hireType)) return 0;

  const certifications = new Set(Array.isArray(profile.certifications) ? profile.certifications : []);
  if (!certifications.size) return 0;

  let boost = 0;
  if (certifications.has('CFA Charterholder')) boost += 0.55;
  else if (certifications.has('CFA Level II')) boost += 0.45;
  else if (certifications.has('CFA Level I')) boost += 0.24;

  if (certifications.has('CPA')) boost += 0.34;
  if (certifications.has('FRM')) boost += 0.32;
  if (certifications.has('CMA')) boost += 0.16;

  const seriesCount = ['Series 7', 'Series 63', 'Series 79'].filter((certification) => certifications.has(certification)).length;
  boost += Math.min(seriesCount * 0.12, 0.28);
  if (certifications.has('Other Relevant Certification')) boost += 0.1;

  const signalText = (experienceResult?.signals || []).join(' ').toLowerCase();
  const groupText = String(targetGroup || '').toLowerCase();
  if (certifications.has('CPA') && ['accounting', 'audit', 'tas', 'valuation'].some((signal) => signalText.includes(signal))) boost += 0.12;
  if (
    (certifications.has('CFA Charterholder') || certifications.has('CFA Level II') || certifications.has('CFA Level I')) &&
    (signalText.includes('public markets') || signalText.includes('asset management') || ['financial institutions', 'technology', 'healthcare', 'industrials', 'consumer'].some((term) => groupText.includes(term)))
  ) {
    boost += 0.12;
  }
  if (certifications.has('FRM') && (signalText.includes('risk') || groupText.includes('financial institutions') || groupText.includes('levfin') || groupText.includes('credit'))) {
    boost += 0.12;
  }

  return Math.min(boost, 0.85);
}

function zeroNetworkingAdjustment(profile, opportunity, scores) {
  if (!hasZeroNetworking(profile.networking)) return { penalty: 0, cap: 92 };

  const stars = Number(opportunity.competitivenessStars || 0);
  const strongCompensators = [
    scores.experienceResult.eliteIb,
    scores.experience >= 8.7,
    scores.schoolScore >= 8.5,
    scores.extracurricular >= 8
  ].filter(Boolean).length;
  const gpaDrag = profile.gpa < 3.7 && stars >= 3;
  const basePenalty = stars >= 4 ? 1.15 : stars >= 3 ? 0.85 : 0.45;
  const penalty = Math.max(0.25, basePenalty - strongCompensators * 0.18 + (gpaDrag ? 0.25 : 0));
  const cap = stars >= 4
    ? strongCompensators >= 2 ? 28 : 14
    : stars >= 3
      ? strongCompensators >= 2 ? 24 : 12
      : strongCompensators >= 2 ? 32 : 22;

  return { penalty, cap };
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
  const isEliteFinance = eliteFinanceActivityTypes.has(activity.activityType);
  const isFinanceRelevant = financeRelevantActivityTypes.has(activity.activityType);
  const hasMeaningfulLeadership = meaningfulLeadershipLevels.has(activity.leadershipLevel);

  const openEnrollmentMemberPenalty =
    activity.selectivity === 'open enrollment' &&
    (!activity.leadershipLevel || ['member', 'none'].includes(activity.leadershipLevel))
      ? 1.4
      : 0;
  const eliteFinanceBoost = isEliteFinance && activity.selectivity === 'highly selective' ? (hasMeaningfulLeadership ? 0.55 : 0.25) : 0;
  const financeRelevanceBoost = isFinanceRelevant && activity.businessRelevance === 'high' ? 0.2 : 0;
  const raw =
    type * 0.42 +
    selectivity * 0.2 +
    leadership * 0.18 +
    relevance * 0.2 +
    eliteFinanceBoost +
    financeRelevanceBoost -
    openEnrollmentMemberPenalty;
  const genericLeadershipCap = genericLeadershipActivityTypes.has(activity.activityType) && activity.businessRelevance !== 'high' ? 7.35 : 10;
  const scholarsCap = activity.activityType === 'Scholars Group' && activity.businessRelevance !== 'high' ? 7.6 : 10;

  return clamp(Math.min(raw, genericLeadershipCap, scholarsCap));
}

function extracurricularScore(profile) {
  const activities = normalizeActivities(profile).filter(Boolean);
  if (!activities.length) return 0;

  const ranked = activities.map(activityScore).sort((a, b) => b - a);
  const primary = ranked[0] ?? 0;
  const incremental = ranked.slice(1).reduce((sum, score, index) => {
    const weight = index === 0 ? 0.32 : index === 1 ? 0.14 : 0.05;
    return sum + score * weight;
  }, 0);
  const eliteFinanceCount = activities.filter((activity) => eliteFinanceActivityTypes.has(activity.activityType)).length;
  const financeRelevantCount = activities.filter((activity) => financeRelevantActivityTypes.has(activity.activityType)).length;
  const selectiveCount = activities.filter((activity) => ['highly selective', 'selective'].includes(activity.selectivity)).length;
  const leadershipCount = activities.filter((activity) => meaningfulLeadershipLevels.has(activity.leadershipLevel)).length;
  // Upper-end extracurricular scoring is intentionally nonlinear: strong generic leadership can score well,
  // but 9s and 10s require stacked recruiting-relevant finance signals, not titles alone.
  const stackCap =
    eliteFinanceCount >= 2 && leadershipCount >= 1 ? 10 :
    eliteFinanceCount >= 1 && financeRelevantCount >= 2 && selectiveCount >= 2 ? 9.65 :
    eliteFinanceCount >= 1 && (leadershipCount >= 1 || selectiveCount >= 2) ? 9.35 :
    financeRelevantCount >= 1 && leadershipCount >= 1 && selectiveCount >= 2 ? 9 :
    leadershipCount >= 1 && selectiveCount >= 1 ? 8.75 :
    primary >= 7 ? 8.35 :
    7.2;

  return clamp(Math.min(primary + incremental, stackCap), 0, 10);
}

function extracurricularScoreForHireType(profile, hireType) {
  if (['Summer Analyst', 'Undergrad Full-Time'].includes(hireType)) return extracurricularScore(profile);
  return 5.5;
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

function applyGates({
  classification,
  gpa,
  networking,
  experience,
  competitiveness,
  gpaScore,
  schoolScore,
  extracurricular,
  experienceResult,
  hyperElite,
  zeroNetworking,
  calibratedInterviewOdds = false
}) {
  let updated = classification;
  const gateReasons = [];

  if (!calibratedInterviewOdds) {
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

  const compensators = [
    experience >= 8.4,
    networking >= 7,
    schoolScore >= 8,
    extracurricular >= 7,
    experienceResult?.eliteIb
  ].filter(Boolean).length;

  if (gpa < 3.3) {
    updated = 'Reach';
    gateReasons.push('GPA below 3.3 is a near-disqualifying screen for serious IB recruiting.');
  } else if (gpa < 3.5 && compensators < 3) {
    updated = 'Reach';
    gateReasons.push('GPA below 3.5 creates a major screening risk unless several strong compensators are present.');
  } else if (gpa < 3.5 && updated === 'Safety') {
    updated = 'Target';
    gateReasons.push('GPA below 3.5 still caps upside even with strong compensating signals.');
  }

  if (networking < 3.2 && competitiveness > 8.0 && updated !== 'Reach') {
    updated = 'Reach';
    gateReasons.push('Low networking activity reduces interview conversion at competitive firms.');
  }

  if (zeroNetworking && competitiveness >= 7 && updated !== 'Reach') {
    updated = 'Reach';
    gateReasons.push('Networking is currently a major constraint for this opportunity.');
  }

  if (networking < 1.5 && experience < 8.8 && updated !== 'Reach') {
    updated = 'Reach';
    gateReasons.push('Very limited networking makes interview conversion difficult without an elite internship signal.');
  }

  if (experience < 4.5 && competitiveness >= 8.5 && updated === 'Safety') {
    updated = 'Target';
    gateReasons.push('Limited deal-relevant experience caps upside for top-tier roles.');
  }

  if (experience < 6 && extracurricular >= 8 && competitiveness >= 8 && updated === 'Safety') {
    updated = 'Target';
    gateReasons.push('Leadership helps the story but cannot substitute for finance internship experience at this level.');
  }

  if ((gpaScore < 4.5 || gpa < 3.6) && (competitiveness >= 8.8 || hyperElite) && updated !== 'Reach') {
    updated = 'Reach';
    gateReasons.push('GPA profile is below this office\'s heightened screen.');
  }

  return { classification: updated, gateReasons };
}

function buildStrengths(scoreBreakdown, profile, hireType = 'Summer Analyst') {
  const strengths = [];
  if (scoreBreakdown.networking >= 7) strengths.push('Strong networking engine with meaningful touchpoints and relationship depth.');
  if (scoreBreakdown.experience >= 7) strengths.push('Experience profile signals credible deal-readiness and relevant exposure.');
  if (scoreBreakdown.academic >= 7) strengths.push('Academic profile clears most resume screens for IB analyst recruiting.');
  if (scoreBreakdown.extracurricular >= 7) {
    strengths.push(
      hireType === 'Summer Analyst'
        ? 'Activities & Leadership show credible operating responsibility and campus signal.'
        : 'Professional leadership and trajectory show credible responsibility beyond core work experience.'
    );
  }
  if (profile.preferredLocations?.length) strengths.push(`Clear office preference (${profile.preferredLocations.join(', ')}) helps focus outreach.`);
  return strengths.slice(0, 3);
}

function buildGaps(scoreBreakdown, gateReasons, hireType = 'Summer Analyst') {
  const gaps = [...gateReasons];
  if (scoreBreakdown.networking < 6) gaps.push('Networking volume and referral depth should be built further.');
  if (scoreBreakdown.experience < 6) gaps.push('Experience quality needs stronger transaction or valuation exposure.');
  if (scoreBreakdown.academic < 6) gaps.push('Academic profile is below average for top investment banking pipelines.');
  if (scoreBreakdown.extracurricular < 5) {
    gaps.push(
      hireType === 'Summer Analyst'
        ? 'Activities & Leadership signal is light; selective finance groups or real operating roles would help.'
        : 'Professional leadership signal is light; stronger ownership, promotions, or deal responsibility would help.'
    );
  }
  return [...new Set(gaps)].slice(0, 3);
}

function buildActionSteps(scoreBreakdown, profile, { includeFinanceChair = true, hireType = 'Summer Analyst' } = {}) {
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
      hireType === 'Summer Analyst'
        ? includeFinanceChair
          ? 'Pursue a selective finance activity or a President, VP, Treasurer, or Finance Chair role with measurable responsibility.'
          : 'Pursue a selective finance activity or a President, VP, or Treasurer role with measurable responsibility.'
        : 'Build clearer professional leadership evidence through deal ownership, stronger manager feedback, or expanded responsibility.'
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
  targetGroup = 'Generalist',
  opportunity = {}
) {
  const hyperElite = isHyperEliteOpportunity(opportunity, competitiveness);
  const schoolScore = schoolToScore(profile.school || '');
  const gpaScore = gpaToNonlinearScore(profile.gpa, competitiveness);
  const experienceResult = structuredExperienceScore(profile, hireType, targetGroup);
  const experience = experienceResult.score;
  const honorsBoost = ['Summer Analyst', 'Undergrad Full-Time'].includes(hireType) && profile.honorsCollege ? 0.15 : 0;
  const graduationHonorsBoost = hireType === 'Lateral Hire'
    ? { None: 0, 'Cum Laude': 0.12, 'Magna Cum Laude': 0.22, 'Summa Cum Laude': 0.32 }[profile.graduationHonors] ?? 0
    : 0;
  const gmatBoost = hireType === 'MBA Associate'
    ? { '600-649': 0.05, '650-699': 0.14, '700-729': 0.25, '730-759': hyperElite ? 0.42 : 0.34, '760+': hyperElite ? 0.58 : 0.45 }[profile.gmatRange] ?? 0
    : 0;
  const schoolWeight = hireType === 'MBA Associate'
    ? hyperElite ? 0.62 : 0.56
    : hyperElite ? 0.5 : experienceResult.eliteIb ? 0.32 : experience >= 8.5 ? 0.36 : experience >= 7 ? 0.42 : 0.48;
  const academic = clamp(schoolScore * schoolWeight + gpaScore * (1 - schoolWeight) + honorsBoost + graduationHonorsBoost + gmatBoost);
  const networking = networkingScore(profile.networking);
  const extracurricular = extracurricularScoreForHireType(profile, hireType);
  const certificationBoost = certificationScore(profile, hireType, targetGroup, experienceResult);
  // Hyper-elite group amplification: top groups compress merely good profiles and reward pedigree, GPA, and elite internships.
  const effectiveWeights = hyperElite
    ? {
        academic: weights.academic + 0.04,
        experience: weights.experience + 0.04,
        networking: Math.max(weights.networking - 0.06, 0.18),
        extracurricular: Math.max(weights.extracurricular - 0.02, 0.05)
      }
    : weights;
  // Elite IB override: when minimum professionalism signals clear, elite direct IB receives a modest readiness lift.
  const eliteReadinessBoost =
    experienceResult.eliteIb && profile.gpa >= 3.5 && networking >= 3.2 && extracurricular >= 4.5
      ? hyperElite ? 0.18 : 0.35
      : 0;

  const total = clamp(
    academic * effectiveWeights.academic +
      experience * effectiveWeights.experience +
      networking * effectiveWeights.networking +
      extracurricular * effectiveWeights.extracurricular +
      eliteReadinessBoost +
      certificationBoost
  );

  return {
    schoolScore,
    gpaScore,
    academic,
    experience,
    networking,
    extracurricular,
    certificationBoost,
    total,
    experienceResult,
    hyperElite
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

  if (hireType === 'Undergrad Full-Time') {
    if (experience < 7) adjustment += 0.35;
    if (networkingTotals(profile.networking).referrals <= 0) adjustment += 0.25;
    if (experience >= 8.5) adjustment -= 0.18;
  }

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
        officeId: opportunity.officeId,
        firm: opportunity.firm,
        office: opportunity.office,
        officeCity: opportunity.officeCity,
        state: opportunity.state,
        group: opportunity.group,
        tier: opportunity.tier,
        type: opportunity.type,
        latitude: opportunity.latitude,
        longitude: opportunity.longitude,
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
  const scores = profileScores(profile, adjustedCompetitiveness, weights, hireType, opportunity.group, opportunity);
  const regionalBoost = regionalAlignmentBoost(profile, opportunity, scores, adjustedCompetitiveness);
  const zeroNetworking = hasZeroNetworking(profile.networking);
  const zeroNetworkingEffect = zeroNetworkingAdjustment(profile, opportunity, scores);
  const relationshipBoost = networkingConversionBoost(profile.networking, scores, adjustedCompetitiveness);
  const boostedTotal = clamp(scores.total + regionalBoost.points + relationshipBoost - zeroNetworkingEffect.penalty);
  const delta = boostedTotal - adjustedCompetitiveness;
  const unboostedDelta = scores.total - adjustedCompetitiveness;
  const likelihoodSlope = scores.hyperElite ? 1.35 : 1.15;
  const unboostedLikelihood = 100 / (1 + Math.exp(-likelihoodSlope * (unboostedDelta + 0.1)));
  const rawLikelihood = 100 / (1 + Math.exp(-likelihoodSlope * (delta + 0.1)));
  const gpaCap = profile.gpa < 3.3 ? 18 : profile.gpa < 3.5 ? 42 : 92;
  const noNetworkingCap = scores.networking < 1.5 && !scores.experienceResult.eliteIb ? 32 : 92;
  const weakExperienceCap = scores.experience < 5 && adjustedCompetitiveness >= 8.5 ? 38 : 92;
  const eliteIbFloor =
    scores.experienceResult.eliteIb && profile.gpa >= 3.5 && scores.networking >= 3.2 && scores.extracurricular >= 4.5
      ? scores.hyperElite ? 48 : 58
      : 3;
  const relationshipFloor = networkingLikelihoodFloor(profile.networking, scores, adjustedCompetitiveness);
  const likelihood = Math.round(
    Math.max(
      eliteIbFloor,
      relationshipFloor,
      Math.min(gpaCap, noNetworkingCap, zeroNetworkingEffect.cap, weakExperienceCap, 92, Math.min(rawLikelihood, unboostedLikelihood + 7))
    )
  );
  const classification = baseClassification(delta);
  const gateResult = applyGates({
    classification,
    gpa: profile.gpa,
    networking: scores.networking,
    experience: scores.experience,
    competitiveness: adjustedCompetitiveness,
    gpaScore: scores.gpaScore,
    schoolScore: scores.schoolScore,
    extracurricular: scores.extracurricular,
    experienceResult: scores.experienceResult,
    hyperElite: scores.hyperElite,
    zeroNetworking,
    calibratedInterviewOdds: true
  });
  const finalClassification =
    eliteIbFloor >= 48 && gateResult.classification === 'Reach' && !gateResult.gateReasons.length
      ? 'Target'
      : gateResult.classification;

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
  const gpaReason =
    gpaBand(profile.gpa) === 'strong'
      ? ' Your GPA is above the main IB screening threshold.'
      : gpaBand(profile.gpa) === 'baseline'
        ? ' Your GPA clears the baseline screen but is not a major differentiator.'
        : ' Your GPA is a key constraint for this process.';
  const networkingReason =
    zeroNetworking
      ? ' Networking is currently a major constraint for this opportunity.'
      : scores.networking >= 7
      ? ' Networking depth is a strength.'
      : scores.networking >= 4
        ? ' Networking is credible but could be deeper.'
        : ' Networking is currently a limiting factor.';
  const hyperReason = scores.hyperElite
    ? ' This is a hyper-competitive target, so pedigree, GPA, and elite internship signals are weighted more heavily.'
    : '';

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
    classification: finalClassification,
    confidence: confidenceFromDelta(delta),
    scoreBreakdown,
    strengths: buildStrengths(scoreBreakdown, profile, hireType),
    gaps: buildGaps(scoreBreakdown, gateResult.gateReasons, hireType),
    actionSteps: buildActionSteps(scoreBreakdown, profile, { includeFinanceChair: false, hireType }),
    reason: `Your total score (${boostedTotal.toFixed(2)}) is ${delta >= 0 ? 'above' : 'below'} this ${hireType} ${opportunity.group} opportunity's adjusted benchmark (${adjustedCompetitiveness.toFixed(1)}).${gpaReason}${networkingReason}${regionalReason}${experienceReason}${hyperReason}`
  };
}
