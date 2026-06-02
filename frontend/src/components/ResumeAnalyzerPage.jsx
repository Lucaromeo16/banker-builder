import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { scoreToBucket, trackEvent } from '../lib/analytics';

const MIN_RESUME_TEXT_LENGTH = 200;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const SAVED_ANALYSES_STORAGE_KEY = 'bankerBuilderSavedResumeAnalyses';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:4000' : '');

const SUBSCORE_CONFIGS = [
  { key: 'ibReadiness', label: 'IB Readiness', scoreField: 'ibReadinessScore' },
  {
    key: 'formatting',
    label: 'Formatting',
    scoreField: 'formattingScore',
    perfectMessage: 'No material formatting concerns detected.'
  },
  { key: 'experience', label: 'Experience', scoreField: 'experienceScore' },
  { key: 'leadership', label: 'Leadership', scoreField: 'leadershipScore' },
  { key: 'technicalRelevance', label: 'Technical Relevance', scoreField: 'technicalRelevanceScore' },
  { key: 'spellingGrammar', label: 'Spelling & Grammar', scoreField: 'spellingGrammarScore' }
];

function clampNumericScore(score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return null;
  return Math.max(1, Math.min(10, numericScore));
}

function formatOverallScore(score) {
  const clampedScore = clampNumericScore(score);
  if (clampedScore === null) return 'N/A';
  return clampedScore.toFixed(1);
}

function formatSubscore(score) {
  const clampedScore = clampNumericScore(score);
  if (clampedScore === null) return 'N/A';
  return (Math.round(clampedScore * 2) / 2).toFixed(1);
}

function roundScoreToHalfNumber(score) {
  const clampedScore = clampNumericScore(score);
  if (clampedScore === null) return null;
  return Math.round(clampedScore * 2) / 2;
}

function getCompositeOverallScore(source) {
  const subscoreValues = SUBSCORE_CONFIGS
    .map((config) => roundScoreToHalfNumber(source?.[config.scoreField]))
    .filter((score) => score !== null);

  if (subscoreValues.length !== SUBSCORE_CONFIGS.length) {
    return source?.overallScoreOutOf10;
  }

  const total = subscoreValues.reduce((sum, score) => sum + score, 0);
  return Number((total / subscoreValues.length).toFixed(1));
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
  const numericScore = Number(score);
  const pointLossReasons = normalizeList(detail.pointLossReasons);
  const fallbackPositives = config.key === 'formatting' ? normalizeList(analysis?.formattingFeedback) : normalizeList(analysis?.strengths);

  return {
    score,
    positives: normalizeList(detail.positives).length ? normalizeList(detail.positives) : fallbackPositives,
    pointLossReasons: numericScore >= 10 ? [config.perfectMessage || 'No material issues found.'] : pointLossReasons,
    improvements: numericScore >= 10 ? [] : normalizeList(detail.improvements)
  };
}

