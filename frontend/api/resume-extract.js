export const config = {
  api: {
    bodyParser: {
      sizeLimit: '16mb'
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
    return { ok: false, code: 'EXTRACTED_TEXT_TOO_SHORT' };
  }

  if (alphaRatio < 0.35 || controlRatio > 0.02 || pdfInternalMarkers >= 4) {
    return { ok: false, code: 'CORRUPTED_TEXT' };
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
  const decodedPdf = dataUrlToBuffer(dataUrl, ['application/pdf']);
  if (!decodedPdf) {
    return { error: { status: 400, code: 'UNSUPPORTED_FILE_TYPE', message: 'Invalid payload: upload a PDF file.' } };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      error: {
        status: 500,
        code: 'MISSING_OPENAI_API_KEY',
        message: 'OPENAI_API_KEY is not configured on the serverless API route.'
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
      console.error('[resume-extract] OpenAI PDF extraction request failed', {
        status: response.status,
        statusText: response.statusText,
        details
      });
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

    console.log('[resume-extract] OpenAI PDF extraction completed', {
      bytes: decodedPdf.bytes,
      extractedLength: resumeText.length,
      extractedWords: countResumeWords(resumeText),
      qualityCode: quality.code || 'OK'
    });

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
    console.error('[resume-extract] PDF parse failed', {
      message: error.message,
      name: error.name
    });
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { fileName, mimeType, dataUrl } = parseBody(req);
    const supportedFileTypes = ['application/pdf'];

    console.log('[resume-extract] Vercel API request received', {
      route: 'POST /api/resume-extract',
      fileName,
      mimeType,
      dataUrlLength: typeof dataUrl === 'string' ? dataUrl.length : 0,
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    });

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

      return res.status(200).json(extractedPdf);
    }
    return res.status(400).json({
      code: 'UNSUPPORTED_FILE_TYPE',
      error: 'Please upload a PDF resume.'
    });
  } catch (error) {
    console.error('[resume-extract] Serverless route failed', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      code: 'EXTRACTION_FAILED',
      error: 'Failed to extract resume content.',
      details: error.message
    });
  }
}
