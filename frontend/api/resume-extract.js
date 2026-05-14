import zlib from 'node:zlib';

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

function decodePdfLiteralString(rawLiteral) {
  const body = rawLiteral.slice(1, -1);
  return body
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

function decodePdfHexString(rawHex) {
  const normalizedHex = rawHex.slice(1, -1).replace(/\s+/g, '');
  const bytes = [];
  for (let index = 0; index < normalizedHex.length; index += 2) {
    bytes.push(parseInt(normalizedHex.slice(index, index + 2).padEnd(2, '0'), 16));
  }

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    let text = '';
    for (let index = 2; index + 1 < bytes.length; index += 2) {
      text += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
    }
    return text;
  }

  return Buffer.from(bytes).toString('latin1');
}

function inflatePdfStream(streamBody) {
  const buffer = Buffer.from(streamBody, 'latin1');
  try {
    return zlib.inflateSync(buffer).toString('latin1');
  } catch {
    try {
      return zlib.inflateRawSync(buffer).toString('latin1');
    } catch {
      return streamBody;
    }
  }
}

function collectPdfTextFromContent(content) {
  const chunks = [];

  for (const match of content.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)) {
    chunks.push(decodePdfLiteralString(match[0].replace(/\s*Tj$/, '')));
  }

  for (const match of content.matchAll(/<[\dA-Fa-f\s]+>\s*Tj/g)) {
    chunks.push(decodePdfHexString(match[0].replace(/\s*Tj$/, '')));
  }

  for (const match of content.matchAll(/\[((?:.|\n|\r){1,12000}?)\]\s*TJ/g)) {
    const literalParts = [...match[1].matchAll(/\((?:\\.|[^\\)])*\)/g)].map((item) => decodePdfLiteralString(item[0]));
    const hexParts = [...match[1].matchAll(/<[\dA-Fa-f\s]+>/g)].map((item) => decodePdfHexString(item[0]));
    const text = [...literalParts, ...hexParts].join('');
    if (text.trim()) chunks.push(text);
  }

  return chunks;
}

function extractPdfTextFromBuffer(buffer) {
  const binary = buffer.toString('latin1');
  const contentPieces = [binary];

  for (const match of binary.matchAll(/<<(?:.|\n|\r)*?\/Filter\s*\/FlateDecode(?:.|\n|\r)*?>>\s*stream\r?\n?([\s\S]*?)\r?\n?endstream/g)) {
    contentPieces.push(inflatePdfStream(match[1]));
  }

  const chunks = contentPieces.flatMap((content) => collectPdfTextFromContent(content));
  const textFromOperators = normalizeResumeText(chunks.join('\n'));

  if (countResumeWords(textFromOperators) >= 30) {
    return textFromOperators;
  }

  return normalizeResumeText(
    binary
      .replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, '\n')
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => /[A-Za-z]/.test(line) && line.length >= 4 && !line.startsWith('/'))
      .join('\n')
  );
}

async function extractPdfResumeText(dataUrl) {
  const decoded = dataUrlToBuffer(dataUrl, ['application/pdf']);
  if (!decoded) {
    return { error: { status: 400, code: 'UNSUPPORTED_FILE_TYPE', message: 'Invalid payload: upload a PDF file.' } };
  }

  try {
    const resumeText = extractPdfTextFromBuffer(decoded.buffer);
    const quality = getResumeTextQuality(resumeText);

    console.log('[resume-extract] PDF parse completed', {
      bytes: decoded.bytes,
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
              ? 'We couldn’t read this PDF. Try uploading a screenshot or pasting the text.'
              : 'Extracted text is too short. Try uploading a screenshot or pasting the text.'
        }
      };
    }

    return {
      resumeText,
      formattingMetadata: {
        detectedSections: ['PDF text layer'],
        bulletCount: (resumeText.match(/[\u2022-]\s+/g) || []).length,
        lineCount: resumeText.split('\n').filter((line) => line.trim()).length
      },
      warnings: []
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
        message: 'We couldn’t read this PDF. Try uploading a screenshot or pasting the text.',
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
    const supportedImageTypes = ['image/png', 'image/jpeg'];
    const supportedFileTypes = ['application/pdf', ...supportedImageTypes];

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
        error: 'Unsupported file type. Upload a PDF, PNG, JPG, or JPEG resume.'
      });
    }

    if (mimeType === 'application/pdf') {
      const extractedPdf = await extractPdfResumeText(dataUrl);
      if (extractedPdf.error) {
        return res.status(extractedPdf.error.status).json({
          code: extractedPdf.error.code,
          error: extractedPdf.error.message,
          details: extractedPdf.error.details
        });
      }

      return res.status(200).json(extractedPdf);
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
      console.error('[resume-extract] OpenAI OCR request failed', {
        status: response.status,
        statusText: response.statusText,
        details
      });
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

    console.log('[resume-extract] Image OCR completed', {
      extractedLength: extracted.resumeText.length,
      extractedWords: countResumeWords(extracted.resumeText),
      qualityCode: quality.code || 'OK'
    });

    if (!quality.ok) {
      return res.status(422).json({
        code: quality.code,
        error:
          quality.code === 'CORRUPTED_TEXT'
            ? 'Extracted text appears corrupted. Try a clearer image or paste the text.'
            : 'Extracted text is too short. Try a clearer image or paste the text.'
      });
    }

    return res.status(200).json(extracted);
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
