import { useEffect, useMemo, useState } from 'react';
import ScoreBreakdown from './ScoreBreakdown';
import ibOffices from '../../../data/ibOffices.json';
import schools from '../../../data/schools.json';

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
  workType: 'None'
});

const defaultProfile = {
  school: schools[0].schoolName,
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

function schoolToScore(school) {
  const normalized = school.trim().toLowerCase();
  if (!normalized) return 5;

  const matched = schools.find((entry) => entry.schoolName.toLowerCase() === normalized);
  return matched?.prestigeScore ?? 5;
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

function profileScores(profile, competitiveness, weights, experienceOverride) {
  const schoolScore = schoolToScore(profile.school || '');
  const gpaScore = gpaToNonlinearScore(profile.gpa, competitiveness);
  const academic = clamp(schoolScore * 0.45 + gpaScore * 0.55);
  const experience = experienceOverride ?? workTypeScore(profile.workType);
  const networking = networkingScore(profile.networking);
  const extracurricular = extracurricularScore(profile);
  const total = clamp(
    academic * weights.academic +
      experience * weights.experience +
      networking * weights.networking +
      extracurricular * weights.extracurricular
  );

  return { schoolScore, gpaScore, academic, experience, networking, extracurricular, total };
}

function hireTypeDifficultyAdjustment(hireType, profile) {
  const weights = profileWeights[hireType];
  const experience = workTypeScore(profile.workType);
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
  const scores = profileScores(profile, adjustedCompetitiveness, weights, workTypeScore(profile.workType));
  const delta = scores.total - adjustedCompetitiveness;
  const rawLikelihood = 100 / (1 + Math.exp(-1.15 * (delta + 0.1)));
  const likelihood = Math.round(Math.max(3, Math.min(92, rawLikelihood)));
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
    total: Number(scores.total.toFixed(2)),
    school: Number(scores.schoolScore.toFixed(2)),
    gpa: Number(scores.gpaScore.toFixed(2))
  };

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
    reason: `Your total score (${scores.total.toFixed(2)}) is ${delta >= 0 ? 'above' : 'below'} this ${hireType} ${opportunity.group} opportunity's adjusted benchmark (${adjustedCompetitiveness.toFixed(1)}).`
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
  const scores = (profile.workExperiences || [])
    .map((experience) => workTypeScore(experience.workType))
    .concat(workTypeScore(profile.workType))
    .filter(Number.isFinite);

  return scores.length ? Math.max(...scores) : workTypeScore('None');
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
      const upgradedWorkType = bestWorkScore(profile) < 5.5 ? 'Corporate finance internship' : 'Investment banking internship';
      profile.workType = upgradedWorkType;
      profile.workExperiences = profile.workExperiences.length
        ? [{ ...profile.workExperiences[0], workType: upgradedWorkType }, ...profile.workExperiences.slice(1)]
        : [{ id: 'projected-work', workType: upgradedWorkType }];
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

  const goNext = () => {
    setError('');
    if (currentStep === 0 && !firmOptions.includes(selection.firm)) {
      setError('Select a bank from the search results before continuing.');
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

    const profilePayload = {
      ...normalizeProfileForScoring(profile),
      workType:
        profile.workExperiences.find((experience) => experience.workType !== 'None')?.workType ||
        profile.workExperiences[0]?.workType ||
        'None'
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
            <label>
              <span>School</span>
              <select value={profile.school} onChange={(e) => setProfile({ ...profile, school: e.target.value })}>
                {schools.map((school) => (
                  <option key={school.schoolName} value={school.schoolName}>
                    {school.schoolName} ({school.tier})
                  </option>
                ))}
              </select>
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
            <p>{profile.school || 'School not entered'}</p>
            <p>GPA: {profile.gpa}</p>
          </section>
          <section>
            <h3>Activities</h3>
            {profile.activities.map((activity) => (
              <p key={activity.id}>{activity.activityType} · {activity.selectivity} · {activity.leadershipLevel}</p>
            ))}
          </section>
          <section>
            <h3>Work Experience</h3>
            {profile.workExperiences.map((experience) => (
              <p key={experience.id}>{experience.workType}</p>
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
