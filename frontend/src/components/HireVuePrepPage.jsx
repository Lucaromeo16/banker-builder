import { useEffect, useMemo, useRef, useState } from 'react';
import ibOffices from '../../../data/ibOffices.json';

const hireTypes = ['Summer Analyst', 'Lateral', 'MBA Associate'];
const groupOptions = ['M&A', 'Financial Sponsors', 'LevFin', 'Restructuring', 'DCM', 'ECM', 'Healthcare', 'Technology', 'Industrials', 'FIG', 'Energy', 'Generalist'];
const PREP_SECONDS = 30;
const ANSWER_SECONDS = 90;

const baseQuestions = [
  { prompt: 'Tell me about yourself.', tags: ['Generalist'], hireTypes },
  { prompt: 'Why investment banking?', tags: ['Generalist'], hireTypes },
  { prompt: 'Why our firm?', tags: ['Generalist'], hireTypes },
  { prompt: 'Tell me about a time you handled conflict on a team.', tags: ['Generalist'], hireTypes },
  { prompt: 'Describe a leadership experience you are proud of.', tags: ['Generalist'], hireTypes },
  { prompt: 'Tell me about a time you worked under pressure.', tags: ['Generalist'], hireTypes },
  { prompt: 'Tell me about a recent deal that interested you.', tags: ['Generalist', 'M&A'], hireTypes },
  { prompt: 'Why are you interested in M&A advisory?', tags: ['M&A'], hireTypes },
  { prompt: 'What makes a transaction strategically compelling?', tags: ['M&A'], hireTypes },
  { prompt: 'Why are you interested in Financial Sponsors?', tags: ['Financial Sponsors'], hireTypes },
  { prompt: 'How would you explain sponsor clients differently from corporate clients?', tags: ['Financial Sponsors'], hireTypes },
  { prompt: 'What is one trend affecting private equity deal activity?', tags: ['Financial Sponsors'], hireTypes },
  { prompt: 'Why are you interested in Leveraged Finance?', tags: ['LevFin'], hireTypes },
  { prompt: 'What credit market trend are you following?', tags: ['LevFin', 'DCM'], hireTypes },
  { prompt: 'Why are you interested in Restructuring?', tags: ['Restructuring'], hireTypes },
  { prompt: 'What makes distressed situations interesting to you?', tags: ['Restructuring'], hireTypes },
  { prompt: 'Why are you interested in DCM?', tags: ['DCM'], hireTypes },
  { prompt: 'How do rates affect debt issuance?', tags: ['DCM'], hireTypes },
  { prompt: 'Why are you interested in ECM?', tags: ['ECM'], hireTypes },
  { prompt: 'What makes the IPO market open or closed?', tags: ['ECM'], hireTypes },
  { prompt: 'Why are you interested in Healthcare banking?', tags: ['Healthcare'], hireTypes },
  { prompt: 'What trend in healthcare deal activity are you watching?', tags: ['Healthcare'], hireTypes },
  { prompt: 'Why are you interested in Technology banking?', tags: ['Technology'], hireTypes },
  { prompt: 'What technology trend could drive M&A or IPO activity?', tags: ['Technology'], hireTypes },
  { prompt: 'Why are you interested in Industrials banking?', tags: ['Industrials'], hireTypes },
  { prompt: 'Why are you interested in FIG?', tags: ['FIG'], hireTypes },
  { prompt: 'Why are you interested in Energy banking?', tags: ['Energy'], hireTypes },
  { prompt: 'Tell me about your current role and why you want to move into this opportunity.', tags: ['Generalist'], hireTypes: ['Lateral'] },
  { prompt: 'How would your prior professional experience make you effective quickly?', tags: ['Generalist'], hireTypes: ['Lateral', 'MBA Associate'] },
  { prompt: 'Why banking after business school?', tags: ['Generalist'], hireTypes: ['MBA Associate'] }
];

