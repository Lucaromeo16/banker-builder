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
  'Front office finance internship',
  'Middle office finance internship',
  'Back office / operations finance internship',
  'Private equity internship',
  'Investment banking internship',
  'Venture capital internship',
  'Other internship'
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

const defaultForm = {
  school: '',
  gpa: 3.7,
  workExperiences: [createWorkExperience()],
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

export default function InputForm({
  onSubmit,
  loading,
  title = 'Profile Input',
  submitLabel = 'Build My Bank List',
  loadingLabel = 'Scoring...'
}) {
  const [form, setForm] = useState(defaultForm);

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

  const addWorkExperience = () => {
    setForm((prev) => ({
      ...prev,
      workExperiences: [...prev.workExperiences, createWorkExperience()]
    }));
  };

  const updateWorkExperience = (id, value) => {
    setForm((prev) => ({
      ...prev,
      workExperiences: prev.workExperiences.map((experience) =>
        experience.id === id ? { ...experience, workType: value } : experience
      )
    }));
  };

  const removeWorkExperience = (id) => {
    setForm((prev) => ({
      ...prev,
      workExperiences: prev.workExperiences.filter((experience) => experience.id !== id)
    }));
  };

  return (
    <section className="panel">
      <h2>{title}</h2>
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
            <h3>Prior Work / Internship Experience</h3>
            <button type="button" className="secondary" onClick={addWorkExperience}>
              Add Experience
            </button>
          </div>

          {form.workExperiences.length ? (
            <div className="activity-list">
              {form.workExperiences.map((experience, index) => (
                <article className="activity-card" key={experience.id}>
                  <div className="activity-card-heading">
                    <h4>Experience {index + 1}</h4>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => removeWorkExperience(experience.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <label>
                    <span>Work Type</span>
                    <select
                      value={experience.workType}
                      onChange={(e) => updateWorkExperience(experience.id, e.target.value)}
                    >
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
          ) : (
            <p className="muted">No work experiences added.</p>
          )}
        </section>

        <section className="form-section">
          <div className="section-heading">
            <h3>Leadership / Extracurriculars</h3>
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

        <button disabled={loading} className="primary" type="submit">
          {loading ? loadingLabel : submitLabel}
        </button>
      </form>
    </section>
  );
}
