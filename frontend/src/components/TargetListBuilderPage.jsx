import { useState } from 'react';
import schools from '../../../data/schools.json';

const stepTitles = [
  'IB Interest',
  'Location Preference',
  'Academic Info',
  'Prior Work / Internship Experience',
  'Leadership / Extracurriculars',
  'Review Your Inputs'
];

const ibInterestOptions = [
  'M&A',
  'Restructuring',
  'Debt Capital Markets',
  'Equity Capital Markets',
  'Leveraged Finance',
  'Public Finance',
  'Financial Sponsors',
  'Healthcare',
  'Technology',
  'Industrials',
  'Consumer/Retail',
  'FIG',
  'Real Estate',
  'Energy',
  'Generalist',
  'Not sure yet'
];

const locationOptions = [
  'No preference',
  'New York',
  'Chicago',
  'Los Angeles',
  'San Francisco',
  'Boston',
  'Charlotte',
  'Atlanta',
  'Dallas',
  'Houston',
  'Minneapolis',
  'Milwaukee',
  'Baltimore',
  'Washington, DC',
  'Other'
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
  { value: 'finance chair', label: 'Finance Chair' },
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

const interestToGroups = {
  'M&A': ['M&A'],
  'Restructuring': ['Restructuring'],
  'Debt Capital Markets': ['Financial Institutions', 'Financial Sponsors', 'Generalist'],
  'Equity Capital Markets': ['Technology', 'Healthcare', 'Generalist'],
  'Leveraged Finance': ['Financial Sponsors', 'M&A'],
  'Public Finance': ['Financial Institutions', 'Generalist'],
  'Financial Sponsors': ['Financial Sponsors'],
  'Healthcare': ['Healthcare', 'Healthcare Services'],
  'Technology': ['Technology'],
  'Industrials': ['Industrials'],
  'Consumer/Retail': ['Consumer & Retail'],
  'FIG': ['Financial Institutions'],
  'Real Estate': ['Real Estate', 'Generalist'],
  'Energy': ['Energy'],
  'Generalist': ['Generalist', 'M&A']
};

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
  interests: ['Not sure yet'],
  locationPreference: 'No preference',
  otherLocation: '',
  school: schools[0].schoolName,
  gpa: 3.7,
  workExperiences: [createWorkExperience()],
  activities: [createActivity()]
};

