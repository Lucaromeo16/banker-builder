# Banker Builder

Banker Builder is a full-stack recruiting planning app for investment banking candidates.

## What it does

- Collects profile inputs (school, GPA, IB experience/exposure, networking metrics, activities and leadership, preferred offices).
- Starts on a Home Page with two tools: Interview Odds Calculator and Target List Builder.
- Estimates interview odds for a specific firm, office, and group.
- Converts each dimension into continuous 0–10 scores.
- Uses a nonlinear GPA model with a dynamic soft cutoff by firm competitiveness.
- Applies gating constraints (GPA, networking, and experience) after baseline Reach/Target/Safety classification.
- Returns per-opportunity recommendations with confidence, strengths, gaps, and concrete action steps.

## Tech stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Data:** Hardcoded sample dataset of 300+ investment banking opportunities (no external APIs)

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

Build a Reach / Target / Safety target list. Send a JSON profile payload. Example:

```json
{
  "school": "NYU Stern",
  "gpa": 3.72,
  "workExperiences": [
    { "workType": "Private equity internship" },
    { "workType": "Search fund internship" }
  ],
  "activities": [
    {
      "activityType": "Selective IB club",
      "selectivity": "highly selective",
      "leadershipLevel": "vp"
    },
    {
      "activityType": "Finance/business club",
      "selectivity": "open enrollment",
      "leadershipLevel": "member"
    }
  ]
}
```

### `POST /api/interview-odds`

Calculate estimated interview odds for one opportunity:

```json
{
  "firmName": "Goldman Sachs",
  "office": "New York",
  "group": "M&A",
  "hireType": "Summer Analyst",
  "profile": {
    "school": "NYU Stern",
    "gpa": 3.72,
    "workType": "Investment banking internship",
    "networking": {
      "initialChats": 12,
      "followUps": 8,
      "strongRelationships": 3,
      "referrals": 2,
      "strongestContactSeniority": "associate",
      "connectionType": "alumni"
    },
    "activities": [
      {
        "activityType": "Selective IB club",
        "selectivity": "highly selective",
        "leadershipLevel": "vp"
      }
    ]
  }
}
```

### `GET /api/opportunities`

Returns available firm / office / group opportunities, group options, and dataset summary metadata for the Interview Odds Calculator.
