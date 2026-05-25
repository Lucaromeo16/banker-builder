import { useEffect, useMemo, useRef, useState } from 'react';

const MIN_RESUME_TEXT_LENGTH = 200;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const SAVED_ANALYSES_STORAGE_KEY = 'bankerBuilderSavedResumeAnalyses';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:4000' : '');

const SUBSCORE_CONFIGS = [
  { key: 'ibReadiness', label: 'IB Readiness', scoreField: 'ibReadinessScore' },
  { key: 'formatting', label: 'Formatting', scoreField: 'formattingScore' },
  { key: 'experience', label: 'Experience', scoreField: 'experienceScore' },
  { key: 'leadership', label: 'Leadership', scoreField: 'leadershipScore' },
  { key: 'technicalRelevance', label: 'Technical Relevance', scoreField: 'technicalRelevanceScore' }
];

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

function getScoreDetail(analysis, config) {
  const detail = analysis?.scoreDetails?.[config.key] || {};
  const score = analysis?.[config.scoreField] ?? detail.score;
  const pointLossReasons = normalizeList(detail.pointLossReasons);
  const fallbackPositives = config.key === 'formatting' ? normalizeList(analysis?.formattingFeedback) : normalizeList(analysis?.strengths);
  const fallbackPointLossReasons =
    config.key === 'technicalRelevance' || config.key === 'ibReadiness'
      ? [...normalizeList(analysis?.missingSignals), ...normalizeList(analysis?.weaknesses)]
      : normalizeList(analysis?.weaknesses);
  return {
    score,
    positives: normalizeList(detail.positives).length ? normalizeList(detail.positives) : fallbackPositives,
    pointLossReasons:
      Number(score) === 10 && pointLossReasons.length === 0
        ? ['No major issues found.']
        : pointLossReasons.length
          ? pointLossReasons
          : fallbackPointLossReasons,
    improvements: normalizeList(detail.improvements).length ? normalizeList(detail.improvements) : normalizeList(analysis?.nextSteps)
  };
}

