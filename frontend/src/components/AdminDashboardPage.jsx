import { useMemo, useRef, useState } from 'react';
import ibOffices from '../../../data/ibOffices.json';
import {
  ADDRESS_CONFIDENCE_VALUES,
  FIRM_TYPES,
  buildOfficeId,
  validateFirmMapDataset
} from '../utils/firmMapValidation';

const ADMIN_SESSION_KEY = 'bankerBuilderAdminAuthenticated';
const DEFAULT_ADMIN_PASSWORD = 'bankerbuilder-admin';

function getAdminPassword() {
  return import.meta.env.VITE_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
}

function normalizeOffice(office = {}) {
  return {
    id: office.id || buildOfficeId(office),
    firm: office.firm || '',
    officeCity: office.officeCity || office.city || '',
    state: String(office.state || '').toUpperCase(),
    latitude: office.latitude ?? '',
    longitude: office.longitude ?? '',
    type: office.type || FIRM_TYPES[0],
    groups: Array.isArray(office.groups) ? office.groups : [],
    officeHistory: office.officeHistory || '',
    estimatedHeadcount: office.estimatedHeadcount || '',
    prestigeStars: office.prestigeStars ?? 3,
    payStars: office.payStars ?? 3,
    competitivenessStars: office.competitivenessStars ?? 3,
    competitivenessScore: office.competitivenessScore ?? '',
    internshipOpportunities: office.internshipOpportunities || '',
    notes: office.notes || '',
    logo: office.logo || '',
    address: office.address || '',
    zip: office.zip || '',
    addressConfidence: office.addressConfidence || 'needs verification',
    sourceNote: office.sourceNote || ''
  };
}

function createBlankOffice(firm = {}) {
  return normalizeOffice({
    id: '',
    firm: firm.firm || '',
    type: firm.type || FIRM_TYPES[0],
    prestigeStars: firm.prestigeStars || 3,
    payStars: firm.payStars || 3,
    competitivenessStars: firm.competitivenessStars || 3,
    notes: firm.notes || '',
    sourceNote: firm.sourceNote || '',
    addressConfidence: 'needs verification'
  });
}

function createBlankFirm() {
  return {
    firm: 'New Firm',
    type: FIRM_TYPES[0],
    prestigeStars: 3,
    payStars: 3,
    competitivenessStars: 3,
    competitivenessScore: '',
    notes: '',
    sourceNote: '',
    internshipOpportunities: '',
    estimatedHeadcount: '',
    logo: ''
  };
}

function groupFirms(offices) {
  const firms = new Map();
  offices.forEach((office) => {
    const normalized = normalizeOffice(office);
    if (!firms.has(normalized.firm)) {
      firms.set(normalized.firm, { ...normalized, offices: [] });
    }
    firms.get(normalized.firm).offices.push(normalized);
  });

  return [...firms.values()].sort((a, b) => a.firm.localeCompare(b.firm));
}

function cleanOfficeForExport(office) {
  const latitude = String(office.latitude ?? '').trim() === '' ? '' : Number(office.latitude);
  const longitude = String(office.longitude ?? '').trim() === '' ? '' : Number(office.longitude);
  const competitivenessScore =
    String(office.competitivenessScore ?? '').trim() === '' ? '' : Number(office.competitivenessScore);
  const cleaned = {
    ...office,
    id: office.id || buildOfficeId(office),
    firm: String(office.firm || '').trim(),
    officeCity: String(office.officeCity || '').trim(),
    state: String(office.state || '').trim().toUpperCase(),
    latitude,
    longitude,
    type: office.type,
    groups: Array.isArray(office.groups)
      ? office.groups.map((group) => String(group).trim()).filter(Boolean)
      : String(office.groups || '')
          .split(',')
          .map((group) => group.trim())
          .filter(Boolean),
    prestigeStars: Number(office.prestigeStars),
    payStars: Number(office.payStars),
    competitivenessStars: Number(office.competitivenessStars)
  };

  if (cleaned.competitivenessScore !== '') cleaned.competitivenessScore = competitivenessScore;

  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === '' || cleaned[key] === undefined || cleaned[key] === null) delete cleaned[key];
  });

  return cleaned;
}

function fieldValue(event) {
  return event.target.value;
}

