import express from 'express';
import cors from 'cors';
import { ibOffices, opportunities, opportunitySummary } from './firms.js';
import { groupOptions, scoreInterviewOdds, scoreProfile } from './scoringEngine.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_, res) => {
  res.json({ ok: true, service: 'banker-builder-backend' });
});

app.get('/api/opportunities', (_, res) => {
  res.json({ opportunities, firms: opportunities, offices: ibOffices, groups: groupOptions, summary: opportunitySummary });
});

app.post('/api/score', (req, res) => {
  try {
    const payload = req.body;
    if (typeof payload.gpa !== 'number') {
      return res.status(400).json({ error: 'Invalid payload: GPA must be numeric.' });
    }

    const scored = scoreProfile(payload);
    return res.json(scored);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to score profile.', details: error.message });
  }
});

app.post('/api/interview-odds', (req, res) => {
  try {
    const payload = req.body;
    if (!payload.hireType) {
      return res.status(400).json({ error: 'Invalid payload: hireType is required.' });
    }

    if (typeof payload.profile?.gpa !== 'number') {
      return res.status(400).json({ error: 'Invalid payload: profile GPA must be numeric.' });
    }

    const scored = scoreInterviewOdds(payload);
    return res.json(scored);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to score interview odds.', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Banker Builder backend listening on http://localhost:${port}`);
});
