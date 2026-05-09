import businessSchools from '../../data/businessSchools.json';

export const OTHER_SCHOOL_ID = 'other-not-listed';

export const defaultSchool = businessSchools[0];

export function schoolDisplayName(school) {
  if (!school) return '';
  if (typeof school === 'string') return school;
  return school.name || school.shortName || school.university || '';
}

export function findSchoolById(id) {
  return businessSchools.find((school) => school.id === id) || null;
}

export function normalizeSchoolSelection(school) {
  if (!school) return null;
  if (typeof school === 'object') {
    return findSchoolById(school.id) || school;
  }

  const normalized = String(school).trim().toLowerCase();
  if (!normalized) return null;

  return (
    businessSchools.find(
      (entry) =>
        entry.name.toLowerCase() === normalized ||
        entry.shortName.toLowerCase() === normalized ||
        entry.university.toLowerCase() === normalized
    ) || null
  );
}

export function schoolToScore(school) {
  const selectedSchool = normalizeSchoolSelection(school) || findSchoolById(OTHER_SCHOOL_ID);
  const ibStrength = Number(selectedSchool?.ibStrength);
  const financePrestige = Number(selectedSchool?.financePrestige);

  if (!Number.isFinite(ibStrength)) return 4.5;
  if (!Number.isFinite(financePrestige)) return ibStrength;

  return ibStrength * 0.75 + financePrestige * 0.25;
}

export function schoolMatchesSearch(school, searchTerm) {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return false;

  return [school.name, school.shortName, school.university, school.state, school.region]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
}

export function schoolForPayload(school) {
  const selectedSchool = normalizeSchoolSelection(school) || findSchoolById(OTHER_SCHOOL_ID);

  return {
    id: selectedSchool.id,
    name: selectedSchool.name,
    shortName: selectedSchool.shortName,
    university: selectedSchool.university,
    state: selectedSchool.state,
    region: selectedSchool.region,
    schoolTier: selectedSchool.schoolTier,
    ibStrength: selectedSchool.ibStrength,
    financePrestige: selectedSchool.financePrestige
  };
}
