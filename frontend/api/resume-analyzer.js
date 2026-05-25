const scoreDetailSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['score', 'positives', 'pointLossReasons', 'improvements'],
  properties: {
    score: {
      type: 'number',
      minimum: 1,
      maximum: 10
    },
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
    'recommendedBulletRewrites',
    'suggestedResumePositioning',
    'nextSteps'
  ],
  properties: {
    overallScoreOutOf10: {
      type: 'number',
      minimum: 1,
      maximum: 10
    },
    ibReadinessScore: {
      type: 'number',
      minimum: 1,
      maximum: 10
    },
    formattingScore: {
      type: 'number',
      minimum: 1,
      maximum: 10
    },
    experienceScore: {
      type: 'number',
      minimum: 1,
      maximum: 10
    },
    leadershipScore: {
      type: 'number',
      minimum: 1,
      maximum: 10
    },
    technicalRelevanceScore: {
      type: 'number',
      minimum: 1,
      maximum: 10
    },
    spellingGrammarScore: {
      type: 'number',
      minimum: 1,
      maximum: 10
    },
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
        ibReadiness: scoreDetailSchema,
        formatting: scoreDetailSchema,
        experience: scoreDetailSchema,
        leadership: scoreDetailSchema,
        technicalRelevance: scoreDetailSchema,
        spellingGrammar: scoreDetailSchema
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
    recommendedBulletRewrites: {
      type: 'array',
      minItems: 2,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['originalBullet', 'rewrittenBullet', 'whyItWorks'],
        properties: {
          originalBullet: {
            type: 'string'
          },
          rewrittenBullet: {
            type: 'string'
          },
          whyItWorks: {
            type: 'string'
          }
        }
      }
    },
    suggestedResumePositioning: {
      type: 'string'
    },
    nextSteps: {
      type: 'array',
      minItems: 3,
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

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body;
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

function dateSortValue(line) {
  const yearMatches = [...line.matchAll(/\b(20\d{2}|19\d{2})\b/g)].map((match) => Number(match[1]));
  if (!yearMatches.length) return null;
  if (/\b(present|current)\b/i.test(line)) return 3000;
  return Math.max(...yearMatches);
}

function hasClearlyOutOfOrderDates(resumeText) {
  const sectionDates = {
    experience: [],
    leadership: [],
    education: []
  };
  let currentSection = '';

  normalizeResumeText(resumeText).split('\n').forEach((line) => {
    const sectionKey = getSectionKey(line);
    if (sectionKey) {
      currentSection = sectionKey;
      return;
    }

    if (!sectionDates[currentSection]) return;
    const sortValue = dateSortValue(line);
    if (sortValue !== null) sectionDates[currentSection].push(sortValue);
  });

  return Object.values(sectionDates).some((dates) =>
    dates.length >= 3 && dates.some((date, index) => index > 0 && date > dates[index - 1])
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

  if (characters < 200 || words < 30) return { ok: false, code: 'EXTRACTED_TEXT_TOO_SHORT' };
  if (alphaRatio < 0.35 || controlRatio > 0.02 || pdfInternalMarkers >= 4) return { ok: false, code: 'CORRUPTED_TEXT' };
  return { ok: true, words };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { resumeText } = parseBody(req);
    const cleanedResumeText = normalizeResumeText(resumeText);
    const quality = getResumeTextQuality(cleanedResumeText);

    console.log('[resume-analyzer] Vercel API request received', {
      route: 'POST /api/resume-analyzer',
      resumeLength: cleanedResumeText.length,
      resumeWords: countResumeWords(cleanedResumeText),
      qualityCode: quality.code || 'OK',
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    });

    if (typeof resumeText !== 'string') {
      return res.status(400).json({ code: 'INVALID_REQUEST_PAYLOAD', error: 'Invalid payload: resumeText is required.' });
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
        error: 'OPENAI_API_KEY is not configured on the serverless API route.'
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
            'Formatting should also evaluate reverse-chronological ordering when dates are clear: Work Experience, Leadership/Activities/Extracurriculars, and Education entries should generally run from most recent to oldest. If dates are clearly out of order within a section, flag it under Formatting with evidence. Do not guess when PDF extraction makes ordering ambiguous.',
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
                text: JSON.stringify({ resumeText: cleanedResumeText })
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
        max_output_tokens: 2600
      })
    });

    if (!response.ok) {
      const details = await response.text();
      console.error('[resume-analyzer] OpenAI request failed', {
        status: response.status,
        statusText: response.statusText,
        details
      });
      return res.status(502).json({ code: 'OPENAI_ANALYSIS_FAILED', error: 'OpenAI resume analysis request failed.', details });
    }

    const data = await response.json();
    const outputText = extractResponseText(data);
    if (!outputText) {
      return res.status(502).json({ code: 'OPENAI_ANALYSIS_FAILED', error: 'OpenAI resume analysis response was empty.' });
    }

    return res.status(200).json(sanitizeFormattingAnalysis(JSON.parse(outputText), cleanedResumeText));
  } catch (error) {
    console.error('[resume-analyzer] Serverless route failed', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ code: 'ANALYSIS_FAILED', error: 'Failed to generate resume analysis.', details: error.message });
  }
}
