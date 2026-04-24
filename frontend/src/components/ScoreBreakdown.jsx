export default function ScoreBreakdown({ scores }) {
  const rows = [
    { label: 'Academic', value: scores.academic },
    { label: 'Experience', value: scores.experience },
    { label: 'Networking', value: scores.networking },
    { label: 'Extracurricular', value: scores.extracurricular },
    { label: 'Total', value: scores.total }
  ];

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
