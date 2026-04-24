# Banker Builder

Banker Builder is a full-stack recruiting planning app for investment banking candidates.

## What it does

- Collects profile inputs (school, GPA, internship/exposure, networking metrics, extracurriculars, preferred offices).
- Converts each dimension into continuous 0–10 scores.
- Uses a nonlinear GPA model with a dynamic soft cutoff by firm competitiveness.
- Applies gating constraints (GPA, networking, and experience) after baseline Reach/Target/Safety classification.
- Returns per-firm recommendations with confidence, strengths, gaps, and concrete action steps.

## Tech stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Data:** Hardcoded dataset of ~25 investment banks (no external APIs)

## Local setup

```bash
npm install
npm run dev
```

This starts:
- Frontend on `http://localhost:5173`
- Backend on `http://localhost:4000`

## API

### `POST /api/score`

Send a JSON profile payload. Example:

```json
{
  "school": "NYU Stern",
  "gpa": 3.72,
  "internshipType": "finance",
  "exposureLevel": "moderate",
  "networking": {
    "initialChats": 12,
    "followUps": 8,
    "strongRelationships": 3,
    "referrals": 2,
    "strongestContactSeniority": "associate",
    "connectionType": "alumni"
  },
  "clubType": "business org",
  "leadershipLevel": "member",
  "preferredLocations": ["New York", "Chicago"]
}
```
