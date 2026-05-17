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
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match || !expectedMimeTypes.includes(match[1])) return null;
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
    bytes: Math.ceil((match[2].length * 3) / 4)
  };
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
          'Extract clean resume text from the uploaded PDF. Preserve section headings, line breaks, bullet ordering, and obvious spacing cues as plain text. Return only valid JSON that matches the schema. Do not critique the resume.',
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
          message: 'We couldn’t process this PDF. Try uploading a screenshot or pasting the text.',
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
          message: 'We couldn’t process this PDF. Try uploading a screenshot or pasting the text.'
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
              ? 'We couldn’t process this PDF. Try uploading a screenshot or pasting the text.'
              : 'Extracted text is too short. Try uploading a screenshot or pasting the text.'
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
        message: 'We couldn’t process this PDF. Try uploading a screenshot or pasting the text.',
        details: error.message
      }
    };
  }
}

app.post('/api/resume-extract', async (req, res) => {
  try {
    const { fileName, mimeType, dataUrl } = req.body;
    const supportedImageTypes = ['image/png', 'image/jpeg'];
    const supportedFileTypes = ['application/pdf', ...supportedImageTypes];

    if (!supportedFileTypes.includes(mimeType) || typeof dataUrl !== 'string') {
      return res.status(400).json({
        code: 'UNSUPPORTED_FILE_TYPE',
        error: 'Unsupported file type. Upload a PDF, PNG, JPG, or JPEG resume.'
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

    if (!dataUrl.startsWith('data:image/')) {
      return res.status(400).json({
        code: 'UNSUPPORTED_FILE_TYPE',
        error: 'Invalid payload: upload a PNG, JPG, or JPEG image.'
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
          'Extract resume text from the uploaded resume image. Preserve section headings, line breaks, bullet ordering, and obvious spacing cues as plain text. Return only valid JSON that matches the schema. Do not critique the resume.',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify({
                  fileName: fileName || 'resume image',
                  task: 'Extract the resume content faithfully for later investment banking resume analysis.'
                })
              },
              {
                type: 'input_image',
                image_url: dataUrl
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
        max_output_tokens: 1800
      })
    });

    if (!response.ok) {
      const details = await response.text();
      return res.status(502).json({
        code: 'OPENAI_EXTRACTION_FAILED',
        error: 'OpenAI resume extraction request failed.',
        details
      });
    }

    const data = await response.json();
    const outputText = extractResponseText(data);

    if (!outputText) {
      return res.status(502).json({
        code: 'EXTRACTED_TEXT_TOO_SHORT',
        error: 'OpenAI resume extraction response was empty.'
      });
    }

    const extracted = JSON.parse(outputText);
    extracted.resumeText = normalizeResumeText(extracted.resumeText);

    const quality = getResumeTextQuality(extracted.resumeText);
    if (!quality.ok) {
      return res.status(422).json({
        code: quality.code,
        error:
          quality.code === 'CORRUPTED_TEXT'
            ? 'Extracted text appears corrupted. Try a clearer image or paste the text.'
            : 'Extracted text is too short. Try a clearer image or paste the text.'
      });
    }

    return res.json(extracted);
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
            ? 'Resume text appears corrupted or binary-like. Upload a readable resume or paste clean text.'
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
          'You are a strict but practical investment banking resume reviewer. Evaluate the resume for undergraduate and early-career IB recruiting. Be specific, concise, and realistic. Prioritize finance relevance, transaction language, quantification, formatting clarity, leadership, and missing IB signals. Do not invent facts not present in the resume.',
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
        max_output_tokens: 2400
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

    return res.json(JSON.parse(outputText));
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
      workExperiences: prepProfile?.workExperiences,
      leadershipActivities: prepProfile?.leadershipActivities,
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
          'You are an investment banking interviewer evaluating a candidate. Be strict but fair, constructive, specific, realistic, and concise. Score based on interview readiness, structure, technical accuracy where relevant, specificity, and credibility. Use the provided prep profile to tailor feedback to the candidate’s recruiting goal, selected target groups, target bank tier, structured work experience background, and leadership/extracurricular background. Do not penalize the candidate for not mentioning unrelated groups they did not target. If followUpContext is present, evaluate the answer as a direct follow-up to the parent question and parent answer, while still scoring it like a normal interview response. Reward credible links between their background and their selected groups, such as audit/TAS experience connecting to M&A diligence and valuation, DCM candidates discussing rates and credit, restructuring candidates discussing liquidity and capital structure, or student investment fund leadership supporting market judgment. The 10/10 example response must sound like something a strong candidate with this profile could actually say in a real interview.',
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