function NumberField({ label, value, onChange, step = 1, min = 0, max = 100 }) {
  return (
    <label>
      <span>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function normalizeLocationPreference(profile) {
  return profile.locationPreference === 'Other' ? profile.otherLocation.trim() : profile.locationPreference;
}

function groupInterestScore(group, interests) {
  if (interests.includes('Not sure yet')) {
    return ['Generalist', 'M&A', 'Healthcare', 'Technology', 'Industrials', 'Consumer & Retail', 'Financial Institutions'].includes(group)
      ? 2
      : 0.75;
  }

  const desiredGroups = interests.flatMap((interest) => interestToGroups[interest] || []);
  if (desiredGroups.includes(group)) return 3;
  if (group === 'M&A' && interests.some((interest) => ['Technology', 'Healthcare', 'Industrials', 'Consumer/Retail', 'Energy'].includes(interest))) return 1.25;
  return 0;
}

function locationScore(office, preference) {
  if (!preference || preference === 'No preference') return 0.5;
  return office.toLowerCase() === preference.toLowerCase() ? 3 : 0;
}

function profileFitScore(opportunity) {
  const total = opportunity.scoreBreakdown?.total || 0;
  const delta = Math.abs(total - opportunity.competitiveness);
  return Math.max(0, 4 - delta);
}

function confidenceScore(confidence) {
  if (confidence === 'High') return 1;
  if (confidence === 'Medium') return 0.5;
  return 0;
}

function nextActionFor(category, opportunity) {
  if (category === 'Reach') {
    return `Prioritize warm networking in ${opportunity.office} and prepare a tight story for ${opportunity.group}.`;
  }
  if (category === 'Target') {
    return `Build two to three contacts and tailor your pitch around ${opportunity.group} exposure.`;
  }
  return `Use this as a conversion-oriented option and apply early with a clean, specific outreach note.`;
}

function categoryReason(category, opportunity, preference) {
  const locationText = preference && preference !== 'No preference' ? ` It matches your ${preference} location preference.` : '';
  return `${opportunity.reason}${locationText} This is the best-fit ${opportunity.group} opportunity for ${opportunity.firm} after deduplicating by bank.`;
}

function buildTargetList(scoredResults, profile) {
  const preference = normalizeLocationPreference(profile);
  const locationFiltered =
    preference && preference !== 'No preference'
      ? scoredResults.filter((opportunity) => opportunity.office.toLowerCase() === preference.toLowerCase())
      : scoredResults;

  const ranked = locationFiltered
    .map((opportunity) => {
      const fitScore =
        groupInterestScore(opportunity.group, profile.interests) * 4 +
        locationScore(opportunity.office, preference) * 2 +
        profileFitScore(opportunity) * 2 +
        confidenceScore(opportunity.confidence) +
        (opportunity.scoreBreakdown?.total || 0) * 0.25;

      return { ...opportunity, fitScore };
    })
    .sort(
      (a, b) =>
        b.fitScore - a.fitScore ||
        profileFitScore(b) - profileFitScore(a) ||
        b.competitiveness - a.competitiveness
    );

  const bestByFirm = new Map();
  ranked.forEach((opportunity) => {
    const existing = bestByFirm.get(opportunity.firm);
    if (!existing || opportunity.fitScore > existing.fitScore) {
      bestByFirm.set(opportunity.firm, opportunity);
    }
  });

  const uniqueFirmRanked = [...bestByFirm.values()].sort(
    (a, b) =>
      b.fitScore - a.fitScore ||
      profileFitScore(b) - profileFitScore(a) ||
      b.competitiveness - a.competitiveness
  );

  const used = new Set();
  const take = (category, count) => {
    const preferred = uniqueFirmRanked.filter((item) => item.classification === category && !used.has(item.firm));
    const fallback = uniqueFirmRanked.filter((item) => !used.has(item.firm) && item.classification !== category);
    return [...preferred, ...fallback].slice(0, count).map((item) => {
      used.add(item.firm);
      return {
        ...item,
        matchCategory: category,
        reason: categoryReason(category, item, preference),
        suggestedNextAction: nextActionFor(category, item)
      };
    });
  };

  return {
    Reach: take('Reach', 8),
    Target: take('Target', 12),
    Safety: take('Safety', 5),
    isLimitedByLocation: Boolean(preference && preference !== 'No preference' && uniqueFirmRanked.length < 25)
  };
}

function TargetOpportunityCard({ opportunity }) {
  return (
    <article className={`firm-card ${opportunity.matchCategory.toLowerCase()}`}>
      <div className="firm-heading">
        <h3>
          {opportunity.firm} <span>({opportunity.office} · {opportunity.group})</span>
        </h3>
        <div className="tag-row">
          <span className="tag">{opportunity.type || opportunity.tier}</span>
          <span className={`tag status ${opportunity.matchCategory.toLowerCase()}`}>{opportunity.matchCategory}</span>
        </div>
        <p>{opportunity.reason}</p>
        <p className="meta">
          <strong>Next action:</strong> {opportunity.suggestedNextAction}
        </p>
      </div>
    </article>
  );
}

export default function TargetListBuilderPage({ onBack }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState(defaultProfile);
  const [targetList, setTargetList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const progressPercent = ((currentStep + 1) / stepTitles.length) * 100;

  const toggleInterest = (interest) => {
    setProfile((prev) => {
      if (interest === 'Not sure yet') {
        return { ...prev, interests: ['Not sure yet'] };
      }

      const withoutUnsure = prev.interests.filter((item) => item !== 'Not sure yet');
      const nextInterests = withoutUnsure.includes(interest)
        ? withoutUnsure.filter((item) => item !== interest)
        : [...withoutUnsure, interest];

      return { ...prev, interests: nextInterests.length ? nextInterests : ['Not sure yet'] };
    });
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

  const goNext = () => {
    setError('');
    setCurrentStep((step) => Math.min(step + 1, stepTitles.length - 1));
  };

  const goBack = () => {
    setError('');
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const startOver = () => {
    setCurrentStep(0);
    setProfile(defaultProfile);
    setTargetList(null);
    setLoading(false);
    setError('');
  };

  const buildList = async () => {
    setLoading(true);
    setError('');

    try {
      const [response] = await Promise.all([
        fetch('http://localhost:4000/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            school: profile.school,
            gpa: profile.gpa,
            workExperiences: profile.workExperiences,
            activities: profile.activities
          })
        }),
        new Promise((resolve) => setTimeout(resolve, 1200))
      ]);

      if (!response.ok) {
        throw new Error('Failed to build target list');
      }

      const data = await response.json();
      setTargetList(buildTargetList(data.results, profile));
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
          <h2>What type of investment banking are you interested in?</h2>
          <div className="choice-grid multi-choice-grid">
            {ibInterestOptions.map((interest) => (
              <button
                type="button"
                key={interest}
                className={profile.interests.includes(interest) ? 'choice-card selected' : 'choice-card'}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </button>
            ))}
          </div>
        </>
      );
    }

    if (currentStep === 1) {
      return (
        <>
          <h2>Do you have a location preference?</h2>
          <div className="grid">
            <label>
              <span>Location preference</span>
              <select value={profile.locationPreference} onChange={(e) => setProfile({ ...profile, locationPreference: e.target.value })}>
                {locationOptions.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </label>
            {profile.locationPreference === 'Other' ? (
              <label>
                <span>Preferred location</span>
                <input value={profile.otherLocation} onChange={(e) => setProfile({ ...profile, otherLocation: e.target.value })} placeholder="Enter city" />
              </label>
            ) : null}
          </div>
        </>
      );
    }

    if (currentStep === 2) {
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
            <NumberField label="GPA" value={profile.gpa} min={2} max={4} step={0.01} onChange={(value) => setProfile({ ...profile, gpa: value })} />
          </div>
        </>
      );
    }

    if (currentStep === 3) {
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

    if (currentStep === 4) {
      return (
        <>
          <div className="section-heading">
            <h2>Leadership / Extracurriculars</h2>
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

    return (
      <>
        <h2>Review Your Inputs</h2>
        <div className="review-grid">
          <section>
            <h3>IB Interests</h3>
            <p>{profile.interests.join(', ')}</p>
          </section>
          <section>
            <h3>Location Preference</h3>
            <p>{normalizeLocationPreference(profile) || 'No preference'}</p>
          </section>
          <section>
            <h3>Academic Info</h3>
            <p>{profile.school || 'School not entered'}</p>
            <p>GPA: {profile.gpa}</p>
          </section>
          <section>
            <h3>Work Experience</h3>
            {profile.workExperiences.map((experience) => (
              <p key={experience.id}>{experience.workType}</p>
            ))}
          </section>
          <section>
            <h3>Activities / Leadership</h3>
            {profile.activities.map((activity) => (
              <p key={activity.id}>{activity.activityType} · {activity.selectivity} · {activity.leadershipLevel}</p>
            ))}
          </section>
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <>
        <button type="button" className="back-button" onClick={onBack}>
          Back to Home
        </button>
        <section className="panel survey-card thinking-card">
          <span className="feature-eyebrow">Building your target list...</span>
          <h2>Matching your profile to firms, offices, and groups...</h2>
        </section>
      </>
    );
  }

  if (targetList) {
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

        <section className="panel results">
          <h2>Target List Results</h2>
          {targetList.isLimitedByLocation ? (
            <p className="limited-results-note">
              Fewer recommendations are shown because this location has limited matching firms in the current dataset.
            </p>
          ) : null}
          <div className="results-grid">
            {['Reach', 'Target', 'Safety'].map((category) => (
              <div key={category} className={`category-block ${category.toLowerCase()}`}>
                <h3>
                  {category} <span>{targetList[category].length}</span>
                </h3>
                <div className="stack">
                  {targetList[category].map((opportunity) => (
                    <TargetOpportunityCard key={`${category}-${opportunity.id}`} opportunity={opportunity} />
                  ))}
                </div>
              </div>
            ))}
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
            <button type="button" className="primary" onClick={buildList}>
              Build Target List
            </button>
          )}
        </div>
      </section>
    </>
  );
}
