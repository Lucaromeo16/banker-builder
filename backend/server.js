import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ibOffices, opportunities, opportunitySummary } from './firms.js';
import { groupOptions, scoreInterviewOdds, scoreProfile } from './scoringEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
const dotenvResult = dotenv.config({ path: envPath });

const app = express();
const preferredPort = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json({ limit: '16mb' }));

app.get('/api/health', (_, res) => {
  res.json({ ok: true, service: 'banker-builder-backend' });
});

app.get('/api/opportunities', (_, res) => {
  res.json({ opportunities, firms: opportunities, offices: ibOffices, groups: groupOptions, summary: opportunitySummary });
});

app.post('/api/score', (req, res) => {
  try {
    const payload = req.body;
    if (typeof payload.gpa !== 'number') {
      return res.status(400).json({ error: 'Invalid payload: GPA must be numeric.' });
    }

    const scored = scoreProfile(payload);
    return res.json(scored);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to score profile.', details: error.message });
  }
});

app.post('/api/interview-odds', (req, res) => {
  try {
    const payload = req.body;
    if (!payload.hireType) {
      return res.status(400).json({ error: 'Invalid payload: hireType is required.' });
    }

    if (typeof payload.profile?.gpa !== 'number') {
      return res.status(400).json({ error: 'Invalid payload: profile GPA must be numeric.' });
    }

    const scored = scoreInterviewOdds(payload);
    return res.json(scored);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to score interview odds.', details: error.message });
  }
});

const feedbackSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'scoreOutOf10',
    'whatWentWell',
    'whatWasMissing',
    'improvedAnswerStructure',
    'tenOutOfTenExampleResponse',
    'followUpQuestion'
  ],
  properties: {
    scoreOutOf10: {
      type: 'number',
      minimum: 1,
      maximum: 10
    },
    whatWentWell: {
      type: 'array',
      minItems: 1,
      maxItems: 4,
      items: { type: 'string' }
    },
    whatWasMissing: {
      type: 'array',
      minItems: 1,
      maxItems: 4,
      items: { type: 'string' }
    },
    improvedAnswerStructure: {
      type: 'string'
    },
    tenOutOfTenExampleResponse: {
      type: 'string'
    },
    followUpQuestion: {
      type: 'string'
    }
  }
};

const interviewQuestionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['question'],
  properties: {
    question: {
      type: 'string',
      minLength: 20
    }
  }
};

const hireVueEvaluationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['overallScoreOutOf10', 'categoryScores', 'strengths', 'weaknesses', 'improvementSuggestions', 'idealResponseStructure'],
  properties: {
    overallScoreOutOf10: { type: 'number', minimum: 1, maximum: 10 },
    categoryScores: {
      type: 'object',
      additionalProperties: false,
      required: ['communication', 'structure', 'confidence', 'professionalism', 'conciseness'],
      properties: {
        communication: { type: 'number', minimum: 1, maximum: 10 },
        structure: { type: 'number', minimum: 1, maximum: 10 },
        confidence: { type: 'number', minimum: 1, maximum: 10 },
        professionalism: { type: 'number', minimum: 1, maximum: 10 },
        conciseness: { type: 'number', minimum: 1, maximum: 10 }
      }
    },
    strengths: { type: 'array', minItems: 2, maxItems: 5, items: { type: 'string' } },
    weaknesses: { type: 'array', minItems: 2, maxItems: 5, items: { type: 'string' } },
    improvementSuggestions: { type: 'array', minItems: 3, maxItems: 6, items: { type: 'string' } },
    idealResponseStructure: { type: 'string' }
  }
};

const outreachDraftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['subjectLine', 'draft'],
  properties: {
    subjectLine: {
      type: 'string'
    },
    draft: {
      type: 'string'
    }
  }
};

const resumeExtractionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['resumeText', 'formattingMetadata', 'warnings'],
  properties: {
    resumeText: {
      type: 'string'
    },
    formattingMetadata: {
      type: 'object',
      additionalProperties: false,
      required: ['detectedSections', 'bulletCount', 'lineCount'],
      properties: {
        detectedSections: {
          type: 'array',
          items: { type: 'string' }
        },
        bulletCount: {
          type: 'number'
        },
        lineCount: {
          type: 'number'
        }
      }
    },
    warnings: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

const resumeScoreDetailSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['score', 'positives', 'pointLossReasons', 'improvements'],
  properties: {
    score: { type: 'number', minimum: 1, maximum: 10 },
    positives: {
      type: 'array',
      minItems: 2,
      maxItems: 5,
      items: { type: 'string' }
    },
    pointLossReasons: {
      type: 'array',
      minItems: 0,
      maxItems: 5,
      items: { type: 'string' }
    },
    improvements: {
      type: 'array',
      minItems: 0,
      maxItems: 5,
      items: { type: 'string' }
    }
  }
};

const resumeAnalysisSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'overallScoreOutOf10',
    'ibReadinessScore',
    'formattingScore',
    'experienceScore',
    'leadershipScore',
    'technicalRelevanceScore',
    'spellingGrammarScore',
    'formattingFeedback',
    'scoreDetails',
    'strengths',
    'weaknesses',
    'missingSignals',
    'suggestedResumePositioning',
    'recommendedBulletRewrites',
    'nextSteps'
  ],
  properties: {
    overallScoreOutOf10: { type: 'number', minimum: 1, maximum: 10 },
    ibReadinessScore: { type: 'number', minimum: 1, maximum: 10 },
    formattingScore: { type: 'number', minimum: 1, maximum: 10 },
    experienceScore: { type: 'number', minimum: 1, maximum: 10 },
    leadershipScore: { type: 'number', minimum: 1, maximum: 10 },
    technicalRelevanceScore: { type: 'number', minimum: 1, maximum: 10 },
    spellingGrammarScore: { type: 'number', minimum: 1, maximum: 10 },
    formattingFeedback: {
      type: 'array',
      minItems: 2,
      maxItems: 5,
      items: { type: 'string' }
    },
    scoreDetails: {
      type: 'object',
      additionalProperties: false,
      required: ['ibReadiness', 'formatting', 'experience', 'leadership', 'technicalRelevance', 'spellingGrammar'],
      properties: {
        ibReadiness: resumeScoreDetailSchema,
        formatting: resumeScoreDetailSchema,
        experience: resumeScoreDetailSchema,
        leadership: resumeScoreDetailSchema,
        technicalRelevance: resumeScoreDetailSchema,
        spellingGrammar: resumeScoreDetailSchema
      }
    },
    strengths: {
      type: 'array',
      minItems: 2,
      maxItems: 5,
      items: { type: 'string' }
    },
    weaknesses: {
      type: 'array',
      minItems: 2,
      maxItems: 5,
      items: { type: 'string' }
    },
    missingSignals: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
      items: { type: 'string' }
    },
    suggestedResumePositioning: { type: 'string' },
    recommendedBulletRewrites: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['originalBullet', 'rewrittenBullet', 'whyItWorks'],
        properties: {
          originalBullet: { type: 'string' },
          rewrittenBullet: { type: 'string' },
          whyItWorks: { type: 'string' }
        }
      }
    },
    nextSteps: {
      type: 'array',
      minItems: 2,
      maxItems: 6,
      items: { type: 'string' }
    }
  }
};

function extractResponseText(responseData) {
  if (responseData.output_text) return responseData.output_text;

  return responseData.output
    ?.flatMap((item) => item.content || [])
    .map((content) => content.text)
    .filter(Boolean)
    .join('\n');
}

