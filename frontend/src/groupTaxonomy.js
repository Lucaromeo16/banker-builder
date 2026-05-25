export function normalizeGroupName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const canonicalGroupSynonyms = {
  DCM: [
    'DCM',
    'Debt Capital Markets',
    'Debt Finance',
    'Debt Finance Banking',
    'Debt Advisory',
    'Credit Capital Markets',
    'Investment Grade Finance',
    'Loan Capital Markets',
    'Bond Origination'
  ],
  'Leveraged Finance': [
    'Leveraged Finance',
    'LevFin',
    'Acquisition Finance',
    'Sponsor Finance',
    'Leveraged Credit',
    'Non-Investment Grade Debt'
  ],
  Restructuring: [
    'Restructuring',
    'RX',
    'Financial Restructuring',
    'Distressed Advisory',
    'Distressed',
    'Special Situations',
    'Liability Management'
  ],
  'Financial Sponsors': [
    'Financial Sponsors',
    'Sponsors',
    'Sponsor Coverage',
    'Private Equity Coverage'
  ],
  Technology: [
    'Technology',
    'Software',
    'FinTech',
    'Internet'
  ],
  Energy: [
    'Energy',
    'Power & Utilities',
    'Natural Resources',
    'Infrastructure Energy'
  ],
  'Capital Markets': [
    'Capital Markets',
    'Capital Markets Advisory',
    'Capital Raising'
  ],
  Credit: [
    'Credit',
    'Structured Finance'
  ],
  'M&A': [
    'M&A',
    'M&A Advisory',
    'Middle Market M&A',
    'Cross-Border M&A'
  ],
  ECM: [
    'ECM',
    'Equity Capital Markets'
  ],
  Healthcare: [
    'Healthcare',
    'Healthcare Services',
    'Healthcare M&A',
    'Healthcare IT',
    'Biopharma',
    'Biotech',
    'MedTech',
    'Life Sciences'
  ],
  Industrials: [
    'Industrials',
    'Diversified Industrials',
    'Manufacturing',
    'Aerospace & Defense',
    'Automotive',
    'Transportation & Logistics'
  ],
  'Consumer & Retail': [
    'Consumer/Retail',
    'Consumer & Retail',
    'Consumer'
  ],
  FIG: [
    'FIG',
    'Financial Institutions'
  ],
  'Real Estate': [
    'Real Estate'
  ],
  'Public Finance': [
    'Public Finance'
  ],
  Infrastructure: [
    'Infrastructure'
  ],
  Power: [
    'Power'
  ],
  Generalist: [
    'Generalist'
  ]
};

export const canonicalGroupMap = Object.fromEntries(
  Object.entries(canonicalGroupSynonyms).flatMap(([canonicalGroup, synonyms]) =>
    synonyms.map((synonym) => [normalizeGroupName(synonym), canonicalGroup])
  )
);

export const groupAdjacencyMap = {
  DCM: [],
  'Leveraged Finance': [],
  Restructuring: [],
  'Financial Sponsors': ['M&A', 'Leveraged Finance'],
  Technology: [],
  Energy: ['Infrastructure', 'Power']
};

function approvedAdjacentMatch(selectedGroup, canonicalGroup, rawGroup) {
  const normalized = normalizeGroupName(rawGroup);

  if (!(groupAdjacencyMap[selectedGroup] || []).includes(canonicalGroup)) return false;

  if (selectedGroup === 'Financial Sponsors') {
    return normalized.includes('sponsor') || normalized.includes('private equity');
  }

  if (selectedGroup === 'Energy') {
    return normalized.includes('power') || normalized.includes('infrastructure energy');
  }

  return false;
}

export function canonicalGroupForRaw(rawGroup) {
  const normalized = normalizeGroupName(rawGroup);
  return canonicalGroupMap[normalized] || null;
}

export function selectedCanonicalGroups(interests = []) {
  return new Set(
    interests
      .map((interest) => canonicalGroupForRaw(interest))
      .filter(Boolean)
  );
}

export function hasBroadGroupInterest(interests = []) {
  return interests.includes('Not sure yet') || interests.includes('Generalist');
}

function isPlausiblyFinanceRelevantGroup(rawGroup) {
  const normalized = normalizeGroupName(rawGroup);
  if (!normalized) return false;
  if (canonicalGroupMap[normalized]) return true;

  return [
    'advisory',
    'banking',
    'capital',
    'finance',
    'financial',
    'investment',
    'm&a',
    'markets',
    'private',
    'strategic',
    'transaction',
    'valuation'
  ].some((keyword) => normalized.includes(keyword));
}

export function groupMatchForInterests(rawGroup, interests = []) {
  const canonicalGroup = canonicalGroupForRaw(rawGroup);

  if (!interests.length || hasBroadGroupInterest(interests)) {
    return {
      rawGroup,
      canonicalGroup,
      eligible: Boolean(canonicalGroup) || isPlausiblyFinanceRelevantGroup(rawGroup),
      matchType: canonicalGroup ? 'generalist' : 'generalist',
      selectedGroup: 'Generalist',
      score: canonicalGroup ? 1.4 : 0.55
    };
  }

  const selected = selectedCanonicalGroups(interests);
  if (!canonicalGroup || !selected.size) {
    return { rawGroup, canonicalGroup, eligible: false, matchType: 'none', selectedGroup: null, score: 0 };
  }

  if (selected.has(canonicalGroup)) {
    return { rawGroup, canonicalGroup, eligible: true, matchType: 'direct', selectedGroup: canonicalGroup, score: 3 };
  }

  const selectedAdjacentGroup = [...selected].find((selectedGroup) =>
    approvedAdjacentMatch(selectedGroup, canonicalGroup, rawGroup)
  );

  return {
    rawGroup,
    canonicalGroup,
    eligible: Boolean(selectedAdjacentGroup),
    matchType: selectedAdjacentGroup ? 'adjacent' : 'none',
    selectedGroup: selectedAdjacentGroup || null,
    score: selectedAdjacentGroup ? 1.25 : 0
  };
}
