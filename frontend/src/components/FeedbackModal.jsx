import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

const VALID_FEATURES = new Set(['general', 'interview_odds', 'target_list_builder', 'interview_prep']);
const VALID_FEEDBACK_TYPES = new Set([
  'bug',
  'confusing_experience',
  'inaccurate_result',
  'irrelevant_recommendation',
  'inaccurate_feedback',
  'suggestion',
  'other'
]);

const GENERAL_FEEDBACK_OPTIONS = [
  { label: 'Bug / Something Not Working', value: 'bug' },
  { label: 'Confusing Experience', value: 'confusing_experience' },
  { label: 'Suggestion', value: 'suggestion' },
  { label: 'Other', value: 'other' }
];

function safeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {};
  return metadata;
}

function initialFeedbackType(defaultFeedbackType, allowFeedbackTypeSelection) {
  if (allowFeedbackTypeSelection) {
    return GENERAL_FEEDBACK_OPTIONS.some((option) => option.value === defaultFeedbackType)
      ? defaultFeedbackType
      : 'bug';
  }

  return defaultFeedbackType || '';
}

export default function FeedbackModal({
  isOpen,
  onClose,
  feature,
  defaultFeedbackType = 'bug',
  contextType = null,
  relatedTable = null,
  relatedRecordId = null,
  metadata = {},
  title = 'Report an Issue or Give Feedback',
  description = 'Tell us what happened or what could be better.',
  allowFeedbackTypeSelection = false
}) {
  const { user, supabase } = useAuth();
  const [feedbackType, setFeedbackType] = useState(() => initialFeedbackType(defaultFeedbackType, allowFeedbackTypeSelection));
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const selectedFeedbackType = allowFeedbackTypeSelection ? feedbackType : defaultFeedbackType;
  const normalizedMetadata = useMemo(() => safeMetadata(metadata), [metadata]);

  useEffect(() => {
    if (!isOpen) return;
    setFeedbackType(initialFeedbackType(defaultFeedbackType, allowFeedbackTypeSelection));
    setMessage('');
    setSaving(false);
    setSuccess('');
    setError('');
  }, [allowFeedbackTypeSelection, defaultFeedbackType, isOpen]);

  if (!isOpen) return null;

  const closeModal = () => {
    if (saving) return;
    onClose?.();
  };

  const validate = () => {
    if (!user?.id || !supabase) return 'You need to be signed in to submit feedback.';
    if (!VALID_FEATURES.has(feature)) return 'Feedback cannot be submitted from this page yet.';
    if (!VALID_FEEDBACK_TYPES.has(selectedFeedbackType)) return 'Choose a valid feedback type.';
    if (!message.trim()) return 'Enter a short message before submitting.';
    return '';
  };

  const submitFeedback = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    const payload = {
      user_id: user.id,
      feature,
      feedback_type: selectedFeedbackType,
      message: message.trim(),
      context_type: contextType || null,
      related_table: relatedTable || null,
      related_record_id: relatedRecordId || null,
      metadata: normalizedMetadata
    };

    const { error: insertError } = await supabase.from('user_feedback').insert(payload);
    setSaving(false);

    if (insertError) {
      console.warn('[feedback] Feedback submission failed.', {
        code: insertError.code || null,
        message: insertError.message || null,
        userIdPresent: Boolean(user?.id),
        payloadKeys: Object.keys(payload)
      });
      setError('We could not submit your feedback right now. Please try again.');
      return;
    }

    setMessage('');
    setFeedbackType(initialFeedbackType(defaultFeedbackType, allowFeedbackTypeSelection));
    setSuccess('Thanks for your feedback. We’ll use it to improve Banker Builder.');
  };

  return (
    <div className="resume-score-modal-backdrop" role="presentation" onClick={closeModal}>
      <section
        className="resume-score-modal feedback-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="resume-score-modal-header">
          <div>
            <span className="feature-eyebrow">Feedback</span>
            <h3 id="feedback-modal-title">{title}</h3>
            {description ? <p className="muted">{description}</p> : null}
          </div>
          <button type="button" className="text-button" onClick={closeModal} aria-label="Close feedback form" disabled={saving}>
            x
          </button>
        </div>

        <form className="feedback-modal-form" onSubmit={submitFeedback}>
          {allowFeedbackTypeSelection ? (
            <label>
              <span>Feedback type</span>
              <select value={feedbackType} onChange={(event) => setFeedbackType(event.target.value)} disabled={saving || Boolean(success)}>
                {GENERAL_FEEDBACK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label>
            <span>Message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe the bug, confusing behavior, or suggestion..."
              disabled={saving || Boolean(success)}
              required
            />
          </label>

          {success ? <p className="auth-message success">{success}</p> : null}
          {error ? <p className="auth-message error">{error}</p> : null}

          <div className="feedback-modal-actions">
            <button type="submit" className="primary" disabled={saving || Boolean(success)}>
              {saving ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button type="button" className="secondary" onClick={closeModal} disabled={saving}>
              {success ? 'Close' : 'Cancel'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
