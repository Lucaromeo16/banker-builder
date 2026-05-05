import { useEffect, useMemo, useState } from 'react';
import ScoreBreakdown from './ScoreBreakdown';
import schools from '../../../data/schools.json';

const fallbackGroups = [
  'Generalist',
  'M&A',
  'Restructuring',
  'Financial Sponsors',
  'Technology',
  'Healthcare',
  'Industrials',
  'Consumer & Retail',
  'Financial Institutions'
];

const activityTypeOptions = [
  'Selective IB club',
  'Investment fund / student-run fund',
  'Business fraternity',
  'Social fraternity / sorority executive board',
  'Finance/business club',
  'Consulting club',
  'Entrepreneurship club',
  'Non-business leadership organization',
  'Other'
];

const selectivityOptions = [
  { value: 'highly selective', label: 'Highly selective' },
  { value: 'selective', label: 'Selective' },
  { value: 'moderate', label: 'Moderate signal' },
  { value: 'open enrollment', label: 'Open enrollment' }
];

const leadershipOptions = [
  { value: 'president', label: 'President' },
  { value: 'vp', label: 'VP' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'committee lead', label: 'Committee Lead' },
  { value: 'member', label: 'Member' },
  { value: 'none', label: 'None' }
];

const workTypeOptions = [
  'None',
  'Part-time job',
  'Campus job',
  'Search fund internship',
  'Corporate finance internship',
  'Accounting / audit internship',
  'Wealth management internship',
  'Private equity internship',
  'Investment banking internship',
  'Other finance internship',
  'Other internship'
];

const seniorityOptions = [
  { value: 'analyst', label: 'Analyst' },
  { value: 'associate', label: 'Associate' },
  { value: 'vp', label: 'VP' },
  { value: 'director', label: 'Director' },
  { value: 'md', label: 'Managing Director' }
];

const connectionOptions = [
  { value: 'none', label: 'No clear connection' },
  { value: 'cold outreach', label: 'Cold outreach' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'employee referral', label: 'Employee referral' },
  { value: 'family/friend', label: 'Family / friend' }
];

const stepTitles = [
  'Bank + Office Selection',
  'Hire Type',
  'Group Selection',
  'Academic Info',
  'Extracurriculars & Leadership',
  'Prior Work / Internship Experience',
  'Networking Info',
  'Review Your Inputs'
];

const createActivity = () => ({
  id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  activityType: 'Selective IB club',
  selectivity: 'selective',
  leadershipLevel: 'member'
});

const createWorkExperience = () => ({
  id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  workType: 'None'
});

const defaultProfile = {
  school: schools[0].schoolName,
  gpa: 3.7,
  workType: 'None',
  workExperiences: [createWorkExperience()],
  activities: [createActivity()],
  networking: {
    initialChats: 8,
    followUps: 5,
    strongRelationships: 2,
    referrals: 1,
    strongestContactSeniority: 'associate',
    connectionType: 'alumni'
  }
};

function oddsStatus(likelihood) {
  if (likelihood >= 55) return { label: 'Strong', className: 'strong' };
  if (likelihood >= 25) return { label: 'Moderate', className: 'moderate' };
  return { label: 'Low', className: 'low' };
}