function RatingSelect({ label, value, onChange }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <option key={rating} value={rating}>
            {rating}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function AdminDashboardPage() {
  const [authenticated, setAuthenticated] = useState(() => window.localStorage.getItem(ADMIN_SESSION_KEY) === 'true');
  const [password, setPassword] = useState('');
  const [accessError, setAccessError] = useState('');
  const [offices, setOffices] = useState(() => ibOffices.map(normalizeOffice));
  const [selectedFirmName, setSelectedFirmName] = useState(() => ibOffices[0]?.firm || '');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [validation, setValidation] = useState(() => validateFirmMapDataset(ibOffices));
  const fileInputRef = useRef(null);

  const firms = useMemo(() => groupFirms(offices), [offices]);
  const selectedFirm = firms.find((firm) => firm.firm === selectedFirmName) || firms[0] || null;
  const selectedOffices = selectedFirm?.offices || [];
  const filteredFirms = firms.filter((firm) => {
    const matchesSearch = firm.firm.toLowerCase().includes(search.trim().toLowerCase());
    const matchesType = typeFilter === 'All' || firm.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const submitPassword = (event) => {
    event.preventDefault();
    if (password === getAdminPassword()) {
      window.localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setAuthenticated(true);
      setAccessError('');
      return;
    }
    setAccessError('Access denied. Check the admin password and try again.');
  };

  const updateFirm = (field, value) => {
    if (!selectedFirm) return;
    const previousFirmName = selectedFirm.firm;
    const nextFirmName = field === 'firm' ? value : previousFirmName;
    setOffices((current) =>
      current.map((office) =>
        office.firm === previousFirmName
          ? {
              ...office,
              [field]: value,
              firm: nextFirmName
            }
          : office
      )
    );
    if (field === 'firm') setSelectedFirmName(value);
  };

  const updateOffice = (officeId, field, value) => {
    setOffices((current) =>
      current.map((office) => (office.id === officeId ? { ...office, [field]: value } : office))
    );
  };

  const addFirm = () => {
    const firmNumber = firms.filter((firm) => firm.firm.startsWith('New Firm')).length + 1;
    const firm = { ...createBlankFirm(), firm: firmNumber === 1 ? 'New Firm' : `New Firm ${firmNumber}` };
    const office = {
      ...createBlankOffice(firm),
      officeCity: 'New York',
      state: 'NY',
      latitude: 40.7128,
      longitude: -74.006,
      id: `new-firm-${Date.now()}`
    };
    setOffices((current) => [office, ...current]);
    setSelectedFirmName(firm.firm);
  };

  const deleteFirm = () => {
    if (!selectedFirm) return;
    if (!window.confirm(`Delete ${selectedFirm.firm} and all ${selectedOffices.length} offices?`)) return;
    setOffices((current) => current.filter((office) => office.firm !== selectedFirm.firm));
    setSelectedFirmName('');
  };

  const addOffice = () => {
    if (!selectedFirm) return;
    const nextOffice = {
      ...createBlankOffice(selectedFirm),
      id: `${buildOfficeId({ firm: selectedFirm.firm, officeCity: 'new-office', state: 'na' })}-${Date.now()}`
    };
    setOffices((current) => [...current, nextOffice]);
  };

  const duplicateOffice = (office) => {
    const duplicate = {
      ...office,
      id: `${office.id || buildOfficeId(office)}-copy-${Date.now()}`,
      officeCity: `${office.officeCity} Copy`
    };
    setOffices((current) => [...current, duplicate]);
  };

  const removeOffice = (office) => {
    if (!window.confirm(`Remove ${office.firm} - ${office.officeCity}, ${office.state}?`)) return;
    setOffices((current) => current.filter((item) => item.id !== office.id));
  };

  const clearSelectedFirmForm = () => {
    if (!selectedFirm) return;
    updateFirm('notes', '');
    updateFirm('sourceNote', '');
    updateFirm('internshipOpportunities', '');
  };

  const validateDataset = () => {
    const result = validateFirmMapDataset(offices.map(cleanOfficeForExport));
    setValidation(result);
    return result;
  };

  const exportJson = () => {
    const cleaned = offices.map(cleanOfficeForExport).sort((a, b) => a.firm.localeCompare(b.firm) || a.officeCity.localeCompare(b.officeCity));
    const result = validateFirmMapDataset(cleaned);
    setValidation(result);
    if (!result.isValid && !window.confirm('Validation has errors. Export anyway?')) return;

    const blob = new Blob([`${JSON.stringify(cleaned, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ibOffices.updated.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error('Expected an array');
      const normalized = parsed.map(normalizeOffice);
      setOffices(normalized);
      setSelectedFirmName(normalized[0]?.firm || '');
      setValidation(validateFirmMapDataset(normalized));
    } catch {
      setValidation({
        isValid: false,
        errors: ['Import failed. Choose a valid Firm Map JSON array.'],
        warnings: [],
        counts: { offices: 0, firms: 0 }
      });
    } finally {
      event.target.value = '';
    }
  };

  if (!authenticated) {
    return (
      <main className="container admin-container">
        <section className="panel admin-login-panel">
          <p className="feature-eyebrow">Hidden Admin</p>
          <h1>Firm Map Admin</h1>
          <form onSubmit={submitPassword} className="admin-login-form">
            <label>
              Admin password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoFocus
              />
            </label>
            {accessError ? <p className="admin-error">{accessError}</p> : null}
            <button type="submit" className="primary">
              Unlock Admin
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="container admin-container">
      <section className="admin-header">
        <div>
          <p className="feature-eyebrow">Hidden Admin</p>
          <h1>Firm Map Data Dashboard</h1>
          <p>Edit the browser copy, validate it, then export a replacement JSON file.</p>
        </div>
        <div className="admin-actions">
          <input ref={fileInputRef} className="admin-file-input" type="file" accept="application/json,.json" onChange={importJson} />
          <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()}>
            Import JSON
          </button>
          <button type="button" className="secondary" onClick={validateDataset}>
            Validate Dataset
          </button>
          <button type="button" className="primary admin-export-button" onClick={exportJson}>
            Export JSON
          </button>
        </div>
      </section>

      <section className="admin-validation-panel">
        <strong>{validation.isValid ? 'Dataset valid' : 'Validation needs attention'}</strong>
        <span>{validation.counts.firms} firms</span>
        <span>{validation.counts.offices} offices</span>
        <span>{validation.errors.length} errors</span>
        <span>{validation.warnings.length} warnings</span>
      </section>

      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <section className="panel admin-message-panel">
          {validation.errors.slice(0, 12).map((error) => (
            <p key={error} className="admin-error">
              {error}
            </p>
          ))}
          {validation.warnings.slice(0, 8).map((warning) => (
            <p key={warning} className="admin-warning">
              {warning}
            </p>
          ))}
        </section>
      )}

      <section className="admin-layout">
        <aside className="panel admin-sidebar">
          <div className="admin-sidebar-tools">
            <label>
              Search firms
              <input type="search" value={search} onChange={(event) => setSearch(fieldValue(event))} placeholder="Goldman Sachs..." />
            </label>
            <label>
              Firm type
              <select value={typeFilter} onChange={(event) => setTypeFilter(fieldValue(event))}>
                <option value="All">All</option>
                {FIRM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="primary" onClick={addFirm}>
              Add Firm
            </button>
          </div>
          <div className="admin-firm-list">
            {filteredFirms.map((firm) => (
              <button
                type="button"
                key={firm.firm}
                className={firm.firm === selectedFirm?.firm ? 'admin-firm-row active' : 'admin-firm-row'}
                onClick={() => setSelectedFirmName(firm.firm)}
              >
                <strong>{firm.firm}</strong>
                <span>{firm.type} - {firm.offices.length} offices</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="admin-editor">
          {selectedFirm ? (
            <>
              <section className="panel admin-firm-editor">
                <div className="admin-section-heading">
                  <div>
                    <h2>{selectedFirm.firm}</h2>
                    <p>{selectedOffices.length} offices in current dataset</p>
                  </div>
                  <div className="admin-actions compact">
                    <button type="button" className="secondary" onClick={clearSelectedFirmForm}>
                      Clear Form
                    </button>
                    <button type="button" className="secondary danger" onClick={deleteFirm}>
                      Delete Firm
                    </button>
                  </div>
                </div>

                <div className="admin-form-grid">
                  <label>
                    Firm name
                    <input value={selectedFirm.firm} onChange={(event) => updateFirm('firm', fieldValue(event))} />
                  </label>
                  <label>
                    Firm type/category
                    <select value={selectedFirm.type} onChange={(event) => updateFirm('type', fieldValue(event))}>
                      {FIRM_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <RatingSelect label="Prestige rating" value={selectedFirm.prestigeStars} onChange={(value) => updateFirm('prestigeStars', value)} />
                  <RatingSelect label="Pay rating" value={selectedFirm.payStars} onChange={(value) => updateFirm('payStars', value)} />
                  <RatingSelect
                    label="Competitiveness rating"
                    value={selectedFirm.competitivenessStars}
                    onChange={(value) => updateFirm('competitivenessStars', value)}
                  />
                  <label>
                    Competitiveness score
                    <input
                      type="number"
                      step="0.1"
                      value={selectedFirm.competitivenessScore}
                      onChange={(event) => updateFirm('competitivenessScore', fieldValue(event))}
                    />
                  </label>
                  <label>
                    Estimated headcount
                    <input value={selectedFirm.estimatedHeadcount} onChange={(event) => updateFirm('estimatedHeadcount', fieldValue(event))} />
                  </label>
                  <label>
                    Logo path
                    <input value={selectedFirm.logo} onChange={(event) => updateFirm('logo', fieldValue(event))} />
                  </label>
                  <label className="admin-wide-field">
                    Description/history
                    <textarea
                      value={selectedFirm.internshipOpportunities}
                      onChange={(event) => updateFirm('internshipOpportunities', fieldValue(event))}
                    />
                  </label>
                  <label className="admin-wide-field">
                    Notes
                    <textarea value={selectedFirm.notes} onChange={(event) => updateFirm('notes', fieldValue(event))} />
                  </label>
                  <label className="admin-wide-field">
                    Firm source notes
                    <textarea value={selectedFirm.sourceNote} onChange={(event) => updateFirm('sourceNote', fieldValue(event))} />
                  </label>
                </div>
              </section>

              <section className="panel admin-offices-panel">
                <div className="admin-section-heading">
                  <div>
                    <h2>Offices</h2>
                    <p>Add, duplicate, edit, or remove office records for this firm.</p>
                  </div>
                  <button type="button" className="primary admin-add-office-button" onClick={addOffice}>
                    Add Office
                  </button>
                </div>

                <div className="admin-office-list">
                  {selectedOffices.map((office) => (
                    <article className="admin-office-card" key={office.id}>
                      <div className="admin-office-card-heading">
                        <strong>{office.officeCity || 'New Office'}, {office.state || '--'}</strong>
                        <div>
                          <button type="button" className="text-button" onClick={() => duplicateOffice(office)}>
                            Duplicate
                          </button>
                          <button type="button" className="text-button danger" onClick={() => removeOffice(office)}>
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="admin-form-grid office-grid">
                        <label>
                          ID
                          <input value={office.id} onChange={(event) => updateOffice(office.id, 'id', fieldValue(event))} />
                        </label>
                        <label>
                          City
                          <input value={office.officeCity} onChange={(event) => updateOffice(office.id, 'officeCity', fieldValue(event))} />
                        </label>
                        <label>
                          State
                          <input maxLength="2" value={office.state} onChange={(event) => updateOffice(office.id, 'state', fieldValue(event).toUpperCase())} />
                        </label>
                        <label>
                          ZIP
                          <input value={office.zip} onChange={(event) => updateOffice(office.id, 'zip', fieldValue(event))} />
                        </label>
                        <label className="admin-wide-field">
                          Address
                          <input value={office.address} onChange={(event) => updateOffice(office.id, 'address', fieldValue(event))} />
                        </label>
                        <label>
                          Latitude
                          <input type="number" step="0.0001" value={office.latitude} onChange={(event) => updateOffice(office.id, 'latitude', fieldValue(event))} />
                        </label>
                        <label>
                          Longitude
                          <input type="number" step="0.0001" value={office.longitude} onChange={(event) => updateOffice(office.id, 'longitude', fieldValue(event))} />
                        </label>
                        <label>
                          Address confidence
                          <select value={office.addressConfidence} onChange={(event) => updateOffice(office.id, 'addressConfidence', fieldValue(event))}>
                            {ADDRESS_CONFIDENCE_VALUES.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="admin-wide-field">
                          Groups present
                          <input
                            value={office.groups.join(', ')}
                            onChange={(event) =>
                              updateOffice(
                                office.id,
                                'groups',
                                fieldValue(event)
                                  .split(',')
                                  .map((group) => group.trim())
                                  .filter(Boolean)
                              )
                            }
                            placeholder="M&A, Technology, Healthcare"
                          />
                        </label>
                        <label className="admin-wide-field">
                          Office notes/history
                          <textarea value={office.officeHistory} onChange={(event) => updateOffice(office.id, 'officeHistory', fieldValue(event))} />
                        </label>
                        <label className="admin-wide-field">
                          Source note
                          <textarea value={office.sourceNote} onChange={(event) => updateOffice(office.id, 'sourceNote', fieldValue(event))} />
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section className="panel">
              <h2>No firm selected</h2>
              <button type="button" className="primary" onClick={addFirm}>
                Add Firm
              </button>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
