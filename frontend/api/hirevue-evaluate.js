const hireVueEvaluationSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'overallScoreOutOf10',
    'categoryScores',
    'strengths',
    'weaknesses',
    'improvementSuggestions',
    'idealResponseStructure'
  ],
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

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body;
}

function extractResponseText(responseData) {
  if (responseData.output_text) return responseData.output_text;
  return responseData.output
    ?.flatMap((item) => item.content || [])
    .map((content) => content.text)
    .filter(Boolean)
    .join('\n');
}

function dataUrlToBuffer(dataUrl) {
  const [, base64 = ''] = String(dataUrl || '').split(',');
  return Buffer.from(base64, 'base64');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { setup, question, dataUrl, mimeType, durationSeconds } = parseBody(req);
    if (!setup || !question || !dataUrl) {
      return res.status(400).json({ error: 'Invalid payload: setup, question, and recording are required.' });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the serverless API route.' });
    }

    const recordingBuffer = dataUrlToBuffer(dataUrl);
    if (recordingBuffer.length < 1000) {
      return res.status(400).json({ error: 'Recording was too short to evaluate.' });
    }

    const formData = new FormData();
    formData.append('model', process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe');
    formData.append('file', new Blob([recordingBuffer], { type: mimeType || 'video/webm' }), 'hirevue-response.webm');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData
    });

    if (!transcriptionResponse.ok) {
      const details = await transcriptionResponse.text();
      return res.status(502).json({ error: 'OpenAI transcription failed.', details });
    }

    const transcription = await transcriptionResponse.json();
    const transcript = String(transcription.text || '').trim();
    if (transcript.length < 20) {
      return res.status(400).json({ error: 'The response transcript was too short to evaluate.' });
    }

    const evaluationResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        instructions:
          'You evaluate investment banking HireVue-style first-round video responses. Be realistic, concise, and grounded in the transcript. Evaluate communication clarity, structure, confidence heuristics, professionalism, conciseness, filler-word usage, pacing based on transcript length and duration, and executive presence signals that can be inferred from verbal delivery. Do not claim psychological or emotion detection. Do not claim visual certainty about eye contact or camera framing unless video frames were explicitly analyzed; instead give practical camera-framing guidance where relevant.',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify({ setup, question, transcript, durationSeconds })
              }
            ]
          }
        ],
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

    if (!evaluationResponse.ok) {
      const details = await evaluationResponse.text();
      return res.status(502).json({ error: 'OpenAI HireVue evaluation failed.', details });
    }

    const evaluationData = await evaluationResponse.json();
    const outputText = extractResponseText(evaluationData);
    if (!outputText) {
      return res.status(502).json({ error: 'OpenAI HireVue evaluation response was empty.' });
    }

    return res.status(200).json({ ...JSON.parse(outputText), transcript });
  } catch (error) {
    console.error('[hirevue-evaluate] Serverless route failed', error);
    return res.status(500).json({ error: 'Failed to evaluate HireVue response.', details: error.message });
  }
}
