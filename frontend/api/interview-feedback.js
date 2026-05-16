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

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { category, question, userAnswer, prepProfile } = parseBody(req);
    console.log('[interview-feedback] Vercel API request received', {
      route: 'POST /api/interview-feedback',
      category,
      questionPreview: typeof question === 'string' ? question.slice(0, 90) : undefined,
      answerLength: typeof userAnswer === 'string' ? userAnswer.length : 0,
      recruitingGoal: prepProfile?.recruitingGoal,
      targetGroups: prepProfile?.targetGroups,
      targetBankTier: prepProfile?.targetBankTier,
      workExperiences: prepProfile?.workExperiences,
      leadershipActivities: prepProfile?.leadershipActivities,
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    });

    if (!category || !question || !userAnswer) {
      return res.status(400).json({ error: 'Invalid payload: category, question, and userAnswer are required.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the serverless API route.' });
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
          'You are an investment banking interviewer evaluating a candidate. Be strict but fair, constructive, specific, realistic, and concise. Score based on interview readiness, structure, technical accuracy where relevant, specificity, and credibility. Use the provided prep profile to tailor feedback to the candidate’s recruiting goal, selected target groups, target bank tier, structured work experience background, and leadership/extracurricular background. Do not penalize the candidate for not mentioning unrelated groups they did not target. Reward credible links between their background and their selected groups, such as audit/TAS experience connecting to M&A diligence and valuation, DCM candidates discussing rates and credit, restructuring candidates discussing liquidity and capital structure, or student investment fund leadership supporting market judgment. The 10/10 example response must sound like something a strong candidate with this profile could actually say in a real interview.',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify({ category, question, userAnswer, prepProfile: prepProfile || null })
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
      return res.status(502).json({ error: 'OpenAI feedback response was empty.' });
    }

    return res.status(200).json(JSON.parse(outputText));
  } catch (error) {
    console.error('[interview-feedback] Serverless route failed', error);
    return res.status(500).json({ error: 'Failed to generate interview feedback.', details: error.message });
  }
}
