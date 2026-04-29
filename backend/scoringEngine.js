import { opportunities, opportunityGroups } from './firms.js';

const prestigeLookup = {
  'wharton': 10,
  'harvard': 10,
  'stanford': 10,
  'mit': 9.8,
  'princeton': 9.7,
  'yale': 9.5,
  'columbia': 9.5,
  'upenn': 9.4,
  'nyu': 8.8,
  'cornell': 8.7,
  'duke': 8.7,
  'northwestern': 8.6,
  'umich': 8.2,
  'berkeley': 8.5,
  'ucla': 8.0,
  'texas': 7.8,
  'georgetown': 8.0,
  'usc': 7.7,
  'vanderbilt': 7.5,
  'state school': 6.2,
  'regional school': 5.2
};

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

const activityTypeScores = {
  'Selective IB club': 9.4,
  'Investment fund / student-run fund': 9,
  'Business fraternity': 8.2,
  'Social fraternity / sorority executive board': 8,
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

function schoolToScore(school) {
  const normalized = school.trim().toLowerCase();
  if (!normalized) return 5;

  const matched = Object.entries(prestigeLookup).find(([key]) => normalized.includes(key));
  if (matched) return matched[1];

  if (normalized.includes('ivy')) return 9;
  if (normalized.includes('state')) return 6.2;
  return 6.8;
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
  experienceOverride = null
) {
  const schoolScore = schoolToScore(profile.school || '');
  const gpaScore = gpaToNonlinearScore(profile.gpa, competitiveness);
  const academic = clamp(schoolScore * 0.45 + gpaScore * 0.55);
  const experience = experienceOverride ?? experienceScore(profile.internshipType, profile.exposureLevel);
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
    total
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

export function scoreProfile(profile) {
  const baseScores = resumeProfileScores(profile);

  const results = opportunities
    .filter((opportunity) => {
      if (!profile.preferredLocations?.length) return true;
      return profile.preferredLocations.includes(opportunity.office);
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
        competitiveness: opportunity.competitiveness,
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
  const scores = profileScores(profile, adjustedCompetitiveness, weights, workTypeScore(profile.workType));
  const delta = scores.total - adjustedCompetitiveness;
  const rawLikelihood = 100 / (1 + Math.exp(-1.15 * (delta + 0.1)));
  const likelihood = Math.round(Math.max(3, Math.min(92, rawLikelihood)));
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
    reason: `Your total score (${scores.total.toFixed(2)}) is ${delta >= 0 ? 'above' : 'below'} this ${hireType} ${opportunity.group} opportunity's adjusted benchmark (${adjustedCompetitiveness.toFixed(1)}).`
  };
}
