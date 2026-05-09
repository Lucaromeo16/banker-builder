import { useMemo, useState } from 'react';
import SchoolAutocomplete from './SchoolAutocomplete';
import ibOffices from '../../../data/ibOffices.json';
import { defaultSchool, schoolDisplayName, schoolForPayload, schoolToScore } from '../schoolScoring';

const stepTitles = [
  'IB Interest',
  'Location Preference',
  'Academic Info',
  'Prior Work / Internship Experience',
  'Leadership / Extracurriculars',
  'Recruiting Priorities',
  'Review Your Inputs'
];

const ibInterestOptions = [
  'M&A',
  'Restructuring',
  'Debt Capital Markets',
  'Equity Capital Markets',
  'Leveraged Finance',
  'Public Finance',
  'Financial Sponsors',
  'Healthcare',
  'Technology',
  'Industrials',
  'Consumer/Retail',
  'FIG',
  'Real Estate',
  'Energy',
  'Generalist',
  'Not sure yet'
];

const commonLocationLabels = [
  'New York, NY',
  'Chicago, IL',
  'Los Angeles, CA',
  'San Francisco, CA',
  'Boston, MA',
  'Charlotte, NC',
  'Atlanta, GA',
  'Dallas, TX',
  'Houston, TX',
  'Washington, DC',
  'Baltimore, MD'
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
  { value: 'finance chair', label: 'Finance Chair' },
  { value: 'committee lead', label: 'Committee Lead' },
  { value: 'member', label: 'Member' },
  { value: 'none', label: 'None' }
];

const locationStrengthOptions = [
  {
    value: 'Strict',
    title: 'Strict',
    description: 'Only show firms/offices in my selected location'
  },
  {
    value: 'Flexible',
    title: 'Flexible',
    description: 'Prioritize my selected location, but include strong matches elsewhere if needed'
  },
  {
    value: 'Open',
    title: 'Open',
    description: 'Location is a preference, not a constraint'
  }
];

const recruitingPriorityOptions = ['Low', 'Medium', 'High'];

