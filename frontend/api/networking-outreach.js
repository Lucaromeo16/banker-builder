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
    const { outreachType, firm, office, group, bankerSeniority, tone } = parseBody(req);

    if (!outreachType || !firm || !bankerSeniority || !tone) {
      return res.status(400).json({ error: 'Invalid payload: outreachType, firm, bankerSeniority, and tone are required.' });
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
      console.error('[networking-outreach] OpenAI request failed', {
        status: response.status,
        statusText: response.statusText,
        details
      });
      return res.status(502).json({ error: 'OpenAI outreach request failed.', details });
    }

    const data = await response.json();
    const outputText = extractResponseText(data);
    if (!outputText) {
      return res.status(502).json({ error: 'OpenAI outreach response was empty.' });
    }

    return res.status(200).json(JSON.parse(outputText));
  } catch (error) {
    console.error('[networking-outreach] Serverless route failed', error);
    return res.status(500).json({ error: 'Failed to generate outreach draft.', details: error.message });
  }
}