const initialSetup = {
  firm: '',
  group: 'M&A',
  hireType: 'Summer Analyst'
};

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function pickQuestion(setup, usedPrompts) {
  const scoped = baseQuestions.filter(
    (question) =>
      question.hireTypes.includes(setup.hireType) &&
      (question.tags.includes(setup.group) || question.tags.includes('Generalist'))
  );
  const unused = scoped.filter((question) => !usedPrompts.includes(question.prompt));
  const pool = unused.length ? unused : scoped;
  const weighted = pool.flatMap((question) => Array.from({ length: question.tags.includes(setup.group) ? 3 : 1 }, () => question));
  return weighted[Math.floor(Math.random() * weighted.length)] || baseQuestions[0];
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function HireVuePrepPage({ onBack }) {
  const firms = useMemo(() => Array.from(new Set(ibOffices.map((office) => office.firm))).sort(), []);
  const [setup, setSetup] = useState(initialSetup);
  const [stage, setStage] = useState('setup');
  const [question, setQuestion] = useState(null);
  const [usedPrompts, setUsedPrompts] = useState([]);
  const [timer, setTimer] = useState(PREP_SECONDS);
  const [stream, setStream] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState('');
  const [showPlayback, setShowPlayback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('');
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioChunksRef = useRef([]);
  const stopHandledRef = useRef(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, stage]);

  useEffect(() => {
    if (stage !== 'prep' && stage !== 'recording') return undefined;
    if (timer <= 0) {
      if (stage === 'prep') startRecording();
      if (stage === 'recording') stopRecording();
      return undefined;
    }
    const intervalId = window.setInterval(() => setTimer((current) => current - 1), 1000);
    return () => window.clearInterval(intervalId);
  }, [stage, timer]);

  useEffect(
    () => () => {
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      if (audioRecorderRef.current?.state === 'recording') audioRecorderRef.current.stop();
      stream?.getTracks().forEach((track) => track.stop());
      if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    },
    [stream, recordedVideoUrl]
  );

  const startSession = async (event) => {
    event.preventDefault();
    if (!setup.firm.trim()) {
      setError('Select or type a firm to begin.');
      return;
    }
    setError('');
    setFeedback(null);
    setRecordedBlob(null);
    setRecordedAudioBlob(null);
    setShowPlayback(false);
    setRecordedVideoUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return '';
    });
    stopHandledRef.current = false;
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(nextStream);
      const nextQuestion = pickQuestion(setup, usedPrompts);
      setQuestion(nextQuestion);
      setUsedPrompts((current) => [...current, nextQuestion.prompt]);
      setTimer(PREP_SECONDS);
      setStage('prep');
      setPermissionStatus('');
    } catch {
      setPermissionStatus('Camera and microphone permission are required for HireVue Prep.');
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    audioChunksRef.current = [];
    stopHandledRef.current = false;
    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) {
      setError('We could not detect microphone audio. Please check microphone permission and retry.');
      return;
    }
    const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' : 'video/webm' });
    const audioStream = new MediaStream(audioTracks);
    const audioMimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
    const audioRecorder = new MediaRecorder(audioStream, { mimeType: audioMimeType });
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    audioRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      if (stopHandledRef.current) return;
      stopHandledRef.current = true;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
      const playbackUrl = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedVideoUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return playbackUrl;
      });
      setShowPlayback(false);
      setStage('review');
    };
    audioRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: audioRecorder.mimeType || audioMimeType });
      console.info('[hirevue] audio recording finalized', {
        type: audioBlob.type,
        size: audioBlob.size,
        audioChunks: audioChunksRef.current.length
      });
      setRecordedAudioBlob(audioBlob);
    };
    mediaRecorderRef.current = recorder;
    audioRecorderRef.current = audioRecorder;
    console.info('[hirevue] recording started', {
      videoMimeType: recorder.mimeType,
      audioMimeType: audioRecorder.mimeType,
      audioTracks: audioTracks.length
    });
    audioRecorder.start();
    recorder.start();
    setTimer(ANSWER_SECONDS);
    setStage('recording');
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      if (audioRecorderRef.current?.state === 'recording') audioRecorderRef.current.stop();
    } else {
      setStage('review');
    }
  };

  const evaluateAnswer = async () => {
    if (!recordedBlob) return;
    if (!recordedAudioBlob || recordedAudioBlob.size < 500) {
      setError('We couldn’t analyze the audio. Please retry the recording.');
      console.error('[hirevue] audio extraction failed or produced an empty blob', {
        hasVideoBlob: Boolean(recordedBlob),
        videoBlobType: recordedBlob?.type,
        videoBlobSize: recordedBlob?.size,
        hasAudioBlob: Boolean(recordedAudioBlob),
        audioBlobType: recordedAudioBlob?.type,
        audioBlobSize: recordedAudioBlob?.size
      });
      return;
    }
    setIsEvaluating(true);
    setError('');
    try {
      console.info('[hirevue] sending speech-only evaluation payload', {
        videoBlobType: recordedBlob.type,
        videoBlobSize: recordedBlob.size,
        audioBlobType: recordedAudioBlob.type,
        audioBlobSize: recordedAudioBlob.size,
        audioExists: recordedAudioBlob.size > 0
      });
      const audioDataUrl = await blobToDataUrl(recordedAudioBlob);
      const response = await fetch('/api/hirevue-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setup,
          question: question.prompt,
          mimeType: recordedAudioBlob.type || 'audio/webm',
          dataUrl: audioDataUrl,
          durationSeconds: ANSWER_SECONDS - timer
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        console.error('[hirevue] evaluation API failed', {
          status: response.status,
          error: payload.error,
          details: payload.details
        });
        throw new Error(payload.error || 'We couldn’t analyze the audio. Please retry the recording.');
      }
      setFeedback(await response.json());
      setStage('feedback');
    } catch (evaluationError) {
      setError(evaluationError.message || 'We couldn’t analyze the audio. Please retry the recording.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const retryQuestion = () => {
    setFeedback(null);
    setRecordedBlob(null);
    setRecordedAudioBlob(null);
    setRecordedVideoUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return '';
    });
    setShowPlayback(false);
    setTimer(PREP_SECONDS);
    stopHandledRef.current = false;
    setStage('prep');
  };

  const nextQuestion = () => {
    const next = pickQuestion(setup, usedPrompts);
    setQuestion(next);
    setUsedPrompts((current) => [...current, next.prompt]);
    setFeedback(null);
    setRecordedBlob(null);
    setRecordedAudioBlob(null);
    setRecordedVideoUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return '';
    });
    setShowPlayback(false);
    setTimer(PREP_SECONDS);
    stopHandledRef.current = false;
    setStage('prep');
  };

  const endSession = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setQuestion(null);
    setRecordedBlob(null);
    setRecordedAudioBlob(null);
    setRecordedVideoUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return '';
    });
    setShowPlayback(false);
    setFeedback(null);
    setUsedPrompts([]);
    setTimer(PREP_SECONDS);
    setStage('setup');
  };

  if (stage === 'setup') {
    const firmMatches = setup.firm
      ? firms.filter((firm) => firm.toLowerCase().includes(setup.firm.toLowerCase())).slice(0, 8)
      : firms.slice(0, 8);

    return (
      <>
        <button type="button" className="back-button" onClick={onBack}>
          Back to Home
        </button>
        <section className="panel hirevue-setup-panel">
          <div>
            <span className="feature-eyebrow">Timed video screen</span>
            <h2>HireVue Prep</h2>
            <p className="muted">Simulate a standardized first-round video interview with timed prep, timed answers, and AI feedback.</p>
          </div>
          <form className="hirevue-setup-form" onSubmit={startSession}>
            <label>
              Firm
              <input value={setup.firm} onChange={(event) => setSetup((current) => ({ ...current, firm: event.target.value }))} placeholder="Search or type a firm..." list="hirevue-firms" />
              <datalist id="hirevue-firms">
                {firmMatches.map((firm) => (
                  <option value={firm} key={firm} />
                ))}
              </datalist>
            </label>
            <label>
              Group
              <select value={setup.group} onChange={(event) => setSetup((current) => ({ ...current, group: event.target.value }))}>
                {groupOptions.map((group) => (
                  <option value={group} key={group}>{group}</option>
                ))}
              </select>
            </label>
            <label>
              Hire Type
              <select value={setup.hireType} onChange={(event) => setSetup((current) => ({ ...current, hireType: event.target.value }))}>
                {hireTypes.map((hireType) => (
                  <option value={hireType} key={hireType}>{hireType}</option>
                ))}
              </select>
            </label>
            {permissionStatus ? <p className="error">{permissionStatus}</p> : null}
            {error ? <p className="error">{error}</p> : null}
            <button type="submit" className="primary">Start Timed Simulation</button>
          </form>
        </section>
      </>
    );
  }

  return (
    <>
      <button type="button" className="back-button" onClick={endSession}>
        End Session
      </button>
      <section className="panel hirevue-session-panel">
        <div className="hirevue-topbar">
          <div>
            <span className="feature-eyebrow">{setup.firm} · {setup.group}</span>
            <h2>{stage === 'prep' ? 'Prepare your answer' : stage === 'recording' ? 'Recording response' : stage === 'review' ? 'Response captured' : 'AI evaluation'}</h2>
          </div>
          {stage === 'prep' || stage === 'recording' ? (
            <div className={stage === 'recording' ? 'hirevue-timer recording' : 'hirevue-timer'}>
              <span>{stage === 'prep' ? 'Prep Time' : 'Answer Time'}</span>
              <strong>{formatTime(timer)}</strong>
            </div>
          ) : null}
        </div>

        <div className="hirevue-question-strip">
          <span>Question</span>
          <p>{question?.prompt}</p>
        </div>

        <div className="hirevue-video-stage">
          <video ref={videoRef} autoPlay muted playsInline className="hirevue-video-preview" />
          {stage === 'recording' ? <div className="hirevue-rec-indicator"><span /> Recording</div> : null}
          {stage === 'prep' ? <div className="hirevue-overlay">Recording starts automatically when prep time ends.</div> : null}
        </div>

        {stage === 'review' && showPlayback && recordedVideoUrl ? (
          <div className="hirevue-playback-card">
            <h3>Your Recording</h3>
            <video src={recordedVideoUrl} controls playsInline className="hirevue-playback-video" />
          </div>
        ) : null}

        {stage === 'prep' ? (
          <div className="hirevue-actions">
            <button type="button" className="primary" onClick={startRecording}>Begin Recording Now</button>
          </div>
        ) : null}

        {stage === 'recording' ? (
          <div className="hirevue-actions">
            <button type="button" className="secondary" onClick={stopRecording}>Stop Recording</button>
          </div>
        ) : null}

        {stage === 'review' ? (
          <div className="hirevue-actions">
            <button type="button" className="secondary" onClick={() => setShowPlayback((current) => !current)} disabled={!recordedVideoUrl}>
              {showPlayback ? 'Hide Recording' : 'Watch Recording'}
            </button>
            <button type="button" className="primary" onClick={evaluateAnswer} disabled={isEvaluating}>{isEvaluating ? 'Evaluating...' : 'Generate AI Feedback'}</button>
            <button type="button" className="secondary" onClick={retryQuestion}>Retry Question</button>
          </div>
        ) : null}

        {error ? <p className="error">{error}</p> : null}

        {stage === 'feedback' && feedback ? (
          <section className="hirevue-feedback">
            <div className="feedback-score">
              <span>Overall Score</span>
              <strong>{feedback.overallScoreOutOf10}/10</strong>
            </div>
            <div className="hirevue-score-grid">
              {['communication', 'structure', 'confidence', 'professionalism', 'conciseness'].map((key) => (
                <div key={key}>
                  <span>{key}</span>
                  <strong>{feedback.categoryScores[key]}/10</strong>
                </div>
              ))}
            </div>
            <div className="feedback-grid">
              <div>
                <h3>Strengths</h3>
                <ul>{feedback.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div>
                <h3>Weaknesses</h3>
                <ul>{feedback.weaknesses.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>
            <div className="feedback-note">
              <h3>Transcript</h3>
              <p>{feedback.transcript}</p>
            </div>
            <div className="feedback-note">
              <h3>Improvement Suggestions</h3>
              <ul>{feedback.improvementSuggestions.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div className="feedback-note example-response">
              <h3>Ideal Response Structure</h3>
              <p>{feedback.idealResponseStructure}</p>
            </div>
            <div className="hirevue-actions">
              <button type="button" className="primary" onClick={nextQuestion}>Next Question</button>
              <button type="button" className="secondary" onClick={retryQuestion}>Retry Question</button>
              <button type="button" className="secondary" onClick={endSession}>End Session</button>
            </div>
          </section>
        ) : null}
      </section>
    </>
  );
}
