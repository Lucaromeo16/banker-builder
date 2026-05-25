export const FIRM_TYPES = [
  'BB',
  'EB',
  'MM',
  'Specialized Boutique',
  'National LMM Boutique',
  'Regional Boutique',
  'Big 4 Corporate Finance'
];

export const ADDRESS_CONFIDENCE_VALUES = ['verified', 'needs verification', 'estimated'];

export const US_STATE_ABBREVIATIONS = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
  'DC'
];

export function slugifyFirmMapValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildOfficeId(office) {
  const parts = [office.firm, office.officeCity || office.city, office.state].map(slugifyFirmMapValue).filter(Boolean);
  return parts.join('-') || `office-${Date.now()}`;
}

export function validateFirmMapDataset(offices) {
  const errors = [];
  const warnings = [];
  const idCounts = new Map();
  const locationCounts = new Map();

  if (!Array.isArray(offices)) {
    return {
      isValid: false,
      errors: ['Dataset must be a JSON array of office records.'],
      warnings: [],
      counts: { offices: 0, firms: 0 }
    };
  }

  offices.forEach((office, index) => {
    const label = office?.id || `row ${index + 1}`;
    const firm = String(office?.firm || '').trim();
    const city = String(office?.officeCity || '').trim();
    const state = String(office?.state || '').trim().toUpperCase();
    const id = String(office?.id || '').trim();

    ['id', 'firm', 'officeCity', 'state', 'type', 'latitude', 'longitude'].forEach((field) => {
      if (office?.[field] === undefined || office?.[field] === null || String(office[field]).trim() === '') {
        errors.push(`${label}: missing required field "${field}".`);
      }
    });

    if (id) idCounts.set(id, (idCounts.get(id) || 0) + 1);
    if (firm && city && state) {
      const locationKey = `${firm.toLowerCase()}|${city.toLowerCase()}|${state}`;
      locationCounts.set(locationKey, (locationCounts.get(locationKey) || 0) + 1);
    }

    ['prestigeStars', 'payStars', 'competitivenessStars'].forEach((field) => {
      const rating = Number(office?.[field]);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        errors.push(`${label}: ${field} must be an integer from 1 to 5.`);
      }
    });

    const latitude = Number(office?.latitude);
    const longitude = Number(office?.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      errors.push(`${label}: latitude must be a valid number from -90 to 90.`);
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      errors.push(`${label}: longitude must be a valid number from -180 to 180.`);
    }

    if (!FIRM_TYPES.includes(office?.type)) {
      errors.push(`${label}: firm type must be one of ${FIRM_TYPES.join(', ')}.`);
    }

    if (!US_STATE_ABBREVIATIONS.includes(state)) {
      errors.push(`${label}: state must be a valid U.S. abbreviation.`);
    }

    if (office?.addressConfidence && !ADDRESS_CONFIDENCE_VALUES.includes(office.addressConfidence)) {
      errors.push(`${label}: addressConfidence must be one of ${ADDRESS_CONFIDENCE_VALUES.join(', ')}.`);
    }

    if (!office?.address) warnings.push(`${label}: address is blank.`);
    if (!Array.isArray(office?.groups)) errors.push(`${label}: groups must be an array.`);
  });

  idCounts.forEach((count, id) => {
    if (count > 1) errors.push(`Duplicate office id "${id}" appears ${count} times.`);
  });

  locationCounts.forEach((count, key) => {
    if (count > 1) {
      const [firm, city, state] = key.split('|');
      errors.push(`Duplicate firm-city-state combo: ${firm} / ${city} / ${state}.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    counts: {
      offices: offices.length,
      firms: new Set(offices.map((office) => office.firm).filter(Boolean)).size
    }
  };
}