function normalizeResumeText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function countResumeWords(text) {
  return normalizeResumeText(text).split(/\s+/).filter(Boolean).length;
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

const unreliableVisualFormattingPattern =
  /\b(spacing|align(?:ment|ed)?|bold(?:ing)?|font(?:s| size)?|margin|margins|white\s*space|visual(?:ly)?|layout|aesthetic|aesthetics|indent(?:ation)?|density|styling|style)\b/i;

const bulletPunctuationPattern =
  /\b(bullet|bullets).*\b(punctuation|periods?|ending|endings|end\b)|\b(periods?|no-period|no period|punctuation).*\b(bullet|bullets)\b/i;

const grammarFormattingOverlapPattern =
  /\b(spell(?:ing)?|grammar|grammatical|tense|punctuation|sentence|mechanics|writing mechanics|wording|action verb|tone)\b/i;

const highSchoolFormattingOverlapPattern =
  /\b(high school|secondary school|high-school|sat|act)\b/i;

const reliableFormattingIssuePattern =
  /\b(section order|order|hierarch|section naming|header|date|location|company|title|role line|organization|organized|one-page|one page|contact|education|work experience|leadership|additional|skills|certifications|interests|chronological|reverse chronological|objective|summary|skills-heavy|student-resume|soft skills)\b/i;

const resumeSubscoreFields = [
  ['ibReadinessScore', 'ibReadiness'],
  ['formattingScore', 'formatting'],
  ['experienceScore', 'experience'],
  ['leadershipScore', 'leadership'],
  ['technicalRelevanceScore', 'technicalRelevance'],
  ['spellingGrammarScore', 'spellingGrammar']
];

function removeUnreliableVisualFormattingClaims(items) {
  return normalizeList(items).filter((item) => {
    if (unreliableVisualFormattingPattern.test(item)) return false;
    if (bulletPunctuationPattern.test(item)) return false;
    if (grammarFormattingOverlapPattern.test(item)) return false;
    if (highSchoolFormattingOverlapPattern.test(item)) return false;
    return true;
  });
}

function clampNumericScore(score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return null;
  return Math.max(1, Math.min(10, numericScore));
}

function roundScoreToHalf(score) {
  const clampedScore = clampNumericScore(score);
  if (clampedScore === null) return null;
  return Math.max(1, Math.min(10, Math.round(clampedScore * 2) / 2));
}

function averageSubscores(scores) {
  const validScores = scores.map(clampNumericScore).filter((score) => score !== null);
  if (!validScores.length) return null;
  return Number((validScores.reduce((sum, score) => sum + score, 0) / validScores.length).toFixed(1));
}

function countPatternMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

function detectResumeCompetitivenessSignals(resumeText) {
  const text = normalizeResumeText(resumeText).toLowerCase();
  const financeSignals = countPatternMatches(
    text,
    /\b(investment banking|investment bank|m&a|mergers?|acquisitions?|valuation|dcf|discounted cash flow|comparable compan(?:y|ies)|precedent transaction|financial model(?:ing)?|three-statement|lbo|leveraged buyout|accounting|audit|transaction advisory|tas|due diligence|capital markets?|equity research|private equity|hedge fund|asset management|wealth management|corporate finance|bloomberg|factset|capital iq|wall street prep|biws|cfa|financial statement|portfolio|student investment fund|investment club)\b/g
  );
  const businessSignals = countPatternMatches(
    text,
    /\b(finance|accounting|economics|business|consulting|strategy|market research|revenue|profit|budget|forecast|analytics?|excel|powerpoint|pitch|client|crm|sales|operations|entrepreneur|startup)\b/g
  );
  const genericServiceSignals = countPatternMatches(
    text,
    /\b(customer service|retail|cashier|server|barista|restaurant|host|lifeguard|camp counselor|front desk|food service|hospitality)\b/g
  );
  const leadershipSignals = countPatternMatches(
    text,
    /\b(president|founder|co-founder|executive board|vice president|vp|treasurer|captain|chair|director|managed|led|supervised|founded)\b/g
  );
  const quantifiedSignals = countPatternMatches(text, /(?:\$\s?\d|\d+(?:\.\d+)?%|\b\d+\s?(?:k|m|million|billion|clients|customers|members|students|employees|hours|transactions)\b)/g);
  const highSchoolSignals = countPatternMatches(text, /\b(high school|secondary school)\b/g);
  const genericStudentSections = countPatternMatches(text, /\b(objective|summary|relevant skills|soft skills)\b/g);

  return {
    financeSignals,
    businessSignals,
    genericServiceSignals,
    leadershipSignals,
    quantifiedSignals,
    highSchoolSignals,
    genericStudentSections
  };
}

function capScore(sanitized, scoreField, detailKey, cap, reason) {
  const currentScore = clampNumericScore(sanitized[scoreField]);
  if (currentScore === null || currentScore <= cap) return;

  sanitized[scoreField] = cap;
  const detail = sanitized.scoreDetails[detailKey] || {};
  sanitized.scoreDetails[detailKey] = {
    ...detail,
    score: cap,
    pointLossReasons: Array.from(new Set([...normalizeList(detail.pointLossReasons), reason])),
    improvements: normalizeList(detail.improvements)
  };
}

function addScoreReason(sanitized, scoreField, detailKey, scoreDelta, reason, improvement) {
  const currentScore = clampNumericScore(sanitized[scoreField]);
  if (currentScore === null) return;
  const newScore = Math.max(1, currentScore - scoreDelta);
  sanitized[scoreField] = newScore;

  const detail = sanitized.scoreDetails[detailKey] || {};
  sanitized.scoreDetails[detailKey] = {
    ...detail,
    score: newScore,
    pointLossReasons: Array.from(new Set([...normalizeList(detail.pointLossReasons), reason])),
    improvements: Array.from(new Set([...normalizeList(detail.improvements), improvement].filter(Boolean)))
  };
}

function hasLowercaseBulletStarts(resumeText) {
  const lines = normalizeResumeText(resumeText).split('\n');
  return lines.filter((line) => /^[\s]*[-*\u2022]\s+[a-z][A-Za-z'-]+\b/.test(line)).length;
}

function isLikelyFreshmanProfile(resumeText) {
  return /\b(freshman|first-year|first year|class of 2029|class of 2030)\b/i.test(resumeText);
}

function getSectionKey(line) {
  const normalized = line.trim().toLowerCase().replace(/[^a-z/& ]/g, '').replace(/\s+/g, ' ');
  if (/^(work experience|professional experience|experience|employment)$/.test(normalized)) return 'experience';
  if (/^(leadership|leadership activities|activities|involvement|extracurriculars|campus involvement)$/.test(normalized)) {
    return 'leadership';
  }
  if (/^(education|academic background)$/.test(normalized)) return 'education';
  if (/^(additional|skills|certifications|interests|other|projects)$/.test(normalized)) return 'other';
  return '';
}

const monthIndexByName = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12
};

function parseResumeDatePart(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return null;
  if (/\b(present|current|incoming)\b/.test(normalized)) {
    return { value: 999999, active: true };
  }

  const yearMatch = normalized.match(/\b(20\d{2}|19\d{2})\b/);
  if (!yearMatch) return null;

  const monthMatch = normalized.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/
  );
  const month = monthMatch ? monthIndexByName[monthMatch[1]] || 12 : 12;
  return { value: Number(yearMatch[1]) * 100 + month, active: false };
}

function parseResumeDateRange(line) {
  const normalizedLine = String(line || '').replace(/\s+/g, ' ').trim();
  if (!/\b(20\d{2}|19\d{2}|present|current|incoming)\b/i.test(normalizedLine)) return null;

  const rangeParts = normalizedLine.split(/\s+(?:-|–|—|to)\s+/i);
  if (rangeParts.length >= 2) {
    const start = parseResumeDatePart(rangeParts[0]);
    const end = parseResumeDatePart(rangeParts.slice(1).join(' '));
    if (start && end) return { start: start.value, end: end.value, active: end.active };
  }

  const dateMatches = [
    ...normalizedLine.matchAll(
      /\b(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+)?(20\d{2}|19\d{2}|present|current|incoming)\b/gi
    )
  ];
  if (dateMatches.length < 2) return null;

  const start = parseResumeDatePart(dateMatches[0][0]);
  const end = parseResumeDatePart(dateMatches[dateMatches.length - 1][0]);
  if (!start || !end) return null;
  return { start: start.value, end: end.value, active: end.active };
}

function chronologyEntryIsBefore(previous, current) {
  if (previous.active && current.active) return false;
  if (previous.active) return false;
  if (current.active) return true;
  if (current.end > previous.end) return true;
  if (current.end === previous.end && current.start > previous.start) return true;
  return false;
}

function hasClearlyOutOfOrderDates(resumeText) {
  const sectionEntries = {
    experience: [],
    leadership: []
  };
  let currentSection = '';

  normalizeResumeText(resumeText).split('\n').forEach((line) => {
    const sectionKey = getSectionKey(line);
    if (sectionKey) {
      currentSection = sectionKey;
      return;
    }

    if (!sectionEntries[currentSection]) return;
    const dateRange = parseResumeDateRange(line);
    if (dateRange) sectionEntries[currentSection].push(dateRange);
  });

  return Object.values(sectionEntries).some((entries) =>
    entries.length >= 3 && entries.some((entry, index) => index > 0 && chronologyEntryIsBefore(entries[index - 1], entry))
  );
}

function calibrateWeakIbProfileScores(sanitized, resumeText) {
  const signals = detectResumeCompetitivenessSignals(resumeText);
  const hasDirectFinance = signals.financeSignals >= 2;
  const hasSomeBusinessPreparation = signals.financeSignals >= 1 || signals.businessSignals >= 3;
  const isGenericStudentProfile =
    !hasDirectFinance && signals.genericServiceSignals >= 1 && signals.businessSignals <= 2 && signals.quantifiedSignals <= 1;
  const isLowFinanceBusinessProfile = !hasDirectFinance && hasSomeBusinessPreparation;
  const isVeryUnderpreparedProfile = !hasDirectFinance && !hasSomeBusinessPreparation;

  if (!isGenericStudentProfile && !isLowFinanceBusinessProfile && !isVeryUnderpreparedProfile) return;

  if (isVeryUnderpreparedProfile || isGenericStudentProfile) {
    capScore(
      sanitized,
      'ibReadinessScore',
      'ibReadiness',
      4.5,
      'IB readiness is capped because the resume shows little direct finance, accounting, valuation, or recruiting preparation.'
    );
    capScore(
      sanitized,
      'technicalRelevanceScore',
      'technicalRelevance',
      3.5,
      'Technical relevance is capped because generic work, service, or coursework signals do not substitute for finance/accounting/modeling exposure.'
    );
    capScore(
      sanitized,
      'experienceScore',
      'experience',
      signals.quantifiedSignals >= 2 ? 6 : 5.5,
      'Experience is capped because the roles appear general rather than analytically complex, finance-relevant, or professionally selective for IB recruiting.'
    );
    capScore(
      sanitized,
      'leadershipScore',
      'leadership',
      signals.leadershipSignals >= 2 ? 6.5 : 5,
      'Leadership is capped because the resume does not show enough selective finance-oriented leadership or clear responsibility beyond general involvement.'
    );
  } else if (isLowFinanceBusinessProfile) {
    capScore(
      sanitized,
      'ibReadinessScore',
      'ibReadiness',
      6.5,
      'IB readiness is capped because the resume has some business preparation but limited direct IB, valuation, accounting, or transaction exposure.'
    );
    capScore(
      sanitized,
      'technicalRelevanceScore',
      'technicalRelevance',
      4.5,
      'Technical relevance is capped because business or analytical claims are not the same as finance/accounting/modeling evidence.'
    );
    capScore(
      sanitized,
      'experienceScore',
      'experience',
      7,
      'Experience is capped because the resume needs more finance-relevant analytical complexity or selective professional exposure for a higher IB score.'
    );
  }

  if (signals.genericStudentSections) {
    capScore(
      sanitized,
      'formattingScore',
      'formatting',
      8.5,
      'Formatting is capped because the resume includes generic student-resume structure, such as objective/summary or soft-skills-heavy sections, rather than a cleaner finance resume organization.'
    );
  }
}

function applyConcreteIbResumeIssueCalibration(sanitized, resumeText) {
  const lowercaseBulletStarts = hasLowercaseBulletStarts(resumeText);
  if (lowercaseBulletStarts >= 1) {
    addScoreReason(
      sanitized,
      'spellingGrammarScore',
      'spellingGrammar',
      lowercaseBulletStarts >= 3 ? 1 : 0.5,
      'Spelling & Grammar lost points because one or more bullets begin with a lowercase word instead of sentence-style capitalization.',
      'Start each bullet with a capitalized action verb or clear sentence-style phrase.'
    );
  }

  if (detectResumeCompetitivenessSignals(resumeText).highSchoolSignals && !isLikelyFreshmanProfile(resumeText)) {
    addScoreReason(
      sanitized,
      'ibReadinessScore',
      'ibReadiness',
      0.5,
      'IB Readiness lost points because high school content on a college/post-college IB resume can make the recruiting profile look underdeveloped.',
      'Remove high school education, GPA, and extracurriculars unless there is a very specific reason to keep a strong SAT/ACT score.'
    );
  }

  if (hasClearlyOutOfOrderDates(resumeText)) {
    addScoreReason(
      sanitized,
      'formattingScore',
      'formatting',
      0.5,
      'Formatting lost points because one section appears not to follow clean reverse-chronological ordering.',
      'List entries within each section from most recent to oldest when dates are available.'
    );
  }
}

function sanitizeFormattingAnalysis(analysis, resumeText = '') {
  const sanitized = {
    ...analysis,
    scoreDetails: {
      ...(analysis.scoreDetails || {})
    }
  };
  const formattingDetail = {
    ...(sanitized.scoreDetails.formatting || {})
  };

  const cleanFeedback = removeUnreliableVisualFormattingClaims(sanitized.formattingFeedback);
  const cleanPositives = removeUnreliableVisualFormattingClaims(formattingDetail.positives);
  const cleanPointLossReasons = removeUnreliableVisualFormattingClaims(formattingDetail.pointLossReasons).filter((item) =>
    reliableFormattingIssuePattern.test(item)
  );
  const cleanImprovements = removeUnreliableVisualFormattingClaims(formattingDetail.improvements).filter((item) =>
    reliableFormattingIssuePattern.test(item)
  );
  const noMajorIssueText = 'No material formatting concerns detected.';
  const hasReliablePointLoss = cleanPointLossReasons.some((item) => !/^no major/i.test(item));
  let formattingScore = Number(sanitized.formattingScore);

  if (!Number.isFinite(formattingScore)) formattingScore = Number(formattingDetail.score) || 9;
  if (!hasReliablePointLoss && formattingScore < 10) formattingScore = 10;

  sanitized.formattingScore = Math.max(1, Math.min(10, formattingScore));
  sanitized.formattingFeedback = cleanFeedback.length
    ? cleanFeedback
    : ['Section order and text structure follow standard finance resume conventions.', noMajorIssueText];

  sanitized.scoreDetails.formatting = {
    ...formattingDetail,
    score: sanitized.formattingScore,
    positives: cleanPositives.length
      ? cleanPositives
      : ['Section order follows standard finance resume convention.', 'Clear standard section headers are present.'],
    pointLossReasons:
      sanitized.formattingScore >= 10 || !hasReliablePointLoss ? [] : cleanPointLossReasons,
    improvements:
      sanitized.formattingScore >= 10
        ? []
        : cleanImprovements.length
          ? cleanImprovements
          : ['Maintain consistent section ordering, header naming, and date formats.']
  };

  calibrateWeakIbProfileScores(sanitized, resumeText);
  applyConcreteIbResumeIssueCalibration(sanitized, resumeText);

  resumeSubscoreFields.forEach(([scoreField, detailKey]) => {
    const detail = sanitized.scoreDetails[detailKey] || {};
    const roundedScore = roundScoreToHalf(sanitized[scoreField] ?? detail.score);
    if (roundedScore === null) return;

    sanitized[scoreField] = roundedScore;
    sanitized.scoreDetails[detailKey] = {
      ...detail,
      score: roundedScore,
      pointLossReasons: roundedScore >= 10 ? [] : detail.pointLossReasons,
      improvements: roundedScore >= 10 ? [] : detail.improvements
    };
  });

  const calculatedOverall = averageSubscores(resumeSubscoreFields.map(([scoreField]) => sanitized[scoreField]));
  if (calculatedOverall !== null) {
    sanitized.overallScoreOutOf10 = calculatedOverall;
  }

  return sanitized;
}

function getResumeTextQuality(text) {
  const cleanedText = normalizeResumeText(text);
  const characters = cleanedText.length;
  const words = countResumeWords(cleanedText);
  const alphaCharacters = (cleanedText.match(/[A-Za-z]/g) || []).length;
  const controlCharacters = (cleanedText.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length;
  const pdfInternalMarkers = (cleanedText.match(/\b(obj|endobj|stream|endstream|xref|trailer|FlateDecode|startxref)\b/g) || [])
    .length;
  const alphaRatio = characters ? alphaCharacters / characters : 0;
  const controlRatio = characters ? controlCharacters / characters : 0;

  if (characters < 200 || words < 30) {
    return { ok: false, code: 'EXTRACTED_TEXT_TOO_SHORT', message: 'Extracted text is too short.' };
  }

  if (alphaRatio < 0.35 || controlRatio > 0.02 || pdfInternalMarkers >= 4) {
    return { ok: false, code: 'CORRUPTED_TEXT', message: 'Extracted text appears corrupted or binary-like.' };
  }

  return { ok: true, words };
}

function dataUrlToBuffer(dataUrl, expectedMimeTypes) {
  if (typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:([^;,]+)(?:;[^,]*)?;base64,(.+)$/);
  if (!match || !expectedMimeTypes.includes(match[1])) return null;
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
    bytes: Math.ceil((match[2].length * 3) / 4)
  };
}

async function transcribeAudioDataUrl({ dataUrl, mimeType, logPrefix = '[audio-transcribe]' }) {
  const decodedRecording = dataUrlToBuffer(dataUrl, ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav']);
  if (!decodedRecording || decodedRecording.buffer.length < 1000) {
    console.error(`${logPrefix} invalid or empty audio payload`, {
      requestMimeType: mimeType,
      decodedMimeType: decodedRecording?.mimeType,
      bytes: decodedRecording?.buffer.length || 0
    });
    return { error: { status: 400, message: 'We couldn’t clearly transcribe your answer. Please try again or use Type Instead.' } };
  }

  const formData = new FormData();
  formData.append('model', process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe');
  formData.append('file', new Blob([decodedRecording.buffer], { type: mimeType || decodedRecording.mimeType || 'audio/webm' }), 'interview-answer.webm');

  console.info(`${logPrefix} transcription request starting`, {
    model: process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe',
    mimeType: mimeType || decodedRecording.mimeType || 'audio/webm',
    bytes: decodedRecording.buffer.length
  });
  const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: formData
  });
  console.info(`${logPrefix} transcription response`, { status: transcriptionResponse.status, ok: transcriptionResponse.ok });
  if (!transcriptionResponse.ok) {
    const details = await transcriptionResponse.text();
    console.error(`${logPrefix} OpenAI transcription failed`, {
      status: transcriptionResponse.status,
      details: details.slice(0, 800)
    });
    return { error: { status: 502, message: 'We couldn’t clearly transcribe your answer. Please try again or use Type Instead.', details } };
  }
  const transcription = await transcriptionResponse.json();
  const transcript = String(transcription.text || '').trim();
  if (transcript.length < 10) {
    console.error(`${logPrefix} transcript too short`, { transcriptLength: transcript.length });
    return { error: { status: 400, message: 'We couldn’t clearly transcribe your answer. Please try again or use Type Instead.' } };
  }
  return { transcript };
}

async function extractPdfResumeText({ dataUrl, fileName }) {
  const decoded = dataUrlToBuffer(dataUrl, ['application/pdf']);
  if (!decoded) {
    return { error: { status: 400, code: 'UNSUPPORTED_FILE_TYPE', message: 'Invalid payload: upload a PDF file.' } };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      error: {
        status: 500,
        code: 'MISSING_OPENAI_API_KEY',
        message: 'OPENAI_API_KEY is not configured on the backend.'
      }
    };
  }

  try {
    const model = process.env.OPENAI_VISION_MODEL || process.env.OPENAI_PDF_MODEL || 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        instructions:
          'Extract clean resume text from the uploaded PDF. Preserve section headings, line breaks, and bullet ordering as plain text. Return only valid JSON that matches the schema. Do not critique the resume.',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_file',
                filename: fileName || 'resume.pdf',
                file_data: dataUrl
              },
              {
                type: 'input_text',
                text: 'Extract the resume content from this PDF for later investment banking resume analysis.'
              }
            ]
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'resume_extraction',
            strict: true,
            schema: resumeExtractionSchema
          }
        },
        max_output_tokens: 2200
      })
    });

    if (!response.ok) {
      const details = await response.text();
      return {
        error: {
          status: 502,
          code: 'PDF_EXTRACTION_FAILED',
          message: 'We couldn’t process this PDF. Please upload a readable PDF resume.',
          details
        }
      };
    }

    const data = await response.json();
    const outputText = extractResponseText(data);
    if (!outputText) {
      return {
        error: {
          status: 502,
          code: 'PDF_EXTRACTION_FAILED',
          message: 'We couldn’t process this PDF. Please upload a readable PDF resume.'
        }
      };
    }

    const extracted = JSON.parse(outputText);
    const resumeText = normalizeResumeText(extracted.resumeText);
    const quality = getResumeTextQuality(resumeText);

    if (!quality.ok) {
      return {
        error: {
          status: 422,
          code: quality.code,
          message:
            quality.code === 'CORRUPTED_TEXT'
              ? 'We couldn’t process this PDF. Please upload a readable PDF resume.'
              : 'Extracted text is too short. Please upload a readable PDF resume.'
        }
      };
    }

    return {
      resumeText,
      formattingMetadata: extracted.formattingMetadata || {
        detectedSections: ['PDF processed by OpenAI'],
        bulletCount: (resumeText.match(/[\u2022-]\s+/g) || []).length,
        lineCount: resumeText.split('\n').filter((line) => line.trim()).length
      },
      warnings: extracted.warnings || []
    };
  } catch (error) {
    return {
      error: {
        status: 422,
        code: 'PDF_EXTRACTION_FAILED',
        message: 'We couldn’t process this PDF. Please upload a readable PDF resume.',
        details: error.message
      }
    };
  }
}

