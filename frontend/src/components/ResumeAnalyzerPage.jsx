import { useMemo, useRef, useState } from 'react';

const MIN_RESUME_TEXT_LENGTH = 200;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const SUPPORTED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:4000' : '');

function clampScore(score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return 'N/A';
  return Math.max(1, Math.min(10, numericScore)).toFixed(1);
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function renderTextList(items) {
  const list = normalizeList(items);
  if (!list.length) return <p className="muted">No specific items returned.</p>;

  return (
    <ul>
      {list.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function getFileKind(file) {
  if (!file) return '';
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
  if (
    file.type === 'image/png' ||
    file.type === 'image/jpeg' ||
    /\.(png|jpe?g)$/i.test(file.name)
  ) {
    return 'image';
  }
  return '';
}

function getSupportedMimeType(file, fileKind) {
  if (SUPPORTED_FILE_TYPES.includes(file.type)) return file.type;
  if (fileKind === 'pdf') return 'application/pdf';
  if (/\.png$/i.test(file.name)) return 'image/png';
  if (/\.jpe?g$/i.test(file.name)) return 'image/jpeg';
  return file.type;
}

function normalizeExtractedText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Unable to read file.'));
    reader.readAsDataURL(file);
  });
}

function userMessageForExtractionError(payload, fallbackMessage) {
  if (payload?.code === 'NETWORK_ERROR') return 'Backend route unreachable. Please refresh and try again.';
  if (payload?.code === 'MISSING_OPENAI_API_KEY') return 'Image OCR is not configured. Add an OpenAI API key or paste the resume text.';
  if (payload?.code === 'UNSUPPORTED_FILE_TYPE') return 'Unsupported file type. Upload a PDF, PNG, JPG, or JPEG resume.';
  if (payload?.code === 'EXTRACTED_TEXT_TOO_SHORT') return 'Extracted text is too short. Try a clearer screenshot or paste the text.';
  if (payload?.code === 'CORRUPTED_TEXT') return 'We couldn’t read this PDF. Try uploading a screenshot or pasting the text.';
  if (payload?.code === 'PDF_EXTRACTION_FAILED') return 'We couldn’t process this PDF. Try uploading a screenshot or pasting the text.';
  if (payload?.code === 'OPENAI_EXTRACTION_FAILED') return 'Image extraction failed. Try a clearer image or paste the resume text.';
  if (payload?.code === 'OPENAI_ANALYSIS_FAILED') return 'AI analysis failed. Please try again.';
  if (payload?.code === 'INVALID_REQUEST_PAYLOAD') return 'Invalid request payload. Please replace the file or paste clean resume text.';
  return payload?.error || fallbackMessage;
}

async function postJson(pathname, body) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${pathname}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch (networkError) {
    const error = new Error('Backend route unreachable.');
    error.payload = { code: 'NETWORK_ERROR', error: networkError.message };
    throw error;
  }

  const responseText = await response.text();
  let payload = {};
  try {
    payload = responseText ? JSON.parse(responseText) : {};
  } catch {
    payload = { code: 'INVALID_RESPONSE', error: responseText || 'API returned an invalid response.' };
  }

  if (!response.ok) {
    const error = new Error(payload?.details || payload?.error || `Request failed with status ${response.status}`);
    error.payload = payload;
    throw error;
  }

  return payload;
}

