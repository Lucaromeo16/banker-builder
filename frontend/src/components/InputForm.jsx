import { useState } from 'react';

const offices = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Charlotte',
  'Atlanta',
  'Richmond',
  'Minneapolis',
  'Milwaukee',
  'Portland',
  'Little Rock',
  'Baltimore'
];

const defaultForm = {
  school: '',
  gpa: 3.7,
  internshipType: 'finance',
  exposureLevel: 'moderate',
  networking: {
    initialChats: 8,
    followUps: 5,
    strongRelationships: 2,
    referrals: 1,
    strongestContactSeniority: 'associate',
    connectionType: 'alumni'
  },
  clubType: 'business org',
  leadershipLevel: 'member',
  preferredLocations: []
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

export default function InputForm({ onSubmit, loading }) {
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

  const toggleLocation = (office) => {
    setForm((prev) => {
      const exists = prev.preferredLocations.includes(office);
      return {
        ...prev,
        preferredLocations: exists
          ? prev.preferredLocations.filter((x) => x !== office)
          : [...prev.preferredLocations, office]
      };
    });
  };

  return (
    <section className="panel">
      <h2>Profile Input</h2>
      <form
        className="grid"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
      >
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

        <label>
          <span>Internship Type</span>
          <select
            value={form.internshipType}
            onChange={(e) => setForm({ ...form, internshipType: e.target.value })}
          >
            <option value="IB">IB</option>
            <option value="PE">PE</option>
            <option value="finance">Finance</option>
            <option value="consulting">Consulting</option>
            <option value="corporate">Corporate Finance</option>
            <option value="none">None</option>
          </select>
        </label>

        <label>
          <span>Exposure Level</span>
          <select
            value={form.exposureLevel}
            onChange={(e) => setForm({ ...form, exposureLevel: e.target.value })}
          >
            <option value="high">High deal exposure</option>
            <option value="moderate">Moderate</option>
            <option value="low">Low</option>
            <option value="none">None</option>
          </select>
        </label>

        <h3>Networking Inputs</h3>
        <NumberField
          label="Initial chats"
          value={form.networking.initialChats}
          onChange={(v) => setNetworking('initialChats', v)}
        />
        <NumberField
          label="Follow-ups"
          value={form.networking.followUps}
          onChange={(v) => setNetworking('followUps', v)}
        />
        <NumberField
          label="Strong relationships"
          value={form.networking.strongRelationships}
          onChange={(v) => setNetworking('strongRelationships', v)}
        />
        <NumberField
          label="Referrals"
          value={form.networking.referrals}
          onChange={(v) => setNetworking('referrals', v)}
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

        <label>
          <span>Club Type</span>
          <select
            value={form.clubType}
            onChange={(e) => setForm({ ...form, clubType: e.target.value })}
          >
            <option value="IB club">IB club</option>
            <option value="business org">Business org</option>
            <option value="non-business org">Non-business org</option>
            <option value="none">None</option>
          </select>
        </label>

        <label>
          <span>Leadership Level</span>
          <select
            value={form.leadershipLevel}
            onChange={(e) => setForm({ ...form, leadershipLevel: e.target.value })}
          >
            <option value="president">President</option>
            <option value="VP">VP</option>
            <option value="member">Member</option>
            <option value="none">None</option>
          </select>
        </label>

        <fieldset>
          <legend>Preferred Location(s)</legend>
          <div className="chips">
            {offices.map((office) => (
              <button
                type="button"
                key={office}
                className={form.preferredLocations.includes(office) ? 'chip selected' : 'chip'}
                onClick={() => toggleLocation(office)}
              >
                {office}
              </button>
            ))}
          </div>
        </fieldset>

        <button disabled={loading} className="primary" type="submit">
          {loading ? 'Scoring...' : 'Build My Bank List'}
        </button>
      </form>
    </section>
  );
}