app.post('/api/resume-extract', async (req, res) => {
  try {
    const { fileName, mimeType, dataUrl } = req.body;
    const supportedFileTypes = ['application/pdf'];

    if (!supportedFileTypes.includes(mimeType) || typeof dataUrl !== 'string') {
      return res.status(400).json({
        code: 'UNSUPPORTED_FILE_TYPE',
        error: 'Please upload a PDF resume.'
      });
    }

    if (mimeType === 'application/pdf') {
      const extractedPdf = await extractPdfResumeText({ dataUrl, fileName });
      if (extractedPdf.error) {
        return res.status(extractedPdf.error.status).json({
          code: extractedPdf.error.code,
          error: extractedPdf.error.message,
          details: extractedPdf.error.details
        });
      }

      return res.json(extractedPdf);
    }
    return res.status(400).json({
      code: 'UNSUPPORTED_FILE_TYPE',
      error: 'Please upload a PDF resume.'
    });
  } catch (error) {
    return res.status(500).json({
      code: 'EXTRACTION_FAILED',
      error: 'Failed to extract resume content.',
      details: error.message
    });
  }
});

app.post('/api/resume-analyzer', async (req, res) => {
  try {
    const { resumeText } = req.body;
    const cleanedResumeText = normalizeResumeText(resumeText);
    const quality = getResumeTextQuality(cleanedResumeText);

    if (typeof resumeText !== 'string') {
      return res.status(400).json({ code: 'EXTRACTED_TEXT_TOO_SHORT', error: 'Invalid payload: resumeText is required.' });
    }

    if (!quality.ok) {
      return res.status(400).json({
        code: quality.code,
        error:
          quality.code === 'CORRUPTED_TEXT'
            ? 'Resume text appears corrupted or binary-like. Upload a readable PDF resume.'
            : 'Resume text is too short for useful analysis.'
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        code: 'MISSING_OPENAI_API_KEY',
        error: 'OPENAI_API_KEY is not configured on the backend.'
      });
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        instructions:
          [
            'You are an investment banking resume reviewer evaluating an undergraduate candidate. Be direct, specific, realistic, and recruiting-focused.',
            'Evaluate banking relevance, finance/accounting/valuation exposure, leadership, quantified impact, bullet strength, resume positioning, school/GPA signals if present, transaction/deal relevance if present, and missing signals. Avoid generic career advice.',
            'Primary calibration lens: would this candidate realistically be competitive in investment banking recruiting? Do not score a resume highly merely because it is a decent general college resume.',
            'Do not globally compress scores downward. Strong finance/IB resumes with meaningful finance exposure, polished section order, strong leadership, and technical evidence should still score highly, often around 8.5-9.5 overall with 10/10 formatting when deserved.',
            'Scores should reflect actual resume quality. If a subscore category has no meaningful category-specific issue, it can receive a true 10/10. Do not invent critiques or force point-loss reasons just to avoid a perfect score.',
            'overallScoreOutOf10 should be precise to one decimal place when appropriate, such as 8.1, 8.4, or 8.7. Do not bucket or round the overall score to only whole numbers or 0.5 increments.',
            'Subscores should use 0.5 increments only, such as 8.5, 9.0, 9.5, or 10.0. The overall score should be a one-decimal composite influenced by all six subscores: IB Readiness, Formatting, Experience, Leadership, Technical Relevance, and Spelling & Grammar.',
            'Category boundaries: Formatting is structure/order/organization only. Spelling & Grammar is spelling, grammar, punctuation correctness, sentence clarity, professional writing mechanics, and tense consistency. Experience is work quality/relevance. Leadership is leadership quality/impact. Technical Relevance is finance technicality/modeling/valuation exposure. IB Readiness is overall recruiting readiness.',
            'IB Readiness anchors: 9-10 means strong IB-ready candidate with meaningful finance exposure and polished recruiting profile; 7-8 means competitive finance/business candidate with some gaps; 5-6 means general business student with limited direct finance preparation; 3-4 means weak/non-finance recruiting profile with little evidence of IB readiness; 1-2 means very underdeveloped profile.',
            'IB Readiness should heavily reward finance internships, accounting/audit/TAS/valuation exposure, IB exposure, selective finance programs, technical finance coursework/certifications, analytical rigor, recruiting sophistication, finance-oriented leadership, and polished finance resume presentation. It should heavily penalize generic customer service resumes, lack of finance/business exposure, generic extracurriculars, weak or unquantified bullets, and no evidence of finance recruiting preparation.',
            'Technical Relevance should only reward finance/accounting exposure, valuation/modeling, financial analysis, markets knowledge, Excel/modeling tools, Bloomberg/finance coursework, analytical finance work, and transaction/deal exposure. Generic math skills, teamwork, customer service, or generic data analysis should not materially increase technical score. If there is almost no finance/accounting/technical exposure, Technical Relevance should usually be about 1.5-3.5.',
            'Experience should reward analytical complexity, business relevance, finance relevance, progression/selectivity, quantified impact, and professional sophistication. Basic retail/customer service roles with weak bullets should not score highly; customer service alone should not exceed mid-range unless highly quantified, leadership-heavy, operationally sophisticated, or clearly impactful.',
            'Leadership should distinguish passive membership from real leadership responsibility and selective/high-prestige leadership. Reward president, founder, executive board, selective finance programs, investment clubs, student investment funds, and competitive business organizations. Penalize generic membership, unquantified involvement, and weak participation bullets.',
            'Expected overall calibration: strong finance resumes should land around 8.5-9.5 overall; average business students around 5.5-7; weak/general student resumes around 3.5-5.5.',
            'High school content category rule: high school education, high school GPA, and high school extracurriculars are primarily IB Readiness/content maturity issues for college/post-college IB recruiting. Do not double-penalize high school content under Formatting unless it creates a separate, true organization problem beyond merely being present.',
            'Formatting score calibration: formatting is not content quality and not writing mechanics. Content quality belongs in Experience, Leadership, Technical Relevance, and IB Readiness. Grammar, spelling, punctuation correctness, sentence clarity, and tense usage belong only in Spelling & Grammar.',
            'Formatting anchors: 10/10 means standard finance resume structure with clean organization and no material formatting issues; 8.5-9.5 means mostly standard structure with minor issues; 7.0-8.0 means readable with one or two clear formatting/organization issues; 5.0-6.5 means general student resume structure with multiple formatting/organization issues; 3.0-4.5 means poorly structured or hard to scan.',
            'For formatting, evaluate only reliable structure signals visible in extracted text.',
            'Evaluate section order: name/contact, Education, Work Experience, Leadership/Activities/Involvement/Extracurriculars or adjacent section, then Additional/Skills/Certifications/Interests. Treat the final additional section name flexibly and do not score it harshly.',
            'Preferred finance/IB section order is: name/contact, Education, Work Experience, Leadership/Activities/Involvement/Extracurriculars or adjacent section, then Additional/Skills/Certifications/Interests/Other. Treat the final additional section name flexibly.',
            'Formatting checks may include only: standard finance resume section ordering, clear section hierarchy, consistent section naming, date/location formatting consistency, company/title/location/date line consistency, resume organization, and standard one-page finance structure.',
            'Formatting should also evaluate reverse-chronological ordering when dates are clear: Work Experience and Leadership/Activities/Extracurriculars entries should generally run from most recent to oldest within their own section. Use end-date priority: Present, Current, or Incoming roles come first, then completed roles by most recent end date, then start date only as a tiebreaker. Do not compare chronology across unrelated sections. Do not flag overlapping roles, multi-position organizations, concurrent experiences, or active roles with older start dates unless the ordering is clearly incorrect.',
            'Do not evaluate bullet-ending punctuation. Do not mention bullets using periods versus not using periods. Do not deduct formatting points for periods or no periods at the end of bullets. Do not invent exact counts like "two bullets" unless directly and reliably extracted.',
            'Do not flag line wrapping, OCR artifacts, PDF extraction artifacts, or isolated ambiguous cases.',
            'Resume convention structure checks may include only: contact info appears at top, education is near top, work experience appears before leadership/additional sections, clear section headers exist, and the resume is organized into standard sections.',
            'For weak/general resumes, finance formatting standards are stricter than general student resume standards. When reliably observable from extracted text, formatting may lose points for non-finance resume structure, generic objective/summary sections, soft-skill-heavy Skills sections placed as major resume sections, unclear hierarchy, outdated student-resume organization, date/location inconsistency, or clearly non-reverse-chronological section ordering. Do not hallucinate visual issues.',
            'High school education, high school GPA, and high school extracurriculars generally should not appear on college sophomore/junior/senior/post-college IB resumes. SAT/ACT may be acceptable for undergrads if strong/relevant. If high school content appears and the candidate does not look like a freshman, reflect it under IB Readiness because it can signal an underdeveloped recruiting resume. Do not put high school content under Formatting merely because it is present.',
            'Do not evaluate or mention bullet spacing, visual alignment, font size, bolding, margins, whitespace, exact visual density, section header visual styling, or layout aesthetics. The PDF extraction path does not preserve those visual details reliably.',
            'Do not penalize formatting for bullet wording strength, action verb quality, bullet strength, tone, grammar, spelling, tense usage, subjective directness, or section density unless extreme. Put bullet quality, action verb, and wording strength critiques under Experience or Leadership, and put writing mechanics under Spelling & Grammar.',
            'Do not harshly penalize strong sections being somewhat lengthy, leadership sections with several bullets, additional-section naming flexibility, or normal one-page finance resume density.',
            'For a resume that follows standard section order, has clear hierarchy, and has consistent extracted-text structure, formatting should be 10/10 if no material formatting issue exists.',
            'formattingFeedback must be specific and evidence-based. Good examples: "Date formatting is consistent across roles"; "Section order follows standard finance resume convention"; "Company, title, location, and date lines follow a consistent structure." Avoid bullet-ending punctuation comments and vague claims like sections being too lengthy unless obviously true.',
            'If no reliable structure formatting problems are found, give formatting 10/10 and say: "No material formatting concerns detected." Do not provide pointLossReasons or improvements for a 10/10 formatting score.',
            'Spelling & Grammar must evaluate spelling, grammar, capitalization, sentence clarity, punctuation correctness, professional writing mechanics, and tense consistency. It must not evaluate resume ordering, section hierarchy, finance relevance, or content strength. Punctuation correctness excludes bullet-ending period/no-period style; do not treat consistently omitted bullet-ending periods as an error.',
            'If a bullet starts with a lowercase word when it should begin a sentence/action verb, flag it under Spelling & Grammar. For example, "responsible for assisting..." should lose spelling/grammar/writing-mechanics points because it begins lowercase and uses weak sentence mechanics. Do not put lowercase bullet starts under Formatting.',
            'Tense consistency rules: current roles should primarily use present tense action verbs; completed roles should primarily use past tense; incoming or future roles may use future-oriented phrasing such as "will support", "incoming", or "expected to join". Do not over-penalize mixed tense caused by role transitions, future internships, or hybrid current responsibilities. Deduct only when tense usage is clearly inconsistent or incorrect.',
            'Return scoreDetails for ibReadiness, formatting, experience, leadership, technicalRelevance, and spellingGrammar. Each scoreDetails item must use the exact same numeric score as the corresponding top-level score field.',
            'For each scoreDetails item, positives, pointLossReasons, and improvements must be specific and evidence-based. If a subscore is less than 10, pointLossReasons must explain exactly what prevented a 10/10. If a subscore is 10, pointLossReasons must be an empty array and improvements may be an empty array.',
            'For scoreDetails.formatting, pointLossReasons and improvements must only use structure/order/organization reasons. Never include grammar, spelling, punctuation, tense, sentence clarity, visual spacing, alignment, bolding, font, margin, whitespace, visual density, section header styling, layout aesthetics, or high school content by itself.',
            'For scoreDetails.spellingGrammar, include tense consistency when relevant. If there are no material spelling, grammar, punctuation correctness, sentence clarity, writing mechanics, or tense issues, spellingGrammarScore may be 10/10.',
            'Avoid vague point-loss reasons such as "could be stronger" or "needs more polish." Name the missing signal, inconsistency, weak evidence, or resume convention issue.',
            'Bullet rewrites should be credible, concise, action-oriented, quantified when possible, and suitable for an IB resume.'
          ].join(' '),
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify({
                  resumeText: cleanedResumeText,
                  reviewLens: 'Investment banking analyst recruiting resume review'
                })
              }
            ]
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'resume_analysis',
            strict: true,
            schema: resumeAnalysisSchema
          }
        },
        max_output_tokens: 3000
      })
    });

    if (!response.ok) {
      const details = await response.text();
      return res.status(502).json({ code: 'OPENAI_ANALYSIS_FAILED', error: 'OpenAI resume analyzer request failed.', details });
    }

    const data = await response.json();
    const outputText = extractResponseText(data);

    if (!outputText) {
      return res.status(502).json({ code: 'OPENAI_ANALYSIS_FAILED', error: 'OpenAI resume analyzer response was empty.' });
    }

    return res.json(sanitizeFormattingAnalysis(JSON.parse(outputText), cleanedResumeText));
  } catch (error) {
    return res.status(500).json({ code: 'ANALYSIS_FAILED', error: 'Failed to analyze resume.', details: error.message });
  }
});

