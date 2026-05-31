import { supabase } from './supabase';

function parseGroups(value) {
  if (Array.isArray(value)) return value.map((group) => String(group).trim()).filter(Boolean);
  if (!value) return [];

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((group) => String(group).trim()).filter(Boolean);
    } catch {
      // Fall through to comma splitting for text fields.
    }

    return trimmed
      .split(',')
      .map((group) => group.trim())
      .filter(Boolean);
  }

  return [];
}

function parseOfficeNotes(notes) {
  if (!notes || typeof notes !== 'string') return { notes: notes || '' };

  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        officeHistory: parsed.officeHistory || '',
        estimatedHeadcount: parsed.estimatedHeadcount || '',
        internshipOpportunities: parsed.internshipOpportunities || '',
        notes: parsed.notes || '',
        logo: parsed.logo || '',
        zip: parsed.zip || '',
        addressConfidence: parsed.addressConfidence || 'needs verification',
        sourceNote: parsed.sourceNote || '',
        competitivenessScore: parsed.competitivenessScore ?? ''
      };
    }
  } catch {
    // Plain text notes are supported too.
  }

  return { notes };
}

function numberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function transformFirmOfficeRows(firms = [], offices = []) {
  const firmsById = new Map(firms.map((firm) => [firm.id, firm]));

  return offices
    .map((office) => {
      const firm = firmsById.get(office.firm_id);
      if (!firm) return null;

      const noteDetails = parseOfficeNotes(office.notes);

      return {
        id: office.id,
        firm: firm.name || '',
        officeCity: office.city || '',
        state: String(office.state || '').toUpperCase(),
        latitude: numberOrDefault(office.latitude, NaN),
        longitude: numberOrDefault(office.longitude, NaN),
        type: firm.firm_type || 'Regional Boutique',
        groups: parseGroups(office.groups),
        officeHistory: noteDetails.officeHistory || firm.description || noteDetails.notes || '',
        estimatedHeadcount: noteDetails.estimatedHeadcount || '',
        prestigeStars: numberOrDefault(firm.prestige_rating, 3),
        payStars: numberOrDefault(firm.pay_rating, 3),
        competitivenessStars: numberOrDefault(firm.competitiveness_rating, 3),
        competitivenessScore: noteDetails.competitivenessScore || '',
        internshipOpportunities: noteDetails.internshipOpportunities || '',
        notes: noteDetails.notes || '',
        logo: noteDetails.logo || '',
        address: office.address || '',
        zip: noteDetails.zip || '',
        addressConfidence: noteDetails.addressConfidence || 'needs verification',
        sourceNote: noteDetails.sourceNote || ''
      };
    })
    .filter(
      (office) =>
        office &&
        office.firm &&
        office.officeCity &&
        Number.isFinite(office.latitude) &&
        Number.isFinite(office.longitude)
    );
}

export async function loadFirmMapOfficesFromSupabase() {
  if (!supabase) {
    return { offices: [], source: 'json', error: new Error('Supabase is not configured.') };
  }

  const [{ data: firms, error: firmsError }, { data: offices, error: officesError }] = await Promise.all([
    supabase
      .from('firms')
      .select('id, name, firm_type, prestige_rating, pay_rating, competitiveness_rating, description'),
    supabase
      .from('offices')
      .select('id, firm_id, city, state, address, latitude, longitude, groups, notes')
  ]);

  if (firmsError || officesError) {
    const error = firmsError || officesError;
    console.warn('[firm-map] Supabase firm map load failed.', {
      code: error?.code || null,
      message: error?.message || null
    });
    return { offices: [], source: 'json', error };
  }

  const transformed = transformFirmOfficeRows(firms || [], offices || []);
  if (!transformed.length) {
    const error = new Error('Supabase firm map dataset returned no usable offices.');
    console.warn('[firm-map] Supabase firm map load returned no usable offices.');
    return { offices: [], source: 'json', error };
  }

  return { offices: transformed, source: 'supabase', error: null };
}
