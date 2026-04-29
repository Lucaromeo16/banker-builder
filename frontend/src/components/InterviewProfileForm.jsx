import { useState } from 'react';

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

const createActivity = () => ({
  id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  activityType: 'Selective IB club',
  selectivity: 'selective',
  leadershipLevel: 'member'
});

const defaultForm = {
  school: '',
  gpa: 3.7,
  workType: 'None',
  networking: {
    initialChats: 8,
    followUps: 5,
    strongRelationships: 2,
    referrals: 1,
    strongestContactSeniority: 'associate',
    connectionType: 'alumni'
  },
  activities: [createActivity()]
};

function NumberField({ label, value, onChange, step = 1, min = 0, max = 100 }) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export default function InterviewProfileForm({ onSubmit, loading }) {
  const [form, setForm] = useState(defaultForm);

  const setNetworking = (key, value) => {
    setForm((prev) => ({
      ...prev,
      networking: {
        ...prev.networking,
        [key]: value
      }
    }));
  };

  const addActivity = () => {
    setForm((prev) => ({
      ...prev,
      activities: [...prev.activities, createActivity()]
    }));
  };

  const updateActivity = (id, key, value) => {
    setForm((prev) => ({
      ...prev,
      activities: prev.activities.map((activity) =>
        activity.id === id ? { ...activity, [key]: value } : activity
      )
    }));
  };

  const removeActivity = (id) => {
    setForm((prev) => ({
      ...prev,
      activities: prev.activities.filter((activity) => activity.id !== id)
    }));
  };

  return (
    <section className="panel">
      <h2>Profile Input</h2>
      <form
        className="interview-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
      >
        <section className="form-section">
          <h3>Academic Info</h3>
          <div className="grid">
            <label>
              <span>School</span>
              <input
                value={form.school}
                onChange={(e) => setForm({ ...form, school: e.target.value })}
                placeholder="e.g., NYU Stern"
              />
            </label>

            <NumberField
              label="GPA"
              value={form.gpa}
              min={2}
              max={4}
              step={0.01}
              onChange={(value) => setForm({ ...form, gpa: value })}
            />
          </div>
        </section>

        <section className="form-section">
          <div className="section-heading">
            <h3>Extracurriculars & Leadership</h3>
            <button type="button" className="secondary" onClick={addActivity}>
              Add Activity
            </button>
          </div>

          {form.activities.length ? (
            <div className="activity-list">
              {form.activities.map((activity, index) => (
                <article className="activity-card" key={activity.id}>
                  <div className="activity-card-heading">
                    <h4>Activity {index + 1}</h4>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => removeActivity(activity.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <label>
                    <span>Activity type</span>
                    <select
                      value={activity.activityType}
                      onChange={(e) => updateActivity(activity.id, 'activityType', e.target.value)}
                    >
                      {activityTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Selectivity / resume signal</span>
                    <select
                      value={activity.selectivity}
                      onChange={(e) => updateActivity(activity.id, 'selectivity', e.target.value)}
                    >
                      {selectivityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Leadership level</span>
                    <select
                      value={activity.leadershipLevel}
                      onChange={(e) => updateActivity(activity.id, 'leadershipLevel', e.target.value)}
                    >
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
          ) : (
            <p className="muted">No activities added.</p>
          )}
        </section>

        <section className="form-section">
          <h3>Prior Work / Internship Experience</h3>
          <div className="grid">
            <label>
              <span>Work Type</span>
              <select
                value={form.workType}
                onChange={(e) => setForm({ ...form, workType: e.target.value })}
              >
                {workTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="form-section">
          <h3>Networking Inputs</h3>
          <div className="grid">
            <NumberField
              label="Initial chats"
              value={form.networking.initialChats}
              onChange={(value) => setNetworking('initialChats', value)}
            />
            <NumberField
              label="Follow-ups"
              value={form.networking.followUps}
              onChange={(value) => setNetworking('followUps', value)}
            />
            <NumberField
              label="Strong relationships"
              value={form.networking.strongRelationships}
              onChange={(value) => setNetworking('strongRelationships', value)}
            />
            <NumberField
              label="Referrals"
              value={form.networking.referrals}
              onChange={(value) => setNetworking('referrals', value)}
            />

            <label>
              <span>Strongest Contact Seniority</span>
              <select
                value={form.networking.strongestContactSeniority}
                onChange={(e) => setNetworking('strongestContactSeniority', e.target.value)}
              >
                <option value="analyst">Analyst</option>
                <option value="associate">Associate</option>
                <option value="vp+">VP+</option>
              </select>
            </label>

            <label>
              <span>Connection Type</span>
              <select
                value={form.networking.connectionType}
                onChange={(e) => setNetworking('connectionType', e.target.value)}
              >
                <option value="cold">Cold</option>
                <option value="alumni">Alumni</option>
                <option value="close connection">Close connection</option>
              </select>
            </label>
          </div>
        </section>

        <button disabled={loading} className="primary" type="submit">
          {loading ? 'Calculating...' : 'Calculate Interview Odds'}
        </button>
      </form>
    </section>
  );
}
