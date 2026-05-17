const questionSchema = {
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
    const { categoryId, categoryTitle, previousPrompt, prepProfile } = parseBody(req);
    console.log('[interview-question] Vercel API request received', {
      route: 'POST /api/interview-question',
      categoryId,
      categoryTitle,
      previousPromptPreview: typeof previousPrompt === 'string' ? previousPrompt.slice(0, 90) : undefined,
      targetGroups: prepProfile?.targetGroups,
      targetBankTier: prepProfile?.targetBankTier,
      workExperiences: prepProfile?.workExperiences,
      leadershipActivities: prepProfile?.leadershipActivities,
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    });

    if (!categoryId || !categoryTitle || !prepProfile) {
      return res.status(400).json({ error: 'Invalid payload: categoryId, categoryTitle, and prepProfile are required.' });
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
          'You are a realistic investment banking interviewer. Generate exactly one concise interview question for the requested practice category using the candidate prep profile. Fit questions should focus on why banking, why the selected group, why the target bank tier, or transitions from their background. Behavioral questions should use their work experience and leadership context. Market questions should match selected product or coverage groups. Do not ask about an unselected group or industry unless the profile selected Generalist. Avoid generic AI wording and overly academic phrasing. Do not repeat the previous prompt.',
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
                  prepProfile
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
            schema: questionSchema
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

    return res.status(200).json(JSON.parse(outputText));
  } catch (error) {
    console.error('[interview-question] Serverless route failed', error);
    return res.status(500).json({ error: 'Failed to generate interview question.', details: error.message });
  }
}
