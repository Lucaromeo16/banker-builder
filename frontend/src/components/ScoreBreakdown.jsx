export default function ScoreBreakdown({ scores }) {
  const rows = [
    { label: 'Academic', value: scores.academic },
    { label: 'Experience', value: scores.experience },
    typeof scores.networking === 'number' ? { label: 'Networking', value: scores.networking } : null,
    { label: 'Activities & Leadership', value: scores.extracurricular },
    { label: 'Total', value: scores.total }
  ].filter(Boolean);

  return (
    <div className="score-breakdown">
      <h4>Score Breakdown</h4>
      <ul>
        {rows.map((row) => (
          <li key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value.toFixed(2)} / 10</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