app.post('/api/networking-outreach', async (req, res) => {
  try {
    const { outreachType, firm, office, group, bankerSeniority, tone } = req.body;

    if (!outreachType || !firm || !bankerSeniority || !tone) {
      return res.status(400).json({ error: 'Invalid payload: outreachType, firm, bankerSeniority, and tone are required.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the backend.' });
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        instructions:
          'You draft concise, professional investment banking networking outreach for a strong undergraduate candidate. Keep the message credible, specific, respectful of the banker’s time, and not overly flattering. For LinkedIn messages, keep it short and return an empty subjectLine. For emails, include a useful subject line.',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify({
                  outreachType,
                  firm,
                  office: office || '',
                  group: group || '',
                  bankerSeniority,
                  tone
                })
              }
            ]
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'networking_outreach_draft',
            strict: true,
            schema: outreachDraftSchema
          }
        },
        max_output_tokens: 800
      })
    });

    if (!response.ok) {
      const details = await response.text();
      return res.status(502).json({ error: 'OpenAI outreach request failed.', details });
    }

    const data = await response.json();
    const outputText = extractResponseText(data);
    if (!outputText) {
      return res.status(502).json({ error: 'OpenAI outreach response was empty.' });
    }

    return res.json(JSON.parse(outputText));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate outreach draft.', details: error.message });
  }
});

