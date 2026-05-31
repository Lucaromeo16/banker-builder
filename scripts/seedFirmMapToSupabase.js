const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: false });
dotenv.config({ path: path.resolve(process.cwd(), 'frontend/.env'), override: false });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing Supabase URL. Set SUPABASE_URL or VITE_SUPABASE_URL.');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. This seed script refuses to use anon or publishable keys.');
  process.exit(1);
}

function maskKey(key) {
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function validateServiceRoleKey(key) {
  console.log(`Using Supabase service key: ${maskKey(key)}`);

  if (key.startsWith('sb_secret_')) {
    console.log('Detected sb_secret service key format.');
    return;
  }

  const payload = decodeJwtPayload(key);
  if (!payload) {
    console.warn('Could not decode key as JWT. Continuing only if this is a valid Supabase secret key.');
    return;
  }

  console.log(`Decoded Supabase key role: ${payload.role || 'unknown'}`);
  if (payload.role !== 'service_role') {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not a service_role JWT. Refusing to seed with a non-service key.');
    process.exit(1);
  }
}

validateServiceRoleKey(serviceRoleKey);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const officesPath = path.resolve(process.cwd(), 'data/ibOffices.json');
const offices = JSON.parse(fs.readFileSync(officesPath, 'utf8'));

function rating(value, fallback = 3) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function firmAggregateFor(name, firmOffices) {
  const first = firmOffices[0] || {};
  return {
    name,
    firm_type: first.type || 'Regional Boutique',
    prestige_rating: Math.max(...firmOffices.map((office) => rating(office.prestigeStars))),
    pay_rating: Math.max(...firmOffices.map((office) => rating(office.payStars))),
    competitiveness_rating: Math.max(...firmOffices.map((office) => rating(office.competitivenessStars))),
    description: first.officeHistory || first.notes || ''
  };
}

function officeNotesPayload(office) {
  return JSON.stringify({
    officeHistory: office.officeHistory || '',
    estimatedHeadcount: office.estimatedHeadcount || '',
    internshipOpportunities: office.internshipOpportunities || '',
    notes: office.notes || '',
    logo: office.logo || '',
    zip: office.zip || '',
    addressConfidence: office.addressConfidence || 'needs verification',
    sourceNote: office.sourceNote || '',
    competitivenessScore: office.competitivenessScore ?? ''
  });
}

function officePayload(office, firmId) {
  return {
    firm_id: firmId,
    city: office.officeCity || office.city || '',
    state: office.state || '',
    address: [office.address, office.zip].filter(Boolean).join(' '),
    latitude: Number.isFinite(Number(office.latitude)) ? Number(office.latitude) : null,
    longitude: Number.isFinite(Number(office.longitude)) ? Number(office.longitude) : null,
    groups: Array.isArray(office.groups) ? office.groups : [],
    notes: officeNotesPayload(office)
  };
}

function officeKey(office) {
  return [
    office.firm_id,
    String(office.city || '').trim().toLowerCase(),
    String(office.state || '').trim().toLowerCase(),
    String(office.address || '').trim().toLowerCase()
  ].join('|');
}

async function upsertFirm(payload) {
  const { data: existing, error: selectError } = await supabase
    .from('firms')
    .select('id')
    .eq('name', payload.name)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing?.id) {
    const { data, error } = await supabase
      .from('firms')
      .update(payload)
      .eq('id', existing.id)
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }

  const { data, error } = await supabase
    .from('firms')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function seed() {
  const { error: preflightError } = await supabase.from('firms').select('id').limit(1);

  if (preflightError) {
    if (preflightError.code === '42501') {
      console.error('Service role key is not being used or lacks privileges.');
    }
    throw preflightError;
  }

  const officesByFirm = offices.reduce((map, office) => {
    const firm = office.firm || 'Unknown Firm';
    if (!map.has(firm)) map.set(firm, []);
    map.get(firm).push(office);
    return map;
  }, new Map());

  let firmCount = 0;
  let insertedOffices = 0;
  let updatedOffices = 0;

  for (const [firmName, firmOffices] of officesByFirm.entries()) {
    const firmId = await upsertFirm(firmAggregateFor(firmName, firmOffices));
    firmCount += 1;

    const { data: existingOffices, error: existingError } = await supabase
      .from('offices')
      .select('id, firm_id, city, state, address')
      .eq('firm_id', firmId);

    if (existingError) throw existingError;

    const existingByKey = new Map((existingOffices || []).map((office) => [officeKey(office), office]));

    for (const office of firmOffices) {
      const payload = officePayload(office, firmId);
      const match = existingByKey.get(officeKey(payload));

      if (match?.id) {
        const { error } = await supabase.from('offices').update(payload).eq('id', match.id);
        if (error) throw error;
        updatedOffices += 1;
      } else {
        const { error } = await supabase.from('offices').insert(payload);
        if (error) throw error;
        insertedOffices += 1;
      }
    }
  }

  console.log(`Seed complete: ${firmCount} firms, ${insertedOffices} offices inserted, ${updatedOffices} offices updated.`);
}

seed().catch((error) => {
  console.error('Firm Map seed failed:', {
    code: error.code || null,
    message: error.message || error
  });
  process.exit(1);
});
