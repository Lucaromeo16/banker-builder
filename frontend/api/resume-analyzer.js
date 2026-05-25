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

const reliableFormattingIssuePattern =
  /\b(section order|order|hierarch|section naming|header|date|location|company|title|role line|organization|organized|one-page|one page|contact|education|work experience|leadership|additional|skills|certifications|interests)\b/i;

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

function sanitizeFormattingAnalysis(analysis) {
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
            'Scores should reflect actual resume quality. If a subscore category has no meaningful category-specific issue, it can receive a true 10/10. Do not invent critiques or force point-loss reasons just to avoid a perfect score.',
            'overallScoreOutOf10 should be precise to one decimal place when appropriate, such as 8.1, 8.4, or 8.7. Do not bucket or round the overall score to only whole numbers or 0.5 increments.',
            'Subscores should use 0.5 increments only, such as 8.5, 9.0, 9.5, or 10.0. The overall score should be a one-decimal composite influenced by all six subscores: IB Readiness, Formatting, Experience, Leadership, Technical Relevance, and Spelling & Grammar.',
            'Category boundaries: Formatting is structure/order/organization only. Spelling & Grammar is spelling, grammar, punctuation correctness, sentence clarity, professional writing mechanics, and tense consistency. Experience is work quality/relevance. Leadership is leadership quality/impact. Technical Relevance is finance technicality/modeling/valuation exposure. IB Readiness is overall recruiting readiness.',
            'Formatting score calibration: formatting is not content quality and not writing mechanics. Content quality belongs in Experience, Leadership, Technical Relevance, and IB Readiness. Grammar, spelling, punctuation correctness, sentence clarity, and tense usage belong only in Spelling & Grammar.',
            'For formatting, evaluate only reliable structure signals visible in extracted text.',
            'Evaluate section order: name/contact, Education, Work Experience, Leadership/Activities/Involvement/Extracurriculars or adjacent section, then Additional/Skills/Certifications/Interests. Treat the final additional section name flexibly and do not score it harshly.',
            'Preferred finance/IB section order is: name/contact, Education, Work Experience, Leadership/Activities/Involvement/Extracurriculars or adjacent section, then Additional/Skills/Certifications/Interests/Other. Treat the final additional section name flexibly.',
            'Formatting checks may include only: standard finance resume section ordering, clear section hierarchy, consistent section naming, date/location formatting consistency, company/title/location/date line consistency, resume organization, and standard one-page finance structure.',
            'Do not evaluate bullet-ending punctuation. Do not mention bullets using periods versus not using periods. Do not deduct formatting points for periods or no periods at the end of bullets. Do not invent exact counts like "two bullets" unless directly and reliably extracted.',
            'Do not flag line wrapping, OCR artifacts, PDF extraction artifacts, or isolated ambiguous cases.',
            'Resume convention structure checks may include only: contact info appears at top, education is near top, work experience appears before leadership/additional sections, clear section headers exist, and the resume is organized into standard sections.',
            'Do not evaluate or mention bullet spacing, visual alignment, font size, bolding, margins, whitespace, exact visual density, section header visual styling, or layout aesthetics. The PDF extraction path does not preserve those visual details reliably.',
            'Do not penalize formatting for bullet wording strength, action verb quality, bullet strength, tone, grammar, spelling, tense usage, subjective directness, or section density unless extreme. Put bullet quality, action verb, and wording strength critiques under Experience or Leadership, and put writing mechanics under Spelling & Grammar.',
            'Do not harshly penalize strong sections being somewhat lengthy, leadership sections with several bullets, additional-section naming flexibility, or normal one-page finance resume density.',
            'For a resume that follows standard section order, has clear hierarchy, and has consistent extracted-text structure, formatting should be 10/10 if no material formatting issue exists.',
            'formattingFeedback must be specific and evidence-based. Good examples: "Date formatting is consistent across roles"; "Section order follows standard finance resume convention"; "Company, title, location, and date lines follow a consistent structure." Avoid bullet-ending punctuation comments and vague claims like sections being too lengthy unless obviously true.',
            'If no reliable structure formatting problems are found, give formatting 10/10 and say: "No material formatting concerns detected." Do not provide pointLossReasons or improvements for a 10/10 formatting score.',
            'Spelling & Grammar must evaluate spelling, grammar, sentence clarity, punctuation correctness, professional writing mechanics, and tense consistency. It must not evaluate resume ordering, section hierarchy, finance relevance, or content strength. Punctuation correctness excludes bullet-ending period/no-period style; do not treat consistently omitted bullet-ending periods as an error.',
            'Tense consistency rules: current roles should primarily use present tense action verbs; completed roles should primarily use past tense; incoming or future roles may use future-oriented phrasing such as "will support", "incoming", or "expected to join". Do not over-penalize mixed tense caused by role transitions, future internships, or hybrid current responsibilities. Deduct only when tense usage is clearly inconsistent or incorrect.',
            'Return scoreDetails for ibReadiness, formatting, experience, leadership, technicalRelevance, and spellingGrammar. Each scoreDetails item must use the exact same numeric score as the corresponding top-level score field.',
            'For each scoreDetails item, positives, pointLossReasons, and improvements must be specific and evidence-based. If a subscore is less than 10, pointLossReasons must explain exactly what prevented a 10/10. If a subscore is 10, pointLossReasons must be an empty array and improvements may be an empty array.',
            'For scoreDetails.formatting, pointLossReasons and improvements must only use structure/order/organization reasons. Never include grammar, spelling, punctuation, tense, sentence clarity, visual spacing, alignment, bolding, font, margin, whitespace, visual density, section header styling, or layout aesthetics.',
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

    return res.status(200).json(sanitizeFormattingAnalysis(JSON.parse(outputText)));
  } catch (error) {
    console.error('[resume-analyzer] Serverless route failed', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ code: 'ANALYSIS_FAILED', error: 'Failed to generate resume analysis.', details: error.message });
  }
}