function ScoreDetailModal({ analysis, config, onClose }) {
  if (!analysis || !config) return null;
  const detail = getScoreDetail(analysis, config);

  return (
    <div className="resume-score-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="resume-score-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-score-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="resume-score-modal-header">
          <div>
            <span className="feature-eyebrow">Score detail</span>
            <h3 id="resume-score-modal-title">{config.label}</h3>
            <strong>{clampScore(detail.score)}/10</strong>
          </div>
          <button type="button" className="text-button" onClick={onClose} aria-label="Close score details">
            x
          </button>
        </div>

        <div className="resume-score-detail-grid">
          <article>
            <h4>What Went Well</h4>
            {renderTextList(detail.positives)}
          </article>
          <article>
            <h4>Where Points Were Lost</h4>
            {renderTextList(detail.pointLossReasons)}
          </article>
          <article>
            <h4>How To Improve Toward 10/10</h4>
            {renderTextList(detail.improvements)}
          </article>
        </div>
      </section>
    </div>
  );
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function isPdfFile(file) {
  return file?.type === 'application/pdf' || /\.pdf$/i.test(file?.name || '');
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

function loadSavedAnalyses() {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_ANALYSES_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function userMessageForResumeError(payload, fallbackMessage) {
  if (payload?.code === 'NETWORK_ERROR') return 'Backend route unreachable. Please refresh and try again.';
  if (payload?.code === 'MISSING_OPENAI_API_KEY') return 'Resume analysis is not configured yet. Add an OpenAI API key and try again.';
  if (payload?.code === 'UNSUPPORTED_FILE_TYPE') return 'Please upload a PDF resume.';
  if (payload?.code === 'EXTRACTED_TEXT_TOO_SHORT') return 'This PDF did not expose enough readable resume text. Please upload a readable PDF resume.';
  if (payload?.code === 'CORRUPTED_TEXT') return 'We could not read this PDF cleanly. Please upload a readable PDF resume.';
  if (payload?.code === 'PDF_EXTRACTION_FAILED') return 'We could not process this PDF. Please upload a readable PDF resume.';
  if (payload?.code === 'OPENAI_ANALYSIS_FAILED') return 'AI analysis failed. Please try again.';
  if (payload?.code === 'INVALID_REQUEST_PAYLOAD') return 'Invalid request payload. Please replace the PDF and try again.';
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
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [parseWarning, setParseWarning] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedAnalyses, setSavedAnalyses] = useState(loadSavedAnalyses);
  const [savedConfirmation, setSavedConfirmation] = useState('');
  const [activeScoreDetailKey, setActiveScoreDetailKey] = useState('');
  const fileInputRef = useRef(null);

  const canAnalyze = Boolean(resumeText.trim()) && !extracting && !loading;
  const rewrites = normalizeList(analysis?.recommendedBulletRewrites);
  const currentAnalysisSaved = useMemo(
    () => Boolean(analysis?.savedAnalysisId && savedAnalyses.some((item) => item.id === analysis.savedAnalysisId)),
    [analysis, savedAnalyses]
  );
  const activeScoreConfig = SUBSCORE_CONFIGS.find((config) => config.key === activeScoreDetailKey);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SAVED_ANALYSES_STORAGE_KEY, JSON.stringify(savedAnalyses));
  }, [savedAnalyses]);

  useEffect(() => {
    if (!activeScoreDetailKey) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setActiveScoreDetailKey('');
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [activeScoreDetailKey]);

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setResumeText('');
    setParseWarning('');
    setError('');
    setAnalysis(null);
    setActiveScoreDetailKey('');
    setSavedConfirmation('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const extractUploadedResumeText = async (file) => {
    const dataUrl = await readFileAsDataUrl(file);
    const payload = await postJson('/api/resume-extract', {
      fileName: file.name,
      mimeType: 'application/pdf',
      dataUrl
    });

    return {
      text: normalizeExtractedText(payload.resumeText),
      warnings: payload.warnings || [],
      formattingMetadata: payload.formattingMetadata || null
    };
  };

  const handleResumeFile = async (file) => {
    setError('');
    setParseWarning('');
    setAnalysis(null);
    setActiveScoreDetailKey('');
    setSavedConfirmation('');

    if (!isPdfFile(file)) {
      setError('Please upload a PDF resume.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setError('File is too large. Upload a PDF resume under 10 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadedFile({
      name: file.name,
      type: 'application/pdf',
      size: file.size,
      status: 'processing'
    });
    setResumeText('');
    setExtracting(true);

    try {
      const extracted = await extractUploadedResumeText(file);

      setResumeText(extracted.text);
      setUploadedFile({
        name: file.name,
        type: 'application/pdf',
        size: file.size,
        status: extracted.text ? 'ready' : 'needs-replacement',
        formattingMetadata: extracted.formattingMetadata
      });

      if (!extracted.text || extracted.text.length < MIN_RESUME_TEXT_LENGTH) {
        setParseWarning('This PDF did not expose enough readable resume text. Please upload a readable PDF resume.');
      } else if (extracted.warnings?.length) {
        setParseWarning(extracted.warnings.join(' '));
      }
    } catch (extractError) {
      console.error('[resume-analyzer] Resume extraction failed', extractError);
      setUploadedFile({
        name: file.name,
        type: 'application/pdf',
        size: file.size,
        status: 'needs-replacement'
      });
      setResumeText('');
      setParseWarning(userMessageForResumeError(extractError.payload, 'Extraction failed. Please upload another PDF resume.'));
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
    setActiveScoreDetailKey('');
    setError('');
    setSavedConfirmation('');

    if (extracting) {
      setError('Resume PDF is still being processed.');
      return;
    }

    if (!uploadedFile || !trimmedResume) {
      setError('Upload your resume as a PDF before analyzing.');
      return;
    }

    if (trimmedResume.length < MIN_RESUME_TEXT_LENGTH) {
      setError('This PDF did not expose enough readable resume text. Please upload a readable PDF resume.');
      return;
    }

    setLoading(true);

    try {
      const payload = await postJson('/api/resume-analyzer', { resumeText: trimmedResume });
      setAnalysis(payload);
    } catch (requestError) {
      console.error('[resume-analyzer] Analysis request failed', requestError);
      setError(userMessageForResumeError(requestError.payload, 'Resume analysis could not be generated. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysis = () => {
    if (!analysis) return;
    const savedAnalysis = {
      id: analysis.savedAnalysisId || `resume-analysis-${Date.now()}`,
      createdAt: new Date().toISOString(),
      fileName: uploadedFile?.name || 'Resume.pdf',
      scores: {
        overallScoreOutOf10: analysis.overallScoreOutOf10,
        ibReadinessScore: analysis.ibReadinessScore,
        formattingScore: analysis.formattingScore,
        experienceScore: analysis.experienceScore,
        leadershipScore: analysis.leadershipScore,
        technicalRelevanceScore: analysis.technicalRelevanceScore
      },
      strengths: normalizeList(analysis.strengths),
      weaknesses: normalizeList(analysis.weaknesses),
      missingSignals: normalizeList(analysis.missingSignals),
      formattingFeedback: normalizeList(analysis.formattingFeedback),
      scoreDetails: analysis.scoreDetails || {},
      positioningAdvice: analysis.suggestedResumePositioning || '',
      suggestedBulletRewrites: normalizeList(analysis.recommendedBulletRewrites),
      rawAnalysisResult: analysis
    };

    setSavedAnalyses((current) => [savedAnalysis, ...current.filter((item) => item.id !== savedAnalysis.id)]);
    setAnalysis((current) => ({ ...current, savedAnalysisId: savedAnalysis.id }));
    setSavedConfirmation('Analysis saved on this device.');
  };

  const deleteSavedAnalysis = (id) => {
    setSavedAnalyses((current) => current.filter((item) => item.id !== id));
    if (analysis?.savedAnalysisId === id) {
      setAnalysis((current) => ({ ...current, savedAnalysisId: undefined }));
      setSavedConfirmation('');
    }
  };

  const viewSavedAnalysis = (item) => {
    setAnalysis({ ...item.rawAnalysisResult, savedAnalysisId: item.id });
    setActiveScoreDetailKey('');
    setUploadedFile({
      name: item.fileName,
      type: 'application/pdf',
      size: 0,
      status: 'ready'
    });
    setError('');
    setParseWarning('');
    setSavedConfirmation('');
  };

  return (
    <section className="resume-analyzer-page">
      <button type="button" className="back-button" onClick={onBack}>
        Back to Home
      </button>

      <div className="networking-header">
        <div>
          <span className="feature-eyebrow">AI resume review</span>
          <h2>Resume Analyzer</h2>
          <p>Upload your resume as a PDF and get investment-banking-specific feedback on positioning, bullets, and readiness.</p>
        </div>
      </div>

      <section className="network-section resume-input-card" aria-labelledby="resume-input-title">
        <div className="section-heading">
          <div>
            <h3 id="resume-input-title">Upload PDF</h3>
            <p className="muted">Upload your resume as a PDF.</p>
          </div>
          <span className="resume-file-type-badge">PDF only</span>
        </div>

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
              accept=".pdf,application/pdf"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleResumeFile(file);
              }}
            />
            <span className="resume-upload-icon">PDF</span>
            <div>
              <strong>Drop your resume PDF here</strong>
              <p>PDF only, up to 10 MB. Standard one-page finance resumes work best.</p>
            </div>
            <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()} disabled={extracting || loading}>
              Upload PDF
            </button>
          </div>

          {uploadedFile ? (
            <div className="resume-file-preview">
              <div className="resume-file-thumbnail resume-file-thumbnail-pdf">PDF</div>
              <div className="resume-file-meta">
                <strong>{uploadedFile.name}</strong>
                {uploadedFile.size ? <span>{formatFileSize(uploadedFile.size)}</span> : null}
                <p>
                  {uploadedFile.status === 'processing'
                    ? 'Processing PDF...'
                    : uploadedFile.status === 'ready'
                      ? 'PDF uploaded and ready to analyze.'
                      : 'PDF uploaded, but readable resume text was not found.'}
                </p>
              </div>
              <div className="resume-file-actions">
                <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()} disabled={extracting || loading}>
                  Replace
                </button>
                <button type="button" className="secondary" onClick={clearUploadedFile} disabled={extracting || loading}>
                  Remove
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {error ? <p className="error">{error}</p> : null}
        {parseWarning ? <p className="resume-parse-warning">{parseWarning}</p> : null}
        {extracting ? <p className="resume-loading">Processing PDF...</p> : null}
        {loading ? <p className="resume-loading">Analyzing Resume...</p> : null}

        <button type="button" className="primary" onClick={analyzeResume} disabled={!canAnalyze}>
          {loading ? 'Analyzing Resume...' : 'Analyze Resume'}
        </button>
      </section>

      {analysis ? (
        <section className="resume-results" aria-live="polite">
          <div className="resume-results-actions">
            <div>
              <h3>Results</h3>
              <p className="muted">Saved analyses are stored on this device for now.</p>
            </div>
            <button type="button" className="secondary" onClick={saveAnalysis} disabled={currentAnalysisSaved}>
              {currentAnalysisSaved ? 'Analysis Saved' : 'Save Analysis'}
            </button>
          </div>
          {savedConfirmation ? <p className="resume-save-confirmation">{savedConfirmation}</p> : null}

          <div className="resume-score-grid">
            <article className="resume-score-card featured">
              <span>Overall Score</span>
              <strong>{clampScore(analysis.overallScoreOutOf10)}/10</strong>
            </article>
            {SUBSCORE_CONFIGS.map((config, index) => (
              <button
                type="button"
                key={config.key}
                className={index === 0 ? 'resume-score-card resume-score-card-button featured' : 'resume-score-card resume-score-card-button'}
                onClick={() => setActiveScoreDetailKey(config.key)}
                aria-label={`View ${config.label} score details`}
              >
                <span>{config.label}</span>
                <strong>{clampScore(analysis[config.scoreField])}/10</strong>
                <small>
                  View details <b aria-hidden="true">&gt;</b>
                </small>
              </button>
            ))}
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
              <h3>Formatting Feedback</h3>
              {renderTextList(analysis.formattingFeedback)}
            </article>
            <article className="resume-section-card">
              <h3>Missing Signals</h3>
              {renderTextList(analysis.missingSignals)}
            </article>
            <article className="resume-section-card resume-wide-card">
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

      {activeScoreConfig ? (
        <ScoreDetailModal analysis={analysis} config={activeScoreConfig} onClose={() => setActiveScoreDetailKey('')} />
      ) : null}

      <section className="resume-saved-panel" aria-labelledby="saved-analyses-title">
        <div className="section-heading">
          <div>
            <h3 id="saved-analyses-title">Saved Analyses</h3>
            <p className="muted">Saved analyses are stored on this device for now.</p>
          </div>
        </div>

        {savedAnalyses.length ? (
          <div className="resume-saved-list">
            {savedAnalyses.map((item) => (
              <article className="resume-saved-card" key={item.id}>
                <div>
                  <strong>{item.fileName}</strong>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <dl>
                  <div>
                    <dt>Overall</dt>
                    <dd>{clampScore(item.scores?.overallScoreOutOf10)}/10</dd>
                  </div>
                  <div>
                    <dt>IB Readiness</dt>
                    <dd>{clampScore(item.scores?.ibReadinessScore)}/10</dd>
                  </div>
                  <div>
                    <dt>Formatting</dt>
                    <dd>{clampScore(item.scores?.formattingScore)}/10</dd>
                  </div>
                </dl>
                <div className="resume-saved-actions">
                  <button type="button" className="text-button" onClick={() => viewSavedAnalysis(item)}>
                    View
                  </button>
                  <button type="button" className="text-button danger" onClick={() => deleteSavedAnalysis(item.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">No saved analyses yet.</p>
        )}
      </section>
    </section>
  );
}