function ScoreDetailModal({ analysis, config, onClose }) {
  if (!analysis || !config) return null;
  const detail = getScoreDetail(analysis, config);
  const numericScore = Number(detail.score);
  const hasPerfectScore = numericScore >= 10;
  const hasPointLossReasons = !hasPerfectScore && normalizeList(detail.pointLossReasons).length > 0;
  const hasImprovements = !hasPerfectScore && normalizeList(detail.improvements).length > 0;

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
            <strong>{formatSubscore(detail.score)}/10</strong>
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
          {hasPerfectScore ? (
            <article>
              <h4>No Material Issues</h4>
              {renderTextList(detail.pointLossReasons)}
            </article>
          ) : null}
          {hasPointLossReasons ? (
            <article>
              <h4>Where Points Were Lost</h4>
              {renderTextList(detail.pointLossReasons)}
            </article>
          ) : null}
          {hasImprovements ? (
            <article>
              <h4>How To Improve Toward 10/10</h4>
              {renderTextList(detail.improvements)}
            </article>
          ) : null}
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

function buildSavedAnalysisFromResult(analysis, fileName) {
  return {
    id: analysis.savedAnalysisId || `resume-analysis-${Date.now()}`,
    createdAt: new Date().toISOString(),
    fileName: fileName || 'Resume.pdf',
    storageProvider: 'local',
    scores: {
      overallScoreOutOf10: getCompositeOverallScore(analysis),
      ibReadinessScore: analysis.ibReadinessScore,
      formattingScore: analysis.formattingScore,
      experienceScore: analysis.experienceScore,
      leadershipScore: analysis.leadershipScore,
      technicalRelevanceScore: analysis.technicalRelevanceScore,
      spellingGrammarScore: analysis.spellingGrammarScore
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
}

function mapResumeAnalysisRow(row) {
  const rawAnalysisResult = row.analysis_json || {};
  return {
    ...buildSavedAnalysisFromResult(rawAnalysisResult, row.file_name),
    id: row.id,
    createdAt: row.created_at,
    fileName: row.file_name || 'Resume.pdf',
    storageProvider: 'supabase',
    rawAnalysisResult
  };
}

function logResumeAnalysisSupabaseError(operation, error, details = {}) {
  if (!error) return;

  console.warn('[resume-analyzer] resume_analyses Supabase error', {
    operation,
    code: error.code || null,
    message: error.message || null,
    userIdPresent: Boolean(details.userId),
    payloadKeys: details.payload ? Object.keys(details.payload) : [],
    selectedColumns: details.selectedColumns || null
  });
}

async function getResumePersistenceUserId(supabase, fallbackUser) {
  if (!supabase) return fallbackUser?.id || null;

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    logResumeAnalysisSupabaseError('get-user', error, { userId: fallbackUser?.id });
    return fallbackUser?.id || null;
  }

  return data?.user?.id || fallbackUser?.id || null;
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
  const { user, supabase, isAuthReady } = useAuth();
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
  const [savedAnalysesLoading, setSavedAnalysesLoading] = useState(false);
  const [savedAnalysesError, setSavedAnalysesError] = useState('');
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
    const localOnlyAnalyses = savedAnalyses.filter((item) => item.storageProvider !== 'supabase');
    window.localStorage.setItem(SAVED_ANALYSES_STORAGE_KEY, JSON.stringify(localOnlyAnalyses));
  }, [savedAnalyses]);

  useEffect(() => {
    if (!isAuthReady || !supabase || !user) return undefined;

    let isMounted = true;

    const loadSupabaseSavedAnalyses = async () => {
      setSavedAnalysesLoading(true);
      setSavedAnalysesError('');
      const userId = await getResumePersistenceUserId(supabase, user);

      if (!userId) {
        if (isMounted) {
          setSavedAnalysesLoading(false);
        }
        return;
      }

      const selectedColumns = 'id, user_id, file_name, analysis_json, created_at';

      const { data, error: loadError } = await supabase
        .from('resume_analyses')
        .select(selectedColumns)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (loadError) {
        logResumeAnalysisSupabaseError('load', loadError, { userId, selectedColumns });
        setSavedAnalysesError('Saved analyses could not be loaded right now.');
        setSavedAnalysesLoading(false);
        return;
      }

      const supabaseAnalyses = (data || []).map(mapResumeAnalysisRow);
      setSavedAnalyses((current) => [
        ...supabaseAnalyses,
        ...current.filter((item) => item.storageProvider !== 'supabase' && !supabaseAnalyses.some((saved) => saved.id === item.id))
      ]);
      setSavedAnalysesLoading(false);
    };

    loadSupabaseSavedAnalyses();

    return () => {
      isMounted = false;
    };
  }, [isAuthReady, supabase, user]);

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
      trackEvent('resume_analysis_generated', {
        overall_score_bucket: scoreToBucket(getCompositeOverallScore(payload))
      });
    } catch (requestError) {
      console.error('[resume-analyzer] Analysis request failed', requestError);
      setError(userMessageForResumeError(requestError.payload, 'Resume analysis could not be generated. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysis = async () => {
    if (!analysis) return;
    setSavedConfirmation('');
    setSavedAnalysesError('');

    if (!user) {
      setSavedAnalysesError('Sign in to save resume analyses.');
      return;
    }

    const fileName = uploadedFile?.name || 'Resume.pdf';
    const userId = await getResumePersistenceUserId(supabase, user);

    if (!userId) {
      setSavedAnalysesError('Sign in to save resume analyses.');
      return;
    }

    if (supabase) {
      const insertPayload = {
        user_id: userId,
        file_name: fileName,
        analysis_json: analysis
      };

      const { data, error: saveError } = await supabase
        .from('resume_analyses')
        .insert(insertPayload)
        .select('id, user_id, file_name, analysis_json, created_at')
        .single();

      if (!saveError && data) {
        const savedAnalysis = mapResumeAnalysisRow(data);
        setSavedAnalyses((current) => [savedAnalysis, ...current.filter((item) => item.id !== savedAnalysis.id)]);
        setAnalysis((current) => ({ ...current, savedAnalysisId: savedAnalysis.id }));
        setSavedConfirmation('Analysis saved to your Banker Builder account.');
        return;
      }

      logResumeAnalysisSupabaseError('save', saveError, { userId, payload: insertPayload });
      setSavedAnalysesError('Could not save to your account. Saved locally on this device instead.');
    }

    const localSavedAnalysis = buildSavedAnalysisFromResult(analysis, fileName);
    setSavedAnalyses((current) => [localSavedAnalysis, ...current.filter((item) => item.id !== localSavedAnalysis.id)]);
    setAnalysis((current) => ({ ...current, savedAnalysisId: localSavedAnalysis.id }));
    setSavedConfirmation('Analysis saved locally on this device.');
  };

  const deleteSavedAnalysis = async (item) => {
    setSavedAnalysesError('');

    if (item.storageProvider === 'supabase' && supabase && user) {
      const userId = await getResumePersistenceUserId(supabase, user);

      if (!userId) {
        setSavedAnalysesError('Sign in to delete saved analyses.');
        return;
      }

      const { error: deleteError } = await supabase.from('resume_analyses').delete().eq('id', item.id).eq('user_id', userId);

      if (deleteError) {
        logResumeAnalysisSupabaseError('delete', deleteError, { userId, payload: { id: item.id, user_id: userId } });
        setSavedAnalysesError('Saved analysis could not be deleted. Please try again.');
        return;
      }
    }

    setSavedAnalyses((current) => current.filter((savedItem) => savedItem.id !== item.id));
    if (analysis?.savedAnalysisId === item.id) {
      setAnalysis((current) => ({ ...current, savedAnalysisId: undefined }));
      setSavedConfirmation('');
    }
  };

  const viewSavedAnalysis = (item) => {
    const rawAnalysisResult = item.rawAnalysisResult || item.analysis_json;
    if (!rawAnalysisResult) {
      setSavedAnalysesError('Saved analysis could not be loaded. Please try another saved analysis.');
      return;
    }

    setAnalysis({ ...rawAnalysisResult, savedAnalysisId: item.id });
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
    setSavedAnalysesError('');
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
              <p className="muted">Saved analyses sync to your Banker Builder account. If syncing fails, they are stored locally.</p>
            </div>
            <button type="button" className="secondary" onClick={saveAnalysis} disabled={currentAnalysisSaved}>
              {currentAnalysisSaved ? 'Analysis Saved' : 'Save Analysis'}
            </button>
          </div>
          {savedConfirmation ? <p className="resume-save-confirmation">{savedConfirmation}</p> : null}
          {savedAnalysesError ? <p className="error">{savedAnalysesError}</p> : null}

          <div className="resume-score-grid">
            {SUBSCORE_CONFIGS.map((config) => (
              <button
                type="button"
                key={config.key}
                className="resume-score-card resume-score-card-button resume-subscore-card"
                onClick={() => setActiveScoreDetailKey(config.key)}
                aria-label={`View ${config.label} score details`}
              >
                <span>{config.label}</span>
                <strong>{formatSubscore(analysis[config.scoreField])}/10</strong>
                <small>
                  View details <b aria-hidden="true">&gt;</b>
                </small>
              </button>
            ))}
            <article className="resume-score-card resume-overall-card featured">
              <span>Overall Score</span>
              <strong>{formatOverallScore(getCompositeOverallScore(analysis))}/10</strong>
              <p>Composite resume quality score</p>
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
            <p className="muted">Saved analyses are loaded from your Banker Builder account. Local fallback saves stay on this device.</p>
          </div>
        </div>

        {savedAnalysesLoading ? <p className="resume-loading">Loading saved analyses...</p> : null}
        {savedAnalysesError ? <p className="error">{savedAnalysesError}</p> : null}

        {savedAnalyses.length ? (
          <div className="resume-saved-list">
            {savedAnalyses.map((item) => (
              <article className="resume-saved-card" key={item.id}>
                <div>
                  <strong>{item.fileName}</strong>
                  <span>
                    {new Date(item.createdAt).toLocaleString()}
                    {item.storageProvider === 'local' ? ' · Local' : ''}
                  </span>
                </div>
                <dl>
                  <div>
                    <dt>Overall</dt>
                    <dd>{formatOverallScore(getCompositeOverallScore(item.scores))}/10</dd>
                  </div>
                  <div>
                    <dt>IB Readiness</dt>
                    <dd>{formatSubscore(item.scores?.ibReadinessScore)}/10</dd>
                  </div>
                  <div>
                    <dt>Formatting</dt>
                    <dd>{formatSubscore(item.scores?.formattingScore)}/10</dd>
                  </div>
                </dl>
                <div className="resume-saved-actions">
                  <button type="button" className="text-button" onClick={() => viewSavedAnalysis(item)}>
                    View
                  </button>
                  <button type="button" className="text-button danger" onClick={() => deleteSavedAnalysis(item)}>
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
