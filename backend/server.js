import express from 'express';
import cors from 'cors';
import { scoreProfile } from './scoringEngine.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_, res) => {
  res.json({ ok: true, service: 'banker-builder-backend' });
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

app.listen(port, () => {
  console.log(`Banker Builder backend listening on http://localhost:${port}`);
});
