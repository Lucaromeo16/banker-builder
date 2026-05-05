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
app.use(express.json());

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

function extractResponseText(responseData) {
  if (responseData.output_text) return responseData.output_text;

  return responseData.output
    ?.flatMap((item) => item.content || [])
    .map((content) => content.text)
    .filter(Boolean)
    .join('\n');
}

app.post('/api/interview-feedback', async (req, res) => {
  try {
    const { category, question, userAnswer } = req.body;
    console.log('[interview-feedback] Request received', {
      category,
      questionPreview: typeof question === 'string' ? question.slice(0, 90) : undefined,
      answerLength: typeof userAnswer === 'string' ? userAnswer.length : 0,
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY)
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
          'You are an investment banking interviewer evaluating a student candidate. Be strict but fair, constructive, specific, realistic, and concise. Score based on interview readiness, structure, technical accuracy where relevant, specificity, and credibility. The 10/10 example response must sound like something a strong undergraduate candidate could actually say in a real interview.',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify({
                  category,
                  question,
                  userAnswer
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

    const feedback = JSON.parse(outputText);
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
