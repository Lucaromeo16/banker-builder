export const config = {
  api: {
    bodyParser: false
  }
};

function parseMultipartHeaderParams(headerValue = '') {
  return Object.fromEntries(
    headerValue
      .split(';')
      .slice(1)
      .map((segment) => segment.trim().split('='))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, value.replace(/^"|"$/g, '')])
  );
}

async function readRequestBuffer(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function parseMultipartFile(req) {
  const contentType = req.headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
  if (!boundaryMatch) return null;

  const body = await readRequestBuffer(req);
  const boundary = Buffer.from(`--${boundaryMatch[1]}`);
  let cursor = body.indexOf(boundary);

  while (cursor !== -1) {
    let partStart = cursor + boundary.length;
    if (body[partStart] === 45 && body[partStart + 1] === 45) break;
    if (body[partStart] === 13 && body[partStart + 1] === 10) partStart += 2;

    const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), partStart);
    if (headerEnd === -1) break;

    const nextBoundary = body.indexOf(boundary, headerEnd + 4);
    if (nextBoundary === -1) break;

    const headersText = body.slice(partStart, headerEnd).toString('latin1');
    const headers = Object.fromEntries(
      headersText
        .split('\r\n')
        .map((line) => {
          const separatorIndex = line.indexOf(':');
          if (separatorIndex === -1) return null;
          return [line.slice(0, separatorIndex).trim().toLowerCase(), line.slice(separatorIndex + 1).trim()];
        })
        .filter(Boolean)
    );
    const dispositionParams = parseMultipartHeaderParams(headers['content-disposition'] || '');
    const dataStart = headerEnd + 4;
    const dataEnd = body[nextBoundary - 2] === 13 && body[nextBoundary - 1] === 10 ? nextBoundary - 2 : nextBoundary;

    if (dispositionParams.name === 'file') {
      return {
        fieldName: dispositionParams.name,
        filename: dispositionParams.filename || 'interview-answer.webm',
        mimeType: headers['content-type'] || 'audio/webm',
        buffer: body.slice(dataStart, dataEnd)
      };
    }

    cursor = nextBoundary;
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    console.log('[audio-transcribe] Vercel API request received', {
      route: 'POST /api/audio-transcribe',
      contentType: req.headers['content-type']?.split(';')[0],
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY)
    });

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the serverless API route.' });
    }

    const file = await parseMultipartFile(req);
    console.log('[audio-transcribe] file parsed', {
      filePresent: Boolean(file),
      fieldName: file?.fieldName,
      fileName: file?.filename,
      fileType: file?.mimeType,
      fileSize: file?.buffer.length || 0
    });

    if (!file) {
      return res.status(400).json({ error: 'No audio file was received for transcription.' });
    }

    if (file.buffer.length < 1000) {
      return res.status(400).json({ error: 'Audio file was too small to transcribe.' });
    }

    const formData = new FormData();
    formData.append('model', process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe');
    formData.append('file', new Blob([file.buffer], { type: file.mimeType || 'audio/webm' }), file.filename || 'interview-answer.webm');

    console.log('[audio-transcribe] OpenAI transcription request starting', {
      fileType: file.mimeType,
      fileSize: file.buffer.length,
      fileName: file.filename,
      formDataFileField: 'file'
    });

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData
    });

    console.log('[audio-transcribe] OpenAI transcription response', {
      status: transcriptionResponse.status,
      ok: transcriptionResponse.ok
    });

    if (!transcriptionResponse.ok) {
      const details = await transcriptionResponse.text();
      console.error('[audio-transcribe] OpenAI transcription failed', {
        status: transcriptionResponse.status,
        details: details.slice(0, 800)
      });
      return res.status(502).json({ error: 'We couldn’t clearly transcribe your answer. Please try again or use Type Instead.', details });
    }

    const transcription = await transcriptionResponse.json();
    const transcript = String(transcription.text || '').trim();
    if (!transcript) {
      return res.status(400).json({ error: 'We couldn’t clearly transcribe your answer. Please try again or use Type Instead.' });
    }

    return res.status(200).json({ transcript });
  } catch (error) {
    console.error('[audio-transcribe] Serverless route failed', error);
    return res.status(500).json({ error: 'We couldn’t clearly transcribe your answer. Please try again or use Type Instead.', details: error.message });
  }
}
