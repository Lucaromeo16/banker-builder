import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const officesPath = path.resolve(__dirname, '../data/ibOffices.json');

export const ibOffices = JSON.parse(fs.readFileSync(officesPath, 'utf8'));

const groupAdjustments = {
  'Restructuring': 0.25,
  'M&A': 0.15,
  'Financial Sponsors': 0.1,
  'Technology': 0.08,
  'Healthcare': 0.05,
  'Activism / Strategic Advisory': 0.05,
  'Financial Institutions': 0,
  'Industrials': -0.02,
  'Energy': -0.04,
  'Consumer & Retail': -0.05,
  'Business Services': -0.08,
  'Healthcare Services': -0.08,
  'Generalist': -0.1
};

function clamp(value, min = 0, max = 10) {
  return Math.max(min, Math.min(max, value));
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function groupCompetitiveness(office, group) {
  return clamp(office.competitivenessScore + (groupAdjustments[group] ?? 0));
}

export const opportunities = ibOffices.flatMap((office) =>
  office.groups.map((group) => {
    const competitiveness = groupCompetitiveness(office, group);

    return {
      id: `${office.id}-${slugify(group)}`,
      officeId: office.id,
      firm: office.firm,
      office: office.officeCity,
      officeCity: office.officeCity,
      state: office.state,
      group,
      tier: office.type,
      type: office.type,
      latitude: office.latitude,
      longitude: office.longitude,
      competitiveness: Number(competitiveness.toFixed(2)),
      competitivenessScore: office.competitivenessScore,
      prestigeStars: office.prestigeStars,
      payStars: office.payStars,
      competitivenessStars: office.competitivenessStars
    };
  })
);

export const firms = opportunities.map((opportunity) => ({
  name: opportunity.firm,
  firm: opportunity.firm,
  office: opportunity.office,
  officeCity: opportunity.officeCity,
  state: opportunity.state,
  group: opportunity.group,
  tier: opportunity.tier,
  type: opportunity.type,
  competitiveness: opportunity.competitiveness
}));

export const opportunityGroups = [...new Set(opportunities.map((opportunity) => opportunity.group))].sort();

export const opportunitySummary = {
  count: opportunities.length,
  officeCount: ibOffices.length,
  tiers: [...new Set(ibOffices.map((office) => office.type))].sort(),
  offices: [...new Set(ibOffices.map((office) => office.officeCity))].sort(),
  groups: opportunityGroups
};