app.post('/api/interview-feedback', async (req, res) => {
  try {
    const { category, question, userAnswer, prepProfile, followUpContext } = req.body;
    console.log('[interview-feedback] Request received', {
      route: 'POST /api/interview-feedback',
      category,
      questionPreview: typeof question === 'string' ? question.slice(0, 90) : undefined,
      answerLength: typeof userAnswer === 'string' ? userAnswer.length : 0,
      recruitingGoal: prepProfile?.recruitingGoal,
      targetGroups: prepProfile?.targetGroups,
      targetBankTier: prepProfile?.targetBankTier,
      practiceMode: prepProfile?.practiceMode,
      hasResumeText: Boolean(prepProfile?.resumeText),
      isFollowUp: Boolean(followUpContext),
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    });

    if (!category || !question || !userAnswer) {
      console.error('[interview-feedback] Invalid payload');
      return res.status(400).json({ error: 'Invalid payload: category, question, and userAnswer are required.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('[interview-feedback] OPENAI_API_KEY missing. Expected root .env at:', envPath);
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the backend.' });
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        instructions:
          'You are an investment banking interviewer evaluating a candidate. Be strict but fair, constructive, specific, realistic, and concise. Score based on interview readiness, structure, technical accuracy where relevant, specificity, and credibility. Use the provided prep profile only within its limits: recruiting goal, selected target groups, target bank tier, and practice mode. If practiceMode is resume-aware and resumeText is provided, you may reference only resume details explicitly present in that text; do not invent companies, roles, metrics, internships, leadership experiences, deals, skills, or industries. If practiceMode is generic, do not pretend to know anything about the candidate’s background and keep examples broadly applicable. Do not penalize the candidate for not mentioning unrelated groups they did not target. Technical feedback should be driven primarily by the selected target groups, not by resume content. If followUpContext is present, evaluate the answer as a direct follow-up to the parent question and parent answer, while still scoring it like a normal interview response. The 10/10 example response must sound like something a strong candidate with this profile mode could actually say in a real interview.',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify({
                  category,
                  question,
                  userAnswer,
                  prepProfile: prepProfile || null,
                  followUpContext: followUpContext || null
                })
              }
            ]
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'interview_feedback',
            strict: true,
            schema: feedbackSchema
          }
        },
        max_output_tokens: 1200
      })
    });

    if (!response.ok) {
      const details = await response.text();
      console.error('[interview-feedback] OpenAI request failed', {
        status: response.status,
        statusText: response.statusText,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        details
      });
      return res.status(502).json({ error: 'OpenAI feedback request failed.', details });
    }

    const data = await response.json();
    const outputText = extractResponseText(data);

    if (!outputText) {
      console.error('[interview-feedback] OpenAI response contained no output text', data);
      return res.status(502).json({ error: 'OpenAI feedback response was empty.' });
    }

    let feedback;
    try {
      feedback = JSON.parse(outputText);
    } catch (parseError) {
      console.error('[interview-feedback] Failed to parse OpenAI JSON output', {
        parseError,
        outputPreview: outputText.slice(0, 500)
      });
      return res.status(502).json({ error: 'OpenAI feedback response was not valid JSON.' });
    }
    console.log('[interview-feedback] Feedback generated', {
      scoreOutOf10: feedback.scoreOutOf10,
      followUpQuestionPreview: feedback.followUpQuestion?.slice(0, 90)
    });
    return res.json(feedback);
  } catch (error) {
    console.error('[interview-feedback] Failed to generate feedback', error);
    return res.status(500).json({ error: 'Failed to generate interview feedback.', details: error.message });
  }
});

