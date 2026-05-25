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
    formattingFeedback: {
      type: 'array',
      minItems: 2,
      maxItems: 5,
      items: { type: 'string' }
    },
    scoreDetails: {
      type: 'object',
      additionalProperties: false,
      required: ['ibReadiness', 'formatting', 'experience', 'leadership', 'technicalRelevance'],
      properties: {
        ibReadiness: scoreDetailSchema,
        formatting: scoreDetailSchema,
        experience: scoreDetailSchema,
        leadership: scoreDetailSchema,
        technicalRelevance: scoreDetailSchema
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

function removeUnreliableVisualFormattingClaims(items) {
  return normalizeList(items).filter((item) => {
    if (unreliableVisualFormattingPattern.test(item)) return false;
    if (bulletPunctuationPattern.test(item)) return false;
    return true;
  });
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
  const cleanPointLossReasons = removeUnreliableVisualFormattingClaims(formattingDetail.pointLossReasons);
  const cleanImprovements = removeUnreliableVisualFormattingClaims(formattingDetail.improvements);
  const noMajorIssueText = 'No material issues found.';
  const hasReliablePointLoss = cleanPointLossReasons.some((item) => !/^no major/i.test(item));
  let formattingScore = Number(sanitized.formattingScore);

  if (!Number.isFinite(formattingScore)) formattingScore = Number(formattingDetail.score) || 9;
  if (!hasReliablePointLoss && formattingScore < 8.5) formattingScore = 9;

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
            'Formatting score calibration: formatting is not content quality. Content quality belongs in Experience, Leadership, Technical Relevance, and IB Readiness.',
            'For formatting, evaluate only reliable text-structure signals visible in extracted text.',
            'Evaluate section order: name/contact, Education, Work Experience, Leadership/Activities/Involvement/Extracurriculars or adjacent section, then Additional/Skills/Certifications/Interests. Treat the final additional section name flexibly and do not score it harshly.',
            'Preferred finance/IB section order is: name/contact, Education, Work Experience, Leadership/Activities/Involvement/Extracurriculars or adjacent section, then Additional/Skills/Certifications/Interests/Other. Treat the final additional section name flexibly.',
            'Text-based formatting consistency checks may include only: date formatting, company/title/location/date line consistency, section header consistency, capitalization of section headers, naming conventions, and standard resume section structure.',
            'Do not evaluate bullet-ending punctuation. Do not mention bullets using periods versus not using periods. Do not deduct formatting points for periods or no periods at the end of bullets. Do not invent exact counts like "two bullets" unless directly and reliably extracted.',
            'Do not flag line wrapping, OCR artifacts, PDF extraction artifacts, or isolated ambiguous cases.',
            'Resume convention structure checks may include only: contact info appears at top, education is near top, work experience appears before leadership/additional sections, clear section headers exist, and the resume is organized into standard sections.',
            'Do not evaluate or mention bullet spacing, visual alignment, font size, bolding, margins, whitespace, exact visual density, section header visual styling, or layout aesthetics. The PDF extraction path does not preserve those visual details reliably.',
            'Do not penalize formatting for bullet wording strength, action verb quality, subjective directness, or section density unless extreme. Put bullet quality, action verb, and wording strength critiques under Experience or Leadership instead.',
            'Do not harshly penalize strong sections being somewhat lengthy, leadership sections with several bullets, additional-section naming flexibility, or normal one-page finance resume density.',
            'For a resume that follows standard section order and has consistent extracted-text structure, formatting should generally be 8.5-10 and may be 10/10 if no material text-structure issue exists.',
            'formattingFeedback must be specific and evidence-based. Good examples: "Date formatting is consistent across roles"; "Section order follows standard finance resume convention"; "Company, title, location, and date lines follow a consistent structure." Avoid bullet-ending punctuation comments and vague claims like sections being too lengthy unless obviously true.',
            'If no reliable text-structure formatting problems are found, give formatting a high score or 10/10 and say no material issues found.',
            'Return scoreDetails for ibReadiness, formatting, experience, leadership, and technicalRelevance. Each scoreDetails item must use the exact same numeric score as the corresponding top-level score field.',
            'For each scoreDetails item, positives, pointLossReasons, and improvements must be specific and evidence-based. If a subscore is less than 10, pointLossReasons must explain exactly what prevented a 10/10. If a subscore is 10, pointLossReasons must be an empty array and improvements may be an empty array.',
            'For scoreDetails.formatting, pointLossReasons and improvements must only use text-structure reasons. Never include visual spacing, alignment, bolding, font, margin, whitespace, visual density, section header styling, or layout aesthetics.',
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