export default function ResumeAnalyzerPage({ onBack }) {
  const [resumeText, setResumeText] = useState('');
  const [inputMode, setInputMode] = useState('upload');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [parseWarning, setParseWarning] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const wordCount = useMemo(() => resumeText.trim().split(/\s+/).filter(Boolean).length, [resumeText]);

  const clearUploadedFile = () => {
    if (uploadedFile?.previewUrl) URL.revokeObjectURL(uploadedFile.previewUrl);
    setUploadedFile(null);
    setResumeText('');
    setParseWarning('');
    setError('');
    setAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const extractUploadedResumeText = async (file, previewUrl, mimeType) => {
    const dataUrl = await readFileAsDataUrl(file);
    const payload = await postJson('/api/resume-extract', {
      fileName: file.name,
      mimeType,
      dataUrl
    });

    return {
      text: normalizeExtractedText(payload.resumeText),
      warnings: payload.warnings || [],
      formattingMetadata: payload.formattingMetadata || null,
      previewUrl
    };
  };

  const handleResumeFile = async (file) => {
    const fileKind = getFileKind(file);
    const mimeType = getSupportedMimeType(file, fileKind);
    setError('');
    setParseWarning('');
    setAnalysis(null);

    if (!fileKind || !SUPPORTED_FILE_TYPES.includes(mimeType)) {
      setError('Unsupported file type. Upload a PDF, PNG, JPG, or JPEG resume.');
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setError('File is too large. Upload a resume file under 10 MB.');
      return;
    }

    const previousPreviewUrl = uploadedFile?.previewUrl;
    if (previousPreviewUrl) URL.revokeObjectURL(previousPreviewUrl);

    const previewUrl = fileKind === 'image' ? URL.createObjectURL(file) : '';
    setUploadedFile({
      name: file.name,
      type: mimeType,
      size: file.size,
      kind: fileKind,
      previewUrl,
      status: 'extracting'
    });
    setInputMode('upload');
    setExtracting(true);

    try {
      const extracted = await extractUploadedResumeText(file, previewUrl, mimeType);

      setResumeText(extracted.text);
      setUploadedFile({
        name: file.name,
        type: mimeType,
        size: file.size,
        kind: fileKind,
        previewUrl: extracted.previewUrl || previewUrl,
        status: extracted.text ? 'ready' : 'needs-text',
        formattingMetadata: extracted.formattingMetadata
      });

      if (!extracted.text || extracted.text.length < MIN_RESUME_TEXT_LENGTH) {
        setParseWarning(
          fileKind === 'pdf'
            ? 'This PDF did not expose enough readable text. Use Paste Text Instead for a stronger analysis.'
            : 'The image OCR did not capture enough readable text. Use Paste Text Instead for a stronger analysis.'
        );
      } else if (extracted.warnings?.length) {
        setParseWarning(extracted.warnings.join(' '));
      }
    } catch (extractError) {
      console.error('[resume-analyzer] Resume extraction failed', extractError);
      setUploadedFile({
        name: file.name,
        type: mimeType,
        size: file.size,
        kind: fileKind,
        previewUrl,
        status: 'needs-text'
      });
      setResumeText('');
      setParseWarning(userMessageForExtractionError(extractError.payload, 'Extraction failed. Try another file or paste the resume text.'));
    } finally {
      setExtracting(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleResumeFile(file);
  };

  const analyzeResume = async () => {
    const trimmedResume = resumeText.trim();
    setAnalysis(null);
    setError('');

    if (extracting) {
      setError('Resume content is still being extracted.');
      return;
    }

    if (!trimmedResume) {
      setError('Upload a resume or paste resume text before analyzing.');
      return;
    }

    if (trimmedResume.length < MIN_RESUME_TEXT_LENGTH) {
      setError('Please provide more resume content for a useful analysis.');
      return;
    }

    setLoading(true);

    try {
      const payload = await postJson('/api/resume-analyzer', { resumeText: trimmedResume });
      setAnalysis(payload);
    } catch (requestError) {
      console.error('[resume-analyzer] Analysis request failed', requestError);
      setError(userMessageForExtractionError(requestError.payload, 'Resume analysis could not be generated. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const rewrites = normalizeList(analysis?.recommendedBulletRewrites);

  return (
    <section className="resume-analyzer-page">
      <button type="button" className="back-button" onClick={onBack}>
        Back to Home
      </button>

      <div className="networking-header">
        <div>
          <span className="feature-eyebrow">AI resume review</span>
          <h2>Resume Analyzer</h2>
          <p>Get investment-banking-specific feedback on your resume, bullets, and candidate positioning.</p>
        </div>
      </div>

      <section className="network-section resume-input-card" aria-labelledby="resume-input-title">
        <div className="section-heading">
          <div>
            <h3 id="resume-input-title">Upload Resume</h3>
            <p className="muted">
              Upload a PDF, screenshot, or image of your resume. You can also paste resume text manually.
            </p>
          </div>
          <span className="resume-word-count">{wordCount} words</span>
        </div>

        <div className="resume-input-tabs" role="tablist" aria-label="Resume input method">
          <button
            type="button"
            className={inputMode === 'upload' ? 'active' : ''}
            onClick={() => setInputMode('upload')}
          >
            Upload Resume
          </button>
          <button type="button" className={inputMode === 'paste' ? 'active' : ''} onClick={() => setInputMode('paste')}>
            Paste Text Instead
          </button>
        </div>

        {inputMode === 'upload' ? (
          <div className="resume-upload-panel">
            <div
              className={`resume-upload-dropzone${isDragging ? ' dragging' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleResumeFile(file);
                }}
              />
              <span className="resume-upload-icon">FILE</span>
              <div>
                <strong>Drop your resume here</strong>
                <p>PDF, PNG, JPG, or JPEG up to 10 MB. Standard one-page finance resumes work best.</p>
              </div>
              <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()}>
                Upload PDF/Image
              </button>
            </div>

            {uploadedFile ? (
              <div className="resume-file-preview">
                {uploadedFile.previewUrl ? (
                  <img src={uploadedFile.previewUrl} alt="" className="resume-file-thumbnail" />
                ) : (
                  <div className="resume-file-thumbnail resume-file-thumbnail-pdf">PDF</div>
                )}
                <div className="resume-file-meta">
                  <strong>{uploadedFile.name}</strong>
                  <span>
                    {uploadedFile.kind?.toUpperCase()} · {formatFileSize(uploadedFile.size)}
                  </span>
                  <p>
                    {uploadedFile.status === 'extracting'
                      ? 'Extracting resume content...'
                      : uploadedFile.status === 'ready'
                        ? `Resume content extracted: ${wordCount} words ready to analyze.`
                        : 'Upload received. Paste text fallback is recommended for this file.'}
                  </p>
                </div>
                <div className="resume-file-actions">
                  <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()} disabled={extracting}>
                    Replace
                  </button>
                  <button type="button" className="secondary" onClick={clearUploadedFile} disabled={extracting}>
                    Remove
                  </button>
                </div>
              </div>
            ) : null}
            {resumeText ? (
              <label className="resume-text-fallback">
                Review extracted text
                <textarea
                  className="resume-textarea resume-extracted-textarea"
                  value={resumeText}
                  onChange={(event) => {
                    setResumeText(event.target.value);
                    setParseWarning('');
                    setAnalysis(null);
                  }}
                  placeholder="Extracted resume text will appear here..."
                />
              </label>
            ) : null}
          </div>
        ) : (
          <label className="resume-text-fallback">
            Resume text
            <textarea
              className="resume-textarea"
              value={resumeText}
              onChange={(event) => {
                setResumeText(event.target.value);
                setParseWarning('');
                setAnalysis(null);
              }}
              placeholder="Paste your resume text here..."
            />
          </label>
        )}

        {error ? <p className="error">{error}</p> : null}
        {parseWarning ? <p className="resume-parse-warning">{parseWarning}</p> : null}
        {extracting ? <p className="resume-loading">Extracting resume content...</p> : null}
        {loading ? <p className="resume-loading">Analyzing resume through an investment banking recruiting lens...</p> : null}

        <button type="button" className="primary" onClick={analyzeResume} disabled={loading || extracting}>
          {loading ? 'Analyzing Resume...' : 'Analyze Resume'}
        </button>
      </section>

      {analysis ? (
        <section className="resume-results" aria-live="polite">
          <div className="resume-score-grid">
            <article className="resume-score-card featured">
              <span>Overall Score</span>
              <strong>{clampScore(analysis.overallScoreOutOf10)}/10</strong>
            </article>
            <article className="resume-score-card featured">
              <span>IB Readiness</span>
              <strong>{clampScore(analysis.ibReadinessScore)}/10</strong>
            </article>
            <article className="resume-score-card">
              <span>Formatting</span>
              <strong>{clampScore(analysis.formattingScore)}/10</strong>
            </article>
            <article className="resume-score-card">
              <span>Experience</span>
              <strong>{clampScore(analysis.experienceScore)}/10</strong>
            </article>
            <article className="resume-score-card">
              <span>Leadership</span>
              <strong>{clampScore(analysis.leadershipScore)}/10</strong>
            </article>
            <article className="resume-score-card">
              <span>Technical Relevance</span>
              <strong>{clampScore(analysis.technicalRelevanceScore)}/10</strong>
            </article>
          </div>

          <div className="resume-result-grid">
            <article className="resume-section-card">
              <h3>Strengths</h3>
              {renderTextList(analysis.strengths)}
            </article>
            <article className="resume-section-card">
              <h3>Weaknesses</h3>
              {renderTextList(analysis.weaknesses)}
            </article>
            <article className="resume-section-card">
              <h3>Missing Signals</h3>
              {renderTextList(analysis.missingSignals)}
            </article>
            <article className="resume-section-card">
              <h3>Positioning Advice</h3>
              <p>{analysis.suggestedResumePositioning || 'No positioning advice returned.'}</p>
            </article>
          </div>

          <section className="resume-section-card resume-wide-card">
            <h3>Suggested Bullet Rewrites</h3>
            {rewrites.length ? (
              <div className="resume-rewrite-list">
                {rewrites.map((rewrite, index) => {
                  const originalBullet = typeof rewrite === 'string' ? '' : rewrite.originalBullet;
                  const rewrittenBullet = typeof rewrite === 'string' ? rewrite : rewrite.rewrittenBullet;
                  const whyItWorks = typeof rewrite === 'string' ? '' : rewrite.whyItWorks;

                  return (
                    <article key={`${rewrittenBullet}-${index}`}>
                      {originalBullet ? <p className="muted">Original: {originalBullet}</p> : null}
                      <strong>{rewrittenBullet}</strong>
                      {whyItWorks ? <p>{whyItWorks}</p> : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="muted">No bullet rewrites returned.</p>
            )}
          </section>

          <section className="resume-section-card resume-wide-card">
            <h3>Next Steps</h3>
            {renderTextList(analysis.nextSteps)}
          </section>
        </section>
      ) : null}
    </section>
  );
}