app.post('/api/interview-transcribe', async (req, res) => {
  try {
    const { dataUrl, mimeType } = req.body;
    console.info('[interview-transcribe] route hit', {
      mimeType,
      payloadChars: typeof dataUrl === 'string' ? dataUrl.length : 0,
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY)
    });
    if (!dataUrl) {
      return res.status(400).json({ error: 'We couldn’t clearly transcribe your answer. Please try again or use Type Instead.' });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the backend.' });
    }
    const result = await transcribeAudioDataUrl({ dataUrl, mimeType, logPrefix: '[interview-transcribe]' });
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message, details: result.error.details });
    }
    return res.json({ transcript: result.transcript });
  } catch (error) {
    console.error('[interview-transcribe] Failed to transcribe answer', error);
    return res.status(500).json({ error: 'We couldn’t clearly transcribe your answer. Please try again or use Type Instead.', details: error.message });
  }
});

app.post('/api/interview-question', async (req, res) => {
  try {
    const { categoryId, categoryTitle, previousPrompt, prepProfile, questionPlan, generatedQuestionHistory } = req.body;
    console.log('[interview-question] Request received', {
      route: 'POST /api/interview-question',
      categoryId,
      categoryTitle,
      previousPromptPreview: typeof previousPrompt === 'string' ? previousPrompt.slice(0, 90) : undefined,
      targetGroups: prepProfile?.targetGroups,
      targetBankTier: prepProfile?.targetBankTier,
      practiceMode: prepProfile?.practiceMode,
      hasResumeText: Boolean(prepProfile?.resumeText),
      questionPlan: questionPlan
        ? {
            tailoringLevel: questionPlan.tailoringLevel,
            topic: questionPlan.topic,
            groupType: questionPlan.groupType,
            questionCategory: questionPlan.questionCategory,
            resumeExperience: questionPlan.resumeExperience
              ? {
                  type: questionPlan.resumeExperience.type,
                  organization: questionPlan.resumeExperience.organization,
                  title: questionPlan.resumeExperience.title,
                  tier: questionPlan.resumeExperience.tier
                }
              : null,
            promptPreview: typeof questionPlan.prompt === 'string' ? questionPlan.prompt.slice(0, 90) : undefined
          }
        : null,
      generatedQuestionCount: Array.isArray(generatedQuestionHistory) ? generatedQuestionHistory.length : 0,
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    });

    if (!categoryId || !categoryTitle || !prepProfile) {
      return res.status(400).json({ error: 'Invalid payload: categoryId, categoryTitle, and prepProfile are required.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the backend.' });
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        instructions:
          'You are a realistic investment banking interviewer. Generate exactly one concise interview question for the requested practice category and questionPlan. Keep questions one sentence whenever possible, direct, and banker-like. Use only the candidate prep profile provided: recruiting goal, selected target groups, target bank tier, practice mode, resumeContext, and resumeText when present. Respect questionPlan.questionCategory and do not duplicate mandatory categories such as whyIB, whyBank, or whyGroup. If questionPlan.resumeExperience is provided, use that specific explicit resume item for any resume-specific question; do not switch back to the first, most recent, or most finance-relevant resume item. Tier 1 experiences can support deeper banking motivation questions, Tier 2 experiences should usually be framed around transferable skills or professional learning, and Tier 3 experiences should be broad supporting-experience questions rather than obscure trivia. Respect questionPlan.tailoringLevel: generic means broad and no background reference; light means broad with only a general internship/class/leadership framing; specific means occasional resume-aware reference to one explicit resume detail only. Do not make every question hyper-specific. If practiceMode is generic, generate broad interview questions only and do not pretend to know the candidate’s background. If practiceMode is resume-aware, you may reference only companies, roles, responsibilities, metrics, skills, activities, or experiences explicitly present in resumeText or resumeContext; do not invent or infer details. Technical questions should not be freely generated unless a questionPlan explicitly requests one; technical content must be selected-group driven. Market questions for Summer Analyst candidates should usually be basic market awareness, not MBA-level strategy. Do not ask about an unselected group or industry unless the profile selected Generalist. Avoid generic AI wording and overly academic phrasing. Do not repeat the previous prompt or any item in generatedQuestionHistory.',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify({
                  categoryId,
                  categoryTitle,
                  previousPrompt: previousPrompt || '',
                  prepProfile,
                  questionPlan: questionPlan || null,
                  generatedQuestionHistory: Array.isArray(generatedQuestionHistory) ? generatedQuestionHistory.slice(-8) : []
                })
              }
            ]
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'interview_question',
            strict: true,
            schema: interviewQuestionSchema
          }
        },
        max_output_tokens: 220
      })
    });

    if (!response.ok) {
      const details = await response.text();
      console.error('[interview-question] OpenAI request failed', {
        status: response.status,
        statusText: response.statusText,
        details
      });
      return res.status(502).json({ error: 'OpenAI question request failed.', details });
    }

    const data = await response.json();
    const outputText = extractResponseText(data);
    if (!outputText) {
      return res.status(502).json({ error: 'OpenAI question response was empty.' });
    }

    return res.json(JSON.parse(outputText));
  } catch (error) {
    console.error('[interview-question] Failed to generate question', error);
    return res.status(500).json({ error: 'Failed to generate interview question.', details: error.message });
  }
});