function NumberField({ label, value, onChange, step = 1, min = 0, max = 100 }) {
  return (
    <label>
      <span>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export default function InterviewOddsPage({ onBack }) {
  const [showIntro, setShowIntro] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [opportunities, setOpportunities] = useState({ firms: [], groups: fallbackGroups });
  const [selection, setSelection] = useState({
    hireType: 'Summer Analyst',
    firm: '',
    office: '',
    group: 'Generalist'
  });
  const [profile, setProfile] = useState(defaultProfile);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadOpportunities() {
      try {
        const response = await fetch('http://localhost:4000/api/opportunities');
        if (!response.ok) throw new Error('Failed to load opportunities');
        const data = await response.json();
        if (ignore) return;

        const firstFirm = data.opportunities?.[0] || data.firms[0];
        setOpportunities(data);
        setSelection({
          hireType: 'Summer Analyst',
          firm: firstFirm?.firm || firstFirm?.name || '',
          office: firstFirm?.office || '',
          group: firstFirm?.group || data.groups[0] || 'Generalist'
        });
      } catch (err) {
        if (!ignore) setError(err.message || 'Could not load opportunities');
      }
    }

    loadOpportunities();

    return () => {
      ignore = true;
    };
  }, []);

  const firmOptions = useMemo(
    () => [...new Set(opportunities.firms.map((opportunity) => opportunity.firm || opportunity.name))],
    [opportunities.firms]
  );

  const officeOptions = useMemo(
    () =>
      [
        ...new Set(
          opportunities.firms
            .filter((opportunity) => (opportunity.firm || opportunity.name) === selection.firm)
            .map((opportunity) => opportunity.office)
        )
      ],
    [opportunities.firms, selection.firm]
  );

  const groupOptions = useMemo(
    () =>
      opportunities.firms
        .filter(
          (opportunity) =>
            (opportunity.firm || opportunity.name) === selection.firm &&
            opportunity.office === selection.office
        )
        .map((opportunity) => opportunity.group)
        .filter(Boolean),
    [opportunities.firms, selection.firm, selection.office]
  );

  const activeGroupOptions = groupOptions.length ? groupOptions : opportunities.groups || fallbackGroups;
  const progressPercent = ((currentStep + 1) / stepTitles.length) * 100;
  const status = result ? oddsStatus(result.likelihood) : null;

  const handleFirmChange = (firmName) => {
    const nextFirm = opportunities.firms.find((opportunity) => (opportunity.firm || opportunity.name) === firmName);
    const nextOffice = nextFirm?.office || '';
    const nextGroup = opportunities.firms.find(
      (opportunity) => (opportunity.firm || opportunity.name) === firmName && opportunity.office === nextOffice
    )?.group;

    setSelection((prev) => ({
      ...prev,
      firm: firmName,
      office: nextOffice,
      group: nextGroup || prev.group
    }));
    setResult(null);
  };

  const handleOfficeChange = (office) => {
    const nextOpportunity = opportunities.firms.find(
      (opportunity) => (opportunity.firm || opportunity.name) === selection.firm && opportunity.office === office
    );

    setSelection((prev) => ({
      ...prev,
      office,
      group: nextOpportunity?.group || prev.group
    }));
    setResult(null);
  };

  const setNetworking = (key, value) => {
    setProfile((prev) => ({
      ...prev,
      networking: {
        ...prev.networking,
        [key]: value
      }
    }));
  };

  const addActivity = () => {
    setProfile((prev) => ({ ...prev, activities: [...prev.activities, createActivity()] }));
  };

  const updateActivity = (id, key, value) => {
    setProfile((prev) => ({
      ...prev,
      activities: prev.activities.map((activity) => (activity.id === id ? { ...activity, [key]: value } : activity))
    }));
  };

  const removeActivity = (id) => {
    setProfile((prev) => ({ ...prev, activities: prev.activities.filter((activity) => activity.id !== id) }));
  };

  const addWorkExperience = () => {
    setProfile((prev) => ({ ...prev, workExperiences: [...prev.workExperiences, createWorkExperience()] }));
  };

  const updateWorkExperience = (id, value) => {
    setProfile((prev) => ({
      ...prev,
      workExperiences: prev.workExperiences.map((experience) =>
        experience.id === id ? { ...experience, workType: value } : experience
      )
    }));
  };

  const removeWorkExperience = (id) => {
    setProfile((prev) => ({ ...prev, workExperiences: prev.workExperiences.filter((experience) => experience.id !== id) }));
  };

  const goNext = () => {
    setError('');
    setCurrentStep((step) => Math.min(step + 1, stepTitles.length - 1));
  };

  const goBack = () => {
    setError('');
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const startOver = () => {
    setShowIntro(true);
    setCurrentStep(0);
    setProfile(defaultProfile);
    setResult(null);
    setLoading(false);
    setError('');
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    const profilePayload = {
      ...profile,
      workType:
        profile.workExperiences.find((experience) => experience.workType !== 'None')?.workType ||
        profile.workExperiences[0]?.workType ||
        'None'
    };

    try {
      const [response] = await Promise.all([
        fetch('http://localhost:4000/api/interview-odds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firmName: selection.firm,
            office: selection.office,
            group: selection.group,
            hireType: selection.hireType,
            profile: profilePayload
          })
        }),
        new Promise((resolve) => setTimeout(resolve, 1200))
      ]);

      if (!response.ok) {
        throw new Error('Failed to calculate interview odds');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <>
          <h2>Which bank and office are you targeting?</h2>
          <div className="grid">
            <label>
              <span>Firm</span>
              <select value={selection.firm} onChange={(e) => handleFirmChange(e.target.value)}>
                {firmOptions.map((firm) => (
                  <option key={firm} value={firm}>
                    {firm}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Office</span>
              <select value={selection.office} onChange={(e) => handleOfficeChange(e.target.value)}>
                {officeOptions.map((office) => (
                  <option key={office} value={office}>
                    {office}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      );
    }

    if (currentStep === 1) {
      return (
        <>
          <h2>What type of role are you recruiting for?</h2>
          <div className="choice-grid">
            {['Summer Analyst', 'Lateral Hire', 'MBA Associate'].map((hireType) => (
              <button
                type="button"
                key={hireType}
                className={selection.hireType === hireType ? 'choice-card selected' : 'choice-card'}
                onClick={() => setSelection((prev) => ({ ...prev, hireType }))}
              >
                {hireType}
              </button>
            ))}
          </div>
        </>
      );
    }

    if (currentStep === 2) {
      return (
        <>
          <h2>Which group are you targeting?</h2>
          <label>
            <span>Group</span>
            <select value={selection.group} onChange={(e) => setSelection({ ...selection, group: e.target.value })}>
              {activeGroupOptions.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
        </>
      );
    }

    if (currentStep === 3) {
      return (
        <>
          <h2>Academic Info</h2>
          <div className="grid">
            <label>
              <span>School</span>
              <select value={profile.school} onChange={(e) => setProfile({ ...profile, school: e.target.value })}>
                {schools.map((school) => (
                  <option key={school.schoolName} value={school.schoolName}>
                    {school.schoolName} ({school.tier})
                  </option>
                ))}
              </select>
            </label>
            <NumberField
              label="GPA"
              value={profile.gpa}
              min={2}
              max={4}
              step={0.01}
              onChange={(value) => setProfile({ ...profile, gpa: value })}
            />
          </div>
        </>
      );
    }

    if (currentStep === 4) {
      return (
        <>
          <div className="section-heading">
            <h2>Extracurriculars & Leadership</h2>
            <button type="button" className="secondary" onClick={addActivity}>
              Add Activity
            </button>
          </div>
          <div className="activity-list">
            {profile.activities.map((activity, index) => (
              <article className="activity-card" key={activity.id}>
                <div className="activity-card-heading">
                  <h4>Activity {index + 1}</h4>
                  <button type="button" className="text-button" onClick={() => removeActivity(activity.id)}>
                    Remove
                  </button>
                </div>
                <label>
                  <span>Activity type</span>
                  <select value={activity.activityType} onChange={(e) => updateActivity(activity.id, 'activityType', e.target.value)}>
                    {activityTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Selectivity / resume signal</span>
                  <select value={activity.selectivity} onChange={(e) => updateActivity(activity.id, 'selectivity', e.target.value)}>
                    {selectivityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Leadership level</span>
                  <select value={activity.leadershipLevel} onChange={(e) => updateActivity(activity.id, 'leadershipLevel', e.target.value)}>
                    {leadershipOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </article>
            ))}
          </div>
        </>
      );
    }

    if (currentStep === 5) {
      return (
        <>
          <div className="section-heading">
            <h2>Prior Work / Internship Experience</h2>
            <button type="button" className="secondary" onClick={addWorkExperience}>
              Add Experience
            </button>
          </div>
          <div className="activity-list">
            {profile.workExperiences.map((experience, index) => (
              <article className="activity-card" key={experience.id}>
                <div className="activity-card-heading">
                  <h4>Experience {index + 1}</h4>
                  <button type="button" className="text-button" onClick={() => removeWorkExperience(experience.id)}>
                    Remove
                  </button>
                </div>
                <label>
                  <span>Work Type</span>
                  <select value={experience.workType} onChange={(e) => updateWorkExperience(experience.id, e.target.value)}>
                    {workTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </article>
            ))}
          </div>
        </>
      );
    }

    if (currentStep === 6) {
      return (
        <>
          <h2>Networking Info</h2>
          <div className="grid">
            <NumberField label="Initial chats" value={profile.networking.initialChats} onChange={(value) => setNetworking('initialChats', value)} />
            <NumberField label="Follow-ups" value={profile.networking.followUps} onChange={(value) => setNetworking('followUps', value)} />
            <NumberField
              label="Strong relationships"
              value={profile.networking.strongRelationships}
              onChange={(value) => setNetworking('strongRelationships', value)}
            />
            <NumberField label="Referrals" value={profile.networking.referrals} onChange={(value) => setNetworking('referrals', value)} />
            <label>
              <span>Strongest contact seniority</span>
              <select
                value={profile.networking.strongestContactSeniority}
                onChange={(e) => setNetworking('strongestContactSeniority', e.target.value)}
              >
                {seniorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Connection type</span>
              <select value={profile.networking.connectionType} onChange={(e) => setNetworking('connectionType', e.target.value)}>
                {connectionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      );
    }

    return (
      <>
        <h2>Review Your Inputs</h2>
        <div className="review-grid">
          <section>
            <h3>Opportunity</h3>
            <p>{selection.firm} · {selection.office} · {selection.group}</p>
            <p>{selection.hireType}</p>
          </section>
          <section>
            <h3>Academic Info</h3>
            <p>{profile.school || 'School not entered'}</p>
            <p>GPA: {profile.gpa}</p>
          </section>
          <section>
            <h3>Activities</h3>
            {profile.activities.map((activity) => (
              <p key={activity.id}>{activity.activityType} · {activity.selectivity} · {activity.leadershipLevel}</p>
            ))}
          </section>
          <section>
            <h3>Work Experience</h3>
            {profile.workExperiences.map((experience) => (
              <p key={experience.id}>{experience.workType}</p>
            ))}
          </section>
          <section>
            <h3>Networking</h3>
            <p>
              {profile.networking.initialChats} chats · {profile.networking.followUps} follow-ups ·{' '}
              {profile.networking.strongRelationships} strong relationships · {profile.networking.referrals} referrals
            </p>
            <p>{profile.networking.strongestContactSeniority} · {profile.networking.connectionType}</p>
          </section>
        </div>
      </>
    );
  };

  if (showIntro) {
    return (
      <>
        <button type="button" className="back-button" onClick={onBack}>
          Back to Home
        </button>

        <section className="panel intro-panel">
          <div className="intro-content">
            <span className="feature-eyebrow">Firm-specific recruiting model</span>
            <h2>Interview Odds Calculator</h2>
            <p className="intro-subtitle">
              Estimate your likelihood of receiving an interview at a specific investment bank, office, and group based on your profile.
            </p>

            <div className="intro-copy">
              <p>This tool models recruiting competitiveness across firms, offices, and groups.</p>
              <p>It accounts for academics, experience, networking, and leadership signals in your profile.</p>
              <p>Results are directional and meant to guide your recruiting strategy, not predict outcomes with certainty.</p>
            </div>

            <ul className="intro-list">
              <li>Firm / office / group-specific analysis</li>
              <li>Nonlinear GPA and experience weighting</li>
              <li>Actionable feedback to improve your odds</li>
            </ul>

            <button type="button" className="primary intro-cta" onClick={() => setShowIntro(false)}>
              Get Started
            </button>
          </div>
        </section>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <button type="button" className="back-button" onClick={onBack}>
          Back to Home
        </button>
        <section className="panel survey-card thinking-card">
          <span className="feature-eyebrow">Analyzing your profile...</span>
          <h2>Comparing against firm, office, and group competitiveness...</h2>
        </section>
      </>
    );
  }

  if (result) {
    return (
      <>
        <div className="button-row">
          <button type="button" className="back-button" onClick={startOver}>
            Start Over
          </button>
          <button type="button" className="back-button" onClick={onBack}>
            Back to Home
          </button>
        </div>

        <section className={`panel odds-result ${status.className}`}>
          <div>
            <span className="feature-eyebrow">Estimated interview odds</span>
            <div className="odds-score-row">
              <h2>{result.likelihood}%</h2>
              <span className={`classification-pill ${status.className}`}>{status.label}</span>
            </div>
            <p>
              {result.hireType} · {result.opportunity.firm} · {result.opportunity.office} · {result.opportunity.group}
            </p>
            <p>{result.reason}</p>
          </div>

          <ScoreBreakdown scores={result.scoreBreakdown} />

          <div className="columns">
            <section>
              <h4>Strengths</h4>
              <ul>
                {result.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h4>Constraints / Gaps</h4>
              <ul>
                {result.gaps.length ? result.gaps.map((item) => <li key={item}>{item}</li>) : <li>No major gaps flagged for this opportunity.</li>}
              </ul>
            </section>

            <section>
              <h4>Action Steps</h4>
              <ul>
                {result.actionSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <button type="button" className="back-button" onClick={onBack}>
        Back to Home
      </button>

      <section className="panel survey-card">
        <div className="survey-progress">
          <span>
            Step {currentStep + 1} of {stepTitles.length}
          </span>
          <strong>{stepTitles[currentStep]}</strong>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="survey-step">{renderStep()}</div>

        {error ? <p className="error">{error}</p> : null}

        <div className="survey-actions">
          {currentStep > 0 ? (
            <button type="button" className="secondary" onClick={goBack}>
              Back
            </button>
          ) : (
            <span />
          )}
          {currentStep < stepTitles.length - 1 ? (
            <button type="button" className="primary" onClick={goNext}>
              Next
            </button>
          ) : (
            <button type="button" className="primary" onClick={handleCalculate}>
              Calculate Interview Odds
            </button>
          )}
        </div>
      </section>
    </>
  );
}