const workTypeOptions = [
  'None',
  'Part-time job',
  'Campus job',
  'Search fund internship',
  'Corporate finance internship',
  'Accounting / audit internship',
  'Wealth management internship',
  'Private equity internship',
  'Investment banking internship',
  'Other finance internship',
  'Other internship'
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

const resumeProfileWeights = {
  academic: 0.4,
  experience: 0.36,
  extracurricular: 0.24
};

const interestToGroups = {
  'M&A': ['M&A'],
  'Restructuring': ['Restructuring'],
  'Debt Capital Markets': ['Financial Institutions', 'Financial Sponsors', 'Generalist'],
  'Equity Capital Markets': ['Technology', 'Healthcare', 'Generalist'],
  'Leveraged Finance': ['Financial Sponsors', 'M&A'],
  'Public Finance': ['Financial Institutions', 'Generalist'],
  'Financial Sponsors': ['Financial Sponsors'],
  'Healthcare': ['Healthcare', 'Healthcare Services'],
  'Technology': ['Technology'],
  'Industrials': ['Industrials'],
  'Consumer/Retail': ['Consumer & Retail'],
  'FIG': ['Financial Institutions'],
  'Real Estate': ['Real Estate', 'Generalist'],
  'Energy': ['Energy'],
  'Generalist': ['Generalist', 'M&A']
};

const createActivity = () => ({
  id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  activityType: 'Selective IB club',
  selectivity: 'selective',
  leadershipLevel: 'member'
});

const createWorkExperience = () => ({
  id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  workType: 'None'
});

const defaultProfile = {
  interests: ['Not sure yet'],
  locationPreference: 'No preference',
  locationPreferenceStrength: 'Flexible',
  prestigePreference: 'Medium',
  payPreference: 'Medium',
  school: defaultSchool,
  gpa: 3.7,
  workExperiences: [createWorkExperience()],
  activities: [createActivity()]
};

function officeLocationLabel(office) {
  return `${office.officeCity}, ${office.state}`;
}

function normalizeLocationLabel(value) {
  const compact = comparableLocation(value);
  if (compact === 'washington') return 'Washington, DC';

  const office = ibOffices.find((item) => comparableLocation(officeLocationLabel(item)) === compact || comparableLocation(item.officeCity) === compact);
  return office ? officeLocationLabel(office) : value;
}

function NumberField({ label, value, onChange, step = 1, min = 0, max = 100 }) {
  return (
    <label>
      <span>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function clamp(value, min = 0, max = 10) {
  return Math.max(min, Math.min(max, value));
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function createOpportunitiesFromOffices(offices = []) {
  return offices.flatMap((office) =>
    (office.groups || []).map((group) => {
      const competitiveness = clamp(office.competitivenessScore + (groupAdjustments[group] ?? 0));

      return {
        id: `${office.id}-${slugify(group)}`,
        officeId: office.id,
        firm: office.firm,
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

const localOpportunities = createOpportunitiesFromOffices(ibOffices);

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

function normalizeWorkExperiences(profile) {
  if (Array.isArray(profile.workExperiences)) {
    return profile.workExperiences.map((experience) => experience?.workType).filter(Boolean);
  }

  return profile.workType ? [profile.workType] : ['None'];
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
  const activities = Array.isArray(profile.activities) ? profile.activities.filter(Boolean) : [];
  if (!activities.length) return 0;

  const ranked = activities.map(activityScore).sort((a, b) => b - a);
  const primary = ranked[0] ?? 0;
  const secondary = ranked.slice(1).reduce((sum, score, index) => {
    const weight = index === 0 ? 0.45 : 0.25;
    return sum + score * weight;
  }, 0);

  return clamp(primary + secondary, 0, 10);
}

function resumeProfileScores(profile, competitiveness = 8) {
  const schoolScore = schoolToScore(profile.school);
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

function buildStrengths(scoreBreakdown, profile) {
  const strengths = [];
  if (scoreBreakdown.experience >= 7) strengths.push('Experience profile signals credible deal-readiness and relevant exposure.');
  if (scoreBreakdown.academic >= 7) strengths.push('Academic profile clears most resume screens for IB analyst recruiting.');
  if (scoreBreakdown.extracurricular >= 7) strengths.push('Activities & Leadership show credible operating responsibility and campus signal.');
  if (profile.preferredLocations?.length) strengths.push(`Clear office preference (${profile.preferredLocations.join(', ')}) helps focus outreach.`);
  return strengths.slice(0, 3);
}

function buildGaps(scoreBreakdown, gateReasons) {
  const gaps = [...gateReasons];
  if (scoreBreakdown.experience < 6) gaps.push('Experience quality needs stronger transaction or valuation exposure.');
  if (scoreBreakdown.academic < 6) gaps.push('Academic profile is below average for top investment banking pipelines.');
  if (scoreBreakdown.extracurricular < 5) gaps.push('Activities & Leadership signal is light; selective finance groups or real operating roles would help.');
  return [...new Set(gaps)].slice(0, 3);
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

function scoreProfileLocally(profile) {
  const baseScores = resumeProfileScores(profile);
  const results = localOpportunities
    .filter((opportunity) => {
      if (!profile.preferredLocations?.length) return true;
      return profile.preferredLocations.some((location) => locationsMatch(opportunity.office, location));
    })
    .map((opportunity) => {
      const { schoolScore, gpaScore, academic, experience, extracurricular, total } = resumeProfileScores(
        profile,
        opportunity.competitiveness
      );
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

function normalizeLocationPreference(profile) {
  return profile.locationPreference || 'No preference';
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

function groupInterestScore(group, interests) {
  if (interests.includes('Not sure yet')) {
    return ['Generalist', 'M&A', 'Healthcare', 'Technology', 'Industrials', 'Consumer & Retail', 'Financial Institutions'].includes(group)
      ? 2
      : 0.75;
  }

  const desiredGroups = interests.flatMap((interest) => interestToGroups[interest] || []);
  if (desiredGroups.includes(group)) return 3;
  if (group === 'M&A' && interests.some((interest) => ['Technology', 'Healthcare', 'Industrials', 'Consumer/Retail', 'Energy'].includes(interest))) return 1.25;
  return 0;
}

function locationScore(office, preference, strength) {
  if (!preference || preference === 'No preference') return 0.5;
  if (locationsMatch(office, preference)) {
    return strength === 'Open' ? 1.2 : 3;
  }

  return strength === 'Open' ? 0.35 : 0;
}

function profileFitScore(opportunity) {
  const total = opportunity.scoreBreakdown?.total || 0;
  const delta = Math.abs(total - opportunity.competitiveness);
  return Math.max(0, 4 - delta);
}

function confidenceScore(confidence) {
  const normalized = String(confidence || '').toLowerCase();
  if (normalized === 'high') return 1;
  if (normalized === 'medium') return 0.5;
  return 0;
}

function priorityPreferenceScore(stars, preference) {
  if (preference === 'High') return (stars || 0) * 0.18;
  if (preference === 'Medium') return (stars || 0) * 0.08;
  return 0;
}

function nextActionFor(category, opportunity) {
  if (category === 'Reach') {
    return `Prioritize warm networking in ${opportunity.office} and prepare a tight story for ${opportunity.group}.`;
  }
  if (category === 'Target') {
    return `Build two to three contacts and tailor your pitch around ${opportunity.group} exposure.`;
  }
  return `Use this as a conversion-oriented option and apply early with a clean, specific outreach note.`;
}

function categoryReason(category, opportunity, preference, strength) {
  const locationText =
    preference && preference !== 'No preference' && locationsMatch(opportunity.office, preference)
      ? ` It matches your ${preference} location preference.`
      : preference && preference !== 'No preference' && strength !== 'Strict'
        ? ` Your ${preference} location preference was treated ${strength === 'Flexible' ? 'flexibly' : 'lightly'} for this match.`
        : '';
  return `${opportunity.reason}${locationText} This is the best-fit ${opportunity.group} opportunity for ${opportunity.firm} after deduplicating by bank.`;
}

function buildTargetList(scoredResults, profile) {
  const preference = normalizeLocationPreference(profile);
  const strength = preference && preference !== 'No preference' ? profile.locationPreferenceStrength || 'Flexible' : 'Open';
  const isStrictLocation = preference && preference !== 'No preference' && strength === 'Strict';
  const candidateResults =
    isStrictLocation
      ? scoredResults.filter((opportunity) => locationsMatch(opportunity.office, preference))
      : scoredResults;

  const ranked = candidateResults
    .map((opportunity) => {
      const fitScore =
        groupInterestScore(opportunity.group, profile.interests) * 4 +
        locationScore(opportunity.office, preference, strength) * 2 +
        profileFitScore(opportunity) * 2 +
        confidenceScore(opportunity.confidence) +
        (opportunity.scoreBreakdown?.total || 0) * 0.25 +
        priorityPreferenceScore(opportunity.prestigeStars, profile.prestigePreference) +
        priorityPreferenceScore(opportunity.payStars, profile.payPreference);

      return { ...opportunity, fitScore };
    })
    .sort(
      (a, b) =>
        b.fitScore - a.fitScore ||
        profileFitScore(b) - profileFitScore(a) ||
        b.competitiveness - a.competitiveness
    );

  const bestByFirm = new Map();
  ranked.forEach((opportunity) => {
    const existing = bestByFirm.get(opportunity.firm);
    if (!existing || opportunity.fitScore > existing.fitScore) {
      bestByFirm.set(opportunity.firm, opportunity);
    }
  });

  const uniqueFirmRanked = [...bestByFirm.values()].sort(
    (a, b) =>
      b.fitScore - a.fitScore ||
      profileFitScore(b) - profileFitScore(a) ||
      b.competitiveness - a.competitiveness
  );

  const used = new Set();
  const take = (category, count) => {
    const preferred = uniqueFirmRanked.filter((item) => item.classification === category && !used.has(item.firm));
    const fallback = uniqueFirmRanked.filter((item) => !used.has(item.firm) && item.classification !== category);
    return [...preferred, ...fallback].slice(0, count).map((item) => {
      used.add(item.firm);
      return {
        ...item,
        matchCategory: category,
        reason: categoryReason(category, item, preference, strength),
        suggestedNextAction: nextActionFor(category, item)
      };
    });
  };

  return {
    Reach: take('Reach', 8),
    Target: take('Target', 12),
    Safety: take('Safety', 5),
    isLimitedByLocation: Boolean(isStrictLocation && uniqueFirmRanked.length < 25),
    locationLimitReason: isStrictLocation && uniqueFirmRanked.length < 25 ? 'strict' : ''
  };
}

function TargetOpportunityCard({ opportunity }) {
  return (
    <article className={`firm-card ${opportunity.matchCategory.toLowerCase()}`}>
      <div className="firm-heading">
        <h3>
          {opportunity.firm} <span>({opportunity.office} · {opportunity.group})</span>
        </h3>
        <div className="tag-row">
          <span className="tag">{opportunity.type || opportunity.tier}</span>
          <span className={`tag status ${opportunity.matchCategory.toLowerCase()}`}>{opportunity.matchCategory}</span>
        </div>
        <p>{opportunity.reason}</p>
        <p className="meta">
          <strong>Next action:</strong> {opportunity.suggestedNextAction}
        </p>
      </div>
    </article>
  );
}

export default function TargetListBuilderPage({ onBack }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState(defaultProfile);
  const [locationSearch, setLocationSearch] = useState('');
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [targetList, setTargetList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const progressPercent = ((currentStep + 1) / stepTitles.length) * 100;
  const locationOptions = useMemo(
    () =>
      [
        'No preference',
        ...new Set([
          ...commonLocationLabels,
          ...ibOffices.map(officeLocationLabel)
        ])
      ].sort((a, b) => (a === 'No preference' ? -1 : b === 'No preference' ? 1 : a.localeCompare(b))),
    []
  );
  const matchingLocationOptions = useMemo(() => {
    const query = locationSearch.trim().toLowerCase();
    if (!query) return ['No preference', ...locationOptions.filter((location) => location !== 'No preference').slice(0, 7)];

    return locationOptions
      .filter((location) => location.toLowerCase().includes(query))
      .slice(0, 8);
  }, [locationOptions, locationSearch]);

  const toggleInterest = (interest) => {
    setProfile((prev) => {
      if (interest === 'Not sure yet') {
        return { ...prev, interests: ['Not sure yet'] };
      }

      const withoutUnsure = prev.interests.filter((item) => item !== 'Not sure yet');
      const nextInterests = withoutUnsure.includes(interest)
        ? withoutUnsure.filter((item) => item !== interest)
        : [...withoutUnsure, interest];

      return { ...prev, interests: nextInterests.length ? nextInterests : ['Not sure yet'] };
    });
  };

  const addWorkExperience = () => {
    setProfile((prev) => ({ ...prev, workExperiences: [...prev.workExperiences, createWorkExperience()] }));
  };

  const updateWorkExperience = (id, value) => {
    setProfile((prev) => ({
      ...prev,
      workExperiences: prev.workExperiences.map((experience) =>
        experience.id === id ? { ...experience, workType: value } : experience
      )
    }));
  };

  const removeWorkExperience = (id) => {
    setProfile((prev) => ({ ...prev, workExperiences: prev.workExperiences.filter((experience) => experience.id !== id) }));
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

  const goNext = () => {
    setError('');
    if (currentStep === 1 && !profile.locationPreference) {
      setError('Select a location from the search results or choose No preference.');
      return;
    }
    if (currentStep === 2 && !profile.school) {
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
    setCurrentStep(0);
    setProfile(defaultProfile);
    setLocationSearch('');
    setIsLocationSelectorOpen(false);
    setTargetList(null);
    setLoading(false);
    setError('');
  };

  const handleLocationSearchChange = (value) => {
    setLocationSearch(value);
    setIsLocationSelectorOpen(true);
    setTargetList(null);

    if (!value.trim()) {
      setProfile((prev) => ({ ...prev, locationPreference: 'No preference', locationPreferenceStrength: 'Flexible' }));
    } else if (value !== profile.locationPreference) {
      setProfile((prev) => ({ ...prev, locationPreference: '' }));
    }
  };

  const handleLocationSelect = (location) => {
    const normalizedLocation = location === 'No preference' ? 'No preference' : normalizeLocationLabel(location);
    setProfile((prev) => ({
      ...prev,
      locationPreference: normalizedLocation,
      locationPreferenceStrength: normalizedLocation === 'No preference' ? 'Flexible' : prev.locationPreferenceStrength || 'Flexible'
    }));
    setLocationSearch(normalizedLocation === 'No preference' ? '' : normalizedLocation);
    setIsLocationSelectorOpen(false);
    setTargetList(null);
    setError('');
  };

  const clearLocationPreference = () => {
    setProfile((prev) => ({ ...prev, locationPreference: 'No preference', locationPreferenceStrength: 'Flexible' }));
    setLocationSearch('');
    setIsLocationSelectorOpen(false);
    setTargetList(null);
  };

  const buildList = async () => {
    setLoading(true);
    setError('');

    const preference = normalizeLocationPreference(profile);
    const profilePayload = {
      ...profile,
      school: schoolForPayload(profile.school),
      selectedInterests: profile.interests,
      preferredLocation: preference,
      preferredLocations:
        preference && preference !== 'No preference' && profile.locationPreferenceStrength === 'Strict'
          ? [preference]
          : [],
      workType:
        profile.workExperiences.find((experience) => experience.workType !== 'None')?.workType ||
        profile.workExperiences[0]?.workType ||
        'None'
    };

    try {
      const [response] = await Promise.all([
        fetch('http://localhost:4000/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profilePayload)
        }),
        new Promise((resolve) => setTimeout(resolve, 1200))
      ]);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.details || errorData?.error || `Failed to build target list (${response.status})`);
      }

      const data = await response.json();
      setTargetList(buildTargetList(data.results, profile));
    } catch (err) {
      console.error('Backend target list generation failed. Falling back to local recommendations.', err);

      try {
        const fallbackData = scoreProfileLocally(profilePayload);
        setTargetList(buildTargetList(fallbackData.results, profile));
        setError('');
      } catch (fallbackErr) {
        console.error('Local target list generation failed.', fallbackErr);
        const message = fallbackErr.message || err.message || 'Could not build target list.';
        setError(`Could not build target list: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <>
          <h2>What type of investment banking are you interested in?</h2>
          <div className="choice-grid multi-choice-grid">
            {ibInterestOptions.map((interest) => (
              <button
                type="button"
                key={interest}
                className={profile.interests.includes(interest) ? 'choice-card selected' : 'choice-card'}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </button>
            ))}
          </div>
        </>
      );
    }

    if (currentStep === 1) {
      return (
        <>
          <h2>Do you have a location preference?</h2>
          <div className="grid">
            <label className="firm-search-field">
              <span>Location preference</span>
              <div className="firm-autocomplete location-autocomplete">
                <input
                  type="search"
                  value={locationSearch}
                  placeholder="Search for a city..."
                  autoComplete="off"
                  onChange={(e) => handleLocationSearchChange(e.target.value)}
                  onFocus={() => setIsLocationSelectorOpen(true)}
                  onBlur={() => setTimeout(() => setIsLocationSelectorOpen(false), 120)}
                />
                {profile.locationPreference !== 'No preference' ? (
                  <button type="button" className="location-clear-button" aria-label="Clear location preference" onClick={clearLocationPreference}>
                    x
                  </button>
                ) : null}
                {isLocationSelectorOpen ? (
                  <div className="firm-autocomplete-menu">
                    {matchingLocationOptions.length ? (
                      matchingLocationOptions.map((location) => (
                        <button
                          type="button"
                          key={location}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleLocationSelect(location)}
                        >
                          {location}
                        </button>
                      ))
                    ) : (
                      <p>No matching locations found</p>
                    )}
                  </div>
                ) : null}
              </div>
              <span className="field-helper">
                {profile.locationPreference === 'No preference'
                  ? 'No location filter will be applied.'
                  : profile.locationPreference
                    ? `Selected: ${profile.locationPreference}`
                    : 'Select a suggested city to apply a location preference.'}
              </span>
            </label>
          </div>
          {profile.locationPreference && profile.locationPreference !== 'No preference' ? (
            <div className="preference-block">
              <h3>How strongly should Banker Builder follow this location preference?</h3>
              <div className="choice-grid preference-choice-grid">
                {locationStrengthOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={profile.locationPreferenceStrength === option.value ? 'choice-card selected' : 'choice-card'}
                    onClick={() => setProfile({ ...profile, locationPreferenceStrength: option.value })}
                  >
                    <strong>{option.title}</strong>
                    <span>{option.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      );
    }

    if (currentStep === 2) {
      return (
        <>
          <h2>Academic Info</h2>
          <div className="grid">
            <label className="school-search-field">
              <span>School</span>
              <SchoolAutocomplete value={profile.school} onChange={(school) => setProfile({ ...profile, school })} />
            </label>
            <NumberField label="GPA" value={profile.gpa} min={2} max={4} step={0.01} onChange={(value) => setProfile({ ...profile, gpa: value })} />
          </div>
        </>
      );
    }

    if (currentStep === 3) {
      return (
        <>
          <div className="section-heading">
            <h2>Prior Work / Internship Experience</h2>
            <button type="button" className="secondary" onClick={addWorkExperience}>
              Add Experience
            </button>
          </div>
          <div className="activity-list">
            {profile.workExperiences.map((experience, index) => (
              <article className="activity-card" key={experience.id}>
                <div className="activity-card-heading">
                  <h4>Experience {index + 1}</h4>
                  <button type="button" className="text-button" onClick={() => removeWorkExperience(experience.id)}>
                    Remove
                  </button>
                </div>
                <label>
                  <span>Work Type</span>
                  <select value={experience.workType} onChange={(e) => updateWorkExperience(experience.id, e.target.value)}>
                    {workTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
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

    if (currentStep === 4) {
      return (
        <>
          <div className="section-heading">
            <h2>Leadership / Extracurriculars</h2>
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
                        {option}
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
          <h2>Recruiting Priorities</h2>
          <div className="preference-block">
            <h3>How much do you care about prestige?</h3>
            <div className="choice-grid priority-choice-grid">
              {recruitingPriorityOptions.map((option) => (
                <button
                  type="button"
                  key={`prestige-${option}`}
                  className={profile.prestigePreference === option ? 'choice-card selected' : 'choice-card'}
                  onClick={() => setProfile({ ...profile, prestigePreference: option })}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="preference-block">
            <h3>How much do you care about pay?</h3>
            <div className="choice-grid priority-choice-grid">
              {recruitingPriorityOptions.map((option) => (
                <button
                  type="button"
                  key={`pay-${option}`}
                  className={profile.payPreference === option ? 'choice-card selected' : 'choice-card'}
                  onClick={() => setProfile({ ...profile, payPreference: option })}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <h2>Review Your Inputs</h2>
        <div className="review-grid">
          <section>
            <h3>IB Interests</h3>
            <p>{profile.interests.join(', ')}</p>
          </section>
          <section>
            <h3>Location Preference</h3>
            <p>{normalizeLocationPreference(profile) || 'No preference'}</p>
            <p>
              Strength:{' '}
              {profile.locationPreference && profile.locationPreference !== 'No preference'
                ? profile.locationPreferenceStrength
                : 'Not applied'}
            </p>
          </section>
          <section>
            <h3>Recruiting Priorities</h3>
            <p>Prestige: {profile.prestigePreference}</p>
            <p>Pay: {profile.payPreference}</p>
          </section>
          <section>
            <h3>Academic Info</h3>
            <p>{schoolDisplayName(profile.school) || 'School not entered'}</p>
            <p>GPA: {profile.gpa}</p>
          </section>
          <section>
            <h3>Work Experience</h3>
            {profile.workExperiences.map((experience) => (
              <p key={experience.id}>{experience.workType}</p>
            ))}
          </section>
          <section>
            <h3>Activities / Leadership</h3>
            {profile.activities.map((activity) => (
              <p key={activity.id}>{activity.activityType} · {activity.selectivity} · {activity.leadershipLevel}</p>
            ))}
          </section>
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <>
        <button type="button" className="back-button" onClick={onBack}>
          Back to Home
        </button>
        <section className="panel survey-card thinking-card">
          <span className="feature-eyebrow">Building your target list...</span>
          <h2>Matching your profile to firms, offices, and groups...</h2>
        </section>
      </>
    );
  }

  if (targetList) {
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

        <section className="panel results">
          <h2>Target List Results</h2>
          {targetList.isLimitedByLocation ? (
            <p className="limited-results-note">
              Fewer recommendations are shown because your location preference is strict and the current dataset has limited matching firms.
            </p>
          ) : null}
          <div className="results-grid">
            {['Reach', 'Target', 'Safety'].map((category) => (
              <div key={category} className={`category-block ${category.toLowerCase()}`}>
                <h3>
                  {category} <span>{targetList[category].length}</span>
                </h3>
                <div className="stack">
                  {targetList[category].map((opportunity) => (
                    <TargetOpportunityCard key={`${category}-${opportunity.id}`} opportunity={opportunity} />
                  ))}
                </div>
              </div>
            ))}
          </div>
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
            <button type="button" className="primary" onClick={buildList}>
              Build Target List
            </button>
          )}
        </div>
      </section>
    </>
  );
}