app.post('/api/hirevue-evaluate', async (req, res) => {
  try {
    const { setup, question, dataUrl, mimeType, durationSeconds } = req.body;
    console.info('[hirevue-evaluate] route hit', {
      hasSetup: Boolean(setup),
      hasQuestion: Boolean(question),
      mimeType,
      durationSeconds,
      payloadChars: typeof dataUrl === 'string' ? dataUrl.length : 0
    });
    if (!setup || !question || !dataUrl) {
      return res.status(400).json({ error: 'Invalid payload: setup, question, and recording are required.' });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the backend.' });
    }

    const decodedRecording = dataUrlToBuffer(dataUrl, ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav']);
    if (!decodedRecording) {
      console.error('[hirevue-evaluate] invalid audio payload', { mimeType });
      return res.status(400).json({ error: 'We couldn’t analyze the audio. Please retry the recording.' });
    }
    console.info('[hirevue-evaluate] audio payload decoded', {
      requestMimeType: mimeType,
      decodedMimeType: decodedRecording.mimeType,
      bytes: decodedRecording.buffer.length,
      audioExists: decodedRecording.buffer.length > 0
    });
    if (decodedRecording.buffer.length < 1000) {
      console.error('[hirevue-evaluate] audio payload too small', { bytes: decodedRecording.buffer.length });
      return res.status(400).json({ error: 'We couldn’t analyze the audio. Please retry the recording.' });
    }

    const formData = new FormData();
    formData.append('model', process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe');
    formData.append('file', new Blob([decodedRecording.buffer], { type: mimeType || decodedRecording.mimeType || 'audio/webm' }), 'hirevue-response.webm');

    console.info('[hirevue-evaluate] transcription request starting', {
      model: process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe',
      mimeType: mimeType || decodedRecording.mimeType || 'audio/webm',
      bytes: decodedRecording.buffer.length
    });
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData
    });
    console.info('[hirevue-evaluate] transcription response', { status: transcriptionResponse.status, ok: transcriptionResponse.ok });
    if (!transcriptionResponse.ok) {
      const details = await transcriptionResponse.text();
      console.error('[hirevue-evaluate] OpenAI transcription failed', {
        status: transcriptionResponse.status,
        details: details.slice(0, 800)
      });
      return res.status(502).json({ error: 'We couldn’t analyze the audio. Please retry the recording.', details });
    }
    const transcription = await transcriptionResponse.json();
    const transcript = String(transcription.text || '').trim();
    if (transcript.length < 20) {
      console.error('[hirevue-evaluate] transcript too short', { transcriptLength: transcript.length });
      return res.status(400).json({ error: 'We couldn’t analyze the audio. Please retry the recording.' });
    }

    const evaluationContext = {
      setup: {
        firm: setup.firm,
        group: setup.group,
        hireType: setup.hireType
      },
      question,
      transcript,
      durationSeconds
    };
    console.info('[hirevue-evaluate] feedback request starting', {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      transcriptLength: transcript.length
    });
    const evaluationResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        instructions:
          'You evaluate investment banking HireVue-style first-round responses using transcript text only. Be realistic, concise, and grounded only in the words spoken. Evaluate answer structure, clarity, conciseness, relevance to the question, professionalism/confidence based on wording, and filler or repetitive language only if detectable from the transcript. Do not evaluate or mention eye contact, facial expression, body language, lighting, camera framing, appearance, or visual delivery.',
        input: [{ role: 'user', content: [{ type: 'input_text', text: JSON.stringify(evaluationContext) }] }],
        text: {
          format: {
            type: 'json_schema',
            name: 'hirevue_evaluation',
            strict: true,
            schema: hireVueEvaluationSchema
          }
        },
        max_output_tokens: 1200
      })
    });
    console.info('[hirevue-evaluate] feedback response', { status: evaluationResponse.status, ok: evaluationResponse.ok });
    if (!evaluationResponse.ok) {
      const details = await evaluationResponse.text();
      console.error('[hirevue-evaluate] OpenAI feedback request failed', {
        status: evaluationResponse.status,
        details: details.slice(0, 800)
      });
      return res.status(502).json({ error: 'We couldn’t analyze the audio. Please retry the recording.', details });
    }
    const evaluationData = await evaluationResponse.json();
    const outputText = extractResponseText(evaluationData);
    if (!outputText) {
      console.error('[hirevue-evaluate] feedback response empty');
      return res.status(502).json({ error: 'We couldn’t analyze the audio. Please retry the recording.' });
    }
    return res.json({ ...JSON.parse(outputText), transcript });
  } catch (error) {
    console.error('[hirevue-evaluate] Failed to evaluate response', error);
    return res.status(500).json({ error: 'We couldn’t analyze the audio. Please retry the recording.', details: error.message });
  }
});

function startServer(port, usedFallback = false) {
  const server = app.listen(port, () => {
    console.log('[startup] Banker Builder backend started');
    console.log(`[startup] URL: http://localhost:${port}`);
    console.log(`[startup] Loaded .env path: ${envPath}`);
    console.log(`[startup] .env load status: ${dotenvResult.error ? `failed (${dotenvResult.error.message})` : 'loaded'}`);
    console.log(`[startup] OPENAI_API_KEY present: ${Boolean(process.env.OPENAI_API_KEY)}`);
    if (usedFallback) {
      console.log(`[startup] Port 4000 was busy. Frontend dev requests should use VITE_API_BASE_URL=http://localhost:${port}`);
    }
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      if (!process.env.PORT && port === 4000) {
        const fallbackPort = 4001;
        console.error(`[startup] Port 4000 is already in use. Trying fallback port ${fallbackPort}.`);
        startServer(fallbackPort, true);
        return;
      }

      console.error(`[startup] Port ${port} is already in use. Stop the existing process or set PORT to another value.`);
      process.exit(1);
    }

    console.error('[startup] Server failed to start', error);
    process.exit(1);
  });
}

startServer(preferredPort);
