import { firms } from './firms.js';

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
  IB: 10,
  PE: 9,
  finance: 7,
  consulting: 7.2,
  corporate: 6,
  none: 2.5
};

const exposureScores = {
  high: 10,
  moderate: 7,
  low: 4,
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

const clubScores = {
  'IB club': 9,
  'business org': 7,
  'non-business org': 4.5,
  none: 1
};

const leadershipScores = {
  president: 10,
  VP: 8,
  member: 5,
  none: 1
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

function extracurricularScore(clubType, leadershipLevel) {
  const club = clubScores[clubType] ?? 2;
  const leadership = leadershipScores[leadershipLevel] ?? 1;
  return clamp(club * 0.55 + leadership * 0.45);
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
  if (scoreBreakdown.extracurricular >= 7) strengths.push('Leadership and campus involvement support your narrative and fit.');
  if (profile.preferredLocations?.length) strengths.push(`Clear office preference (${profile.preferredLocations.join(', ')}) helps focus outreach.`);
  return strengths.slice(0, 3);
}

function buildGaps(scoreBreakdown, gateReasons) {
  const gaps = [...gateReasons];
  if (scoreBreakdown.networking < 6) gaps.push('Networking volume and referral depth should be built further.');
  if (scoreBreakdown.experience < 6) gaps.push('Experience quality needs stronger transaction or valuation exposure.');
  if (scoreBreakdown.academic < 6) gaps.push('Academic profile is below average for top investment banking pipelines.');
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
  if (steps.length < 2) {
    steps.push('Target analysts/alumni in preferred offices for referral-oriented outreach with tailored firm-specific pitches.');
  }
  return steps.slice(0, 3);
}

export function scoreProfile(profile) {
  const schoolScore = schoolToScore(profile.school || '');
  const experience = experienceScore(profile.internshipType, profile.exposureLevel);
  const networking = networkingScore(profile.networking);
  const extracurricular = extracurricularScore(profile.clubType, profile.leadershipLevel);

  const results = firms
    .filter((firm) => {
      if (!profile.preferredLocations?.length) return true;
      return profile.preferredLocations.includes(firm.office);
    })
    .map((firm) => {
      const gpaScore = gpaToNonlinearScore(profile.gpa, firm.competitiveness);
      const academic = clamp(schoolScore * 0.45 + gpaScore * 0.55);

      const total = clamp(
        academic * 0.28 +
          experience * 0.22 +
          networking * 0.36 +
          extracurricular * 0.14
      );

      const delta = total - firm.competitiveness;
      const initialClass = baseClassification(delta);
      const { classification, gateReasons } = applyGates({
        classification: initialClass,
        gpa: profile.gpa,
        networking,
        experience,
        competitiveness: firm.competitiveness,
        gpaScore
      });

      const scoreBreakdown = {
        academic: Number(academic.toFixed(2)),
        experience: Number(experience.toFixed(2)),
        networking: Number(networking.toFixed(2)),
        extracurricular: Number(extracurricular.toFixed(2)),
        total: Number(total.toFixed(2)),
        school: Number(schoolScore.toFixed(2)),
        gpa: Number(gpaScore.toFixed(2))
      };

      return {
        firm: firm.name,
        office: firm.office,
        tier: firm.tier,
        competitiveness: firm.competitiveness,
        classification,
        confidence: confidenceFromDelta(delta),
        scoreBreakdown,
        strengths: buildStrengths(scoreBreakdown, profile),
        gaps: buildGaps(scoreBreakdown, gateReasons),
        actionSteps: buildActionSteps(scoreBreakdown, profile),
        reason: `Your total score (${total.toFixed(2)}) is ${delta >= 0 ? 'above' : 'below'} this office's competitiveness benchmark (${firm.competitiveness.toFixed(1)}).`
      };
    })
    .sort((a, b) => b.competitiveness - a.competitiveness);

  return {
    profileSummary: {
      schoolScore: Number(schoolScore.toFixed(2)),
      experience: Number(experience.toFixed(2)),
      networking: Number(networking.toFixed(2)),
      extracurricular: Number(extracurricular.toFixed(2))
    },
    results
  };
}
