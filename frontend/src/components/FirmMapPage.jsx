import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import ibOffices from '../../../data/ibOffices.json';

const BANK_TYPE_OPTIONS = [
  'All',
  'BB',
  'EB',
  'MM',
  'Specialized Boutique',
  'National LMM Boutique',
  'Regional Boutique',
  'Big 4 Corporate Finance'
];

const GROUP_OPTIONS = [
  'All',
  'M&A',
  'Restructuring',
  'DCM',
  'ECM',
  'Leveraged Finance',
  'Public Finance',
  'Financial Sponsors',
  'Healthcare',
  'Technology',
  'Industrials',
  'Consumer/Retail',
  'FIG',
  'Real Estate',
  'Energy',
  'Generalist'
];

const STAR_OPTIONS = [
  { label: 'All', value: 0 },
  { label: '3+ stars', value: 3 },
  { label: '4+ stars', value: 4 },
  { label: '5 stars', value: 5 }
];

const TYPE_LABELS = [
  'BB',
  'EB',
  'MM',
  'Specialized Boutique',
  'National LMM Boutique',
  'Regional Boutique',
  'Big 4 Corporate Finance'
];

const TYPE_CLASS_NAMES = {
  BB: 'bb',
  EB: 'eb',
  MM: 'mm',
  'Specialized Boutique': 'specialized',
  'National LMM Boutique': 'national-lmm',
  'Regional Boutique': 'regional',
  'Big 4 Corporate Finance': 'big-4',
  Unknown: 'unknown'
};

const GROUP_MATCHERS = {
  'M&A': ['m&a', 'mergers'],
  Restructuring: ['restructuring', 'liability management', 'special situations'],
  DCM: ['debt capital markets', 'dcm'],
  ECM: ['equity capital markets', 'ecm'],
  'Leveraged Finance': ['leveraged finance'],
  'Public Finance': ['public finance'],
  'Financial Sponsors': ['financial sponsors', 'private equity'],
  Healthcare: ['healthcare', 'health care', 'biopharma', 'medtech', 'provider services'],
  Technology: ['technology', 'software', 'internet', 'ai / ml', 'fintech', 'growth', 'saas', 'cybersecurity'],
  Industrials: ['industrials', 'industrial', 'manufacturing', 'automotive', 'transportation'],
  'Consumer/Retail': ['consumer', 'retail', 'restaurants'],
  FIG: ['financial institutions', 'financial services', 'fig', 'insurance'],
  'Real Estate': ['real estate'],
  Energy: ['energy', 'power', 'utilities', 'infrastructure', 'cleantech'],
  Generalist: ['generalist', 'm&a', 'capital markets', 'strategic advisory']
};

function renderStars(count) {
  return `${count}/5`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initialsForFirm(firm) {
  const normalized = firm.replace(/J\.P\./g, 'JP').replace(/D\.A\./g, 'DA');
  const words = normalized.match(/[A-Za-z0-9]+/g) || [];
  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function bankTypeForOffice(office) {
  const type = String(office.type || '').toLowerCase();
  const firm = String(office.firm || '').toLowerCase();

  if (type.includes('big 4')) return 'Big 4 Corporate Finance';
  if (type.includes('specialized boutique')) return 'Specialized Boutique';
  if (type.includes('national lmm')) return 'National LMM Boutique';
  if (type.includes('regional') || type.includes('lmm')) return 'Regional Boutique';
  if (
    type === 'eb' ||
    type.startsWith('eb ') ||
    type.includes('/ eb') ||
    type.includes('eb-style') ||
    type.includes('elite')
  ) {
    return 'EB';
  }
  if (type === 'bb' || type.startsWith('bb ')) return 'BB';
  if (type.includes('mm')) return 'MM';
  if (type.includes('boutique')) {
    return firm.includes('aeris') ||
      firm.includes('ft partners') ||
      firm.includes('raine') ||
      firm.includes('union square') ||
      firm.includes('liontree') ||
      firm.includes('solomon') ||
      firm.includes('tidal') ||
      firm.includes('ducera') ||
      firm.includes('qatalyst') ||
      firm.includes('cain brothers') ||
      firm.includes('leerink') ||
      firm.includes('allen') ||
      firm.includes('m. klein') ||
      firm.includes('gordon dyal') ||
      firm.includes('marshberry')
      ? 'Specialized Boutique'
      : 'Regional Boutique';
  }

  return 'Regional Boutique';
}

function groupMatches(office, groupFilter) {
  if (groupFilter === 'All') return true;

  const haystack = [
    ...(office.groups || []),
    office.officeHistory || '',
    office.notes || '',
    office.type || ''
  ]
    .join(' ')
    .toLowerCase();

  return (GROUP_MATCHERS[groupFilter] || [groupFilter.toLowerCase()]).some((term) => haystack.includes(term));
}

function officeMatchesFilters(office, filters) {
  const bankType = bankTypeForOffice(office);

  return (
    (filters.bankType === 'All' || bankType === filters.bankType) &&
    groupMatches(office, filters.group) &&
    office.prestigeStars >= filters.minPrestige &&
    office.payStars >= filters.minPay &&
    office.competitivenessStars >= filters.minCompetitiveness
  );
}

function officeMatchesBankSearch(office, searchTerm) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) return true;

  return String(office.firm || '').toLowerCase().includes(normalizedSearch);
}

function firmSummariesForOffices(offices) {
  const firms = new Map();

  offices.forEach((office) => {
    const existing = firms.get(office.firm) || {
      firm: office.firm,
      type: bankTypeForOffice(office),
      offices: [],
      groups: new Set(),
      maxPrestige: 0,
      maxPay: 0,
      maxCompetitiveness: 0
    };

    existing.offices.push(office);
    office.groups.forEach((group) => existing.groups.add(group));
    existing.maxPrestige = Math.max(existing.maxPrestige, office.prestigeStars);
    existing.maxPay = Math.max(existing.maxPay, office.payStars);
    existing.maxCompetitiveness = Math.max(existing.maxCompetitiveness, office.competitivenessStars);

    firms.set(office.firm, existing);
  });

  return Array.from(firms.values())
    .map((firm) => ({
      ...firm,
      groups: Array.from(firm.groups).sort(),
      summary: firm.offices[0]?.officeHistory || ''
    }))
    .sort((a, b) => a.firm.localeCompare(b.firm));
}

function formattedAddress(office) {
  return [office.address, office.zip].filter(Boolean).join(' ');
}

function addressNeedsVerification(office) {
  return office.addressConfidence !== 'verified';
}

function popupHtml(office) {
  const address = formattedAddress(office);
  const addressHtml = address
    ? `
        <div>
          <dt>Address</dt>
          <dd>${escapeHtml(address)}</dd>
        </div>
      `
    : '';
  const verificationHtml = addressNeedsVerification(office)
    ? '<p class="address-verification-note">Address needs verification.</p>'
    : '';

  return `
    <div class="office-popup">
      <h3>${escapeHtml(office.firm)} · ${escapeHtml(office.officeCity)}, ${escapeHtml(office.state)}</h3>
      <p class="office-popup-type">${escapeHtml(office.type)}</p>
      <p>${escapeHtml(office.officeHistory)}</p>
      <dl>
        ${addressHtml}
        <div>
          <dt>Groups</dt>
          <dd>${escapeHtml(office.groups.join(', '))}</dd>
        </div>
        <div>
          <dt>Estimated headcount</dt>
          <dd>${escapeHtml(office.estimatedHeadcount)}</dd>
        </div>
        <div>
          <dt>Prestige</dt>
          <dd>${renderStars(office.prestigeStars)} stars</dd>
        </div>
        <div>
          <dt>Pay</dt>
          <dd>${renderStars(office.payStars)} stars</dd>
        </div>
        <div>
          <dt>Competitiveness</dt>
          <dd>${renderStars(office.competitivenessStars)} stars</dd>
        </div>
      </dl>
      ${verificationHtml}
      <button type="button" class="office-popup-add-contact">Add Contact</button>
    </div>
  `;
}

function officeIcon(office) {
  const initials = escapeHtml(initialsForFirm(office.firm));
  const logo = escapeHtml(office.logo || '');
  const typeClass = TYPE_CLASS_NAMES[bankTypeForOffice(office)] || TYPE_CLASS_NAMES.Unknown;
  const logoHtml = logo
    ? `<img src="${logo}" alt="" onerror="this.style.display='none';this.parentElement.classList.add('logo-fallback-visible');" />`
    : '';

  return L.divIcon({
    className: `office-marker office-marker-${typeClass}`,
    html: `${logoHtml}<span>${initials}</span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -18]
  });
}

function clusterIcon(cluster) {
  const count = cluster.getChildCount();
  const sizeClass = count >= 10 ? 'large' : count >= 5 ? 'medium' : 'small';

  return L.divIcon({
    className: `office-cluster office-cluster-${sizeClass}`,
    html: `<span>${count}</span>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  });
}

function ClusteredOfficeMarkers({ offices, onAddContact }) {
  const map = useMap();

  useEffect(() => {
    const clusterLayer = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 14,
      maxClusterRadius: 46,
      iconCreateFunction: clusterIcon
    });

    offices.forEach((office) => {
      const marker = L.marker([office.latitude, office.longitude], { icon: officeIcon(office) });
      marker.bindPopup(popupHtml(office), {
        className: 'banker-popup',
        maxWidth: 320
      });
      marker.on('popupopen', () => {
        const popupElement = marker.getPopup()?.getElement();
        const button = popupElement?.querySelector('.office-popup-add-contact');
        button?.addEventListener('click', () => onAddContact?.(office), { once: true });
      });
      clusterLayer.addLayer(marker);
    });

    map.addLayer(clusterLayer);

    return () => {
      map.removeLayer(clusterLayer);
    };
  }, [map, offices, onAddContact]);

  return null;
}

export default function FirmMapPage({ onBack, onAddContact }) {
  const [viewMode, setViewMode] = useState('map');
  const [expandedFirm, setExpandedFirm] = useState(null);
  const [bankSearch, setBankSearch] = useState('');
  const [filters, setFilters] = useState({
    bankType: 'All',
    group: 'All',
    minPrestige: 0,
    minPay: 0,
    minCompetitiveness: 0
  });

  const filteredOffices = useMemo(
    () => ibOffices.filter((office) => officeMatchesBankSearch(office, bankSearch) && officeMatchesFilters(office, filters)),
    [bankSearch, filters]
  );

  const firmSummaries = useMemo(() => firmSummariesForOffices(filteredOffices), [filteredOffices]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setExpandedFirm(null);
  };

  const updateBankSearch = (value) => {
    setBankSearch(value);
    setExpandedFirm(null);
  };

  const toggleFirm = (firm) => {
    setExpandedFirm((current) => (current === firm ? null : firm));
  };

  const hasBankSearch = bankSearch.trim().length > 0;
  const emptyMapMessage = hasBankSearch ? 'No banks match your search and filters.' : 'No offices match the selected filters.';
  const emptyListMessage = hasBankSearch ? 'No banks match your search and filters.' : 'No firms match the selected filters.';

  return (
    <>
      <button type="button" className="back-button" onClick={onBack}>
        Back to Home
      </button>

      <section className="panel map-page">
        <div className="map-header">
          <div>
            <h2>Investment Bank Firm Map</h2>
            <p className="muted">Explore sample investment banking offices by geography.</p>
          </div>
          <span className="map-result-count">{filteredOffices.length} offices</span>
        </div>

        <div className="map-controls" aria-label="Firm map filters">
          <label className="map-search-control">
            Bank Search
            <span className="map-search-input-wrap">
              <input
                type="search"
                value={bankSearch}
                onChange={(event) => updateBankSearch(event.target.value)}
                placeholder="Search bank name..."
              />
              {hasBankSearch ? (
                <button type="button" aria-label="Clear bank search" onClick={() => updateBankSearch('')}>
                  x
                </button>
              ) : null}
            </span>
          </label>

          <label>
            Bank Type
            <select value={filters.bankType} onChange={(event) => updateFilter('bankType', event.target.value)}>
              {BANK_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            Groups
            <select value={filters.group} onChange={(event) => updateFilter('group', event.target.value)}>
              {GROUP_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            Minimum Prestige
            <select value={filters.minPrestige} onChange={(event) => updateFilter('minPrestige', Number(event.target.value))}>
              {STAR_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Minimum Pay
            <select value={filters.minPay} onChange={(event) => updateFilter('minPay', Number(event.target.value))}>
              {STAR_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Minimum Competitiveness
            <select
              value={filters.minCompetitiveness}
              onChange={(event) => updateFilter('minCompetitiveness', Number(event.target.value))}
            >
              {STAR_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="map-view-toggle" aria-label="Map display mode">
            <button
              type="button"
              className={viewMode === 'map' ? 'active' : ''}
              onClick={() => setViewMode('map')}
            >
              Map View
            </button>
            <button
              type="button"
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
          </div>
        </div>

        {viewMode === 'map' ? (
          <div className="map-card">
            <div className="map-legend" aria-label="Marker color legend">
              {TYPE_LABELS.map((type) => (
                <span key={type}>
                  <i className={`legend-dot legend-dot-${TYPE_CLASS_NAMES[type]}`} />
                  {type}
                </span>
              ))}
            </div>
            {filteredOffices.length === 0 ? <div className="map-empty-state">{emptyMapMessage}</div> : null}
            <MapContainer
              center={[39.5, -98.35]}
              zoom={4}
              minZoom={3}
              maxZoom={19}
              scrollWheelZoom
              className="leaflet-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxZoom={19}
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClusteredOfficeMarkers offices={filteredOffices} onAddContact={onAddContact} />
            </MapContainer>
          </div>
        ) : (
          <section className="map-list-view" aria-live="polite">
            <div className="map-list-heading">
              <h3>Showing {firmSummaries.length} firms across {filteredOffices.length} matching offices</h3>
            </div>

            {filteredOffices.length === 0 ? (
              <div className="map-list-empty">{emptyListMessage}</div>
            ) : (
              <div className="map-list-grid">
                {firmSummaries.map((firm) => (
                  <article className="map-office-card map-firm-card" key={firm.firm}>
                    <div className="map-office-card-heading">
                      <div>
                        <h3>{firm.firm}</h3>
                        <p>{firm.offices.length} matching {firm.offices.length === 1 ? 'office' : 'offices'}</p>
                      </div>
                      <span className={`map-type-pill map-type-pill-${TYPE_CLASS_NAMES[firm.type] || TYPE_CLASS_NAMES.Unknown}`}>
                        {firm.type}
                      </span>
                    </div>
                    <p className="map-office-history">{firm.summary}</p>
                    <dl>
                      <div>
                        <dt>Groups represented</dt>
                        <dd>{firm.groups.join(', ')}</dd>
                      </div>
                      <div>
                        <dt>Highest prestige</dt>
                        <dd>{renderStars(firm.maxPrestige)} stars</dd>
                      </div>
                      <div>
                        <dt>Highest pay</dt>
                        <dd>{renderStars(firm.maxPay)} stars</dd>
                      </div>
                      <div>
                        <dt>Highest competitiveness</dt>
                        <dd>{renderStars(firm.maxCompetitiveness)} stars</dd>
                      </div>
                    </dl>
                    <button type="button" className="map-office-toggle" onClick={() => toggleFirm(firm.firm)}>
                      {expandedFirm === firm.firm ? 'Hide Offices' : 'View Offices'}
                    </button>

                    {expandedFirm === firm.firm ? (
                      <div className="map-firm-office-list">
                        {firm.offices.map((office) => (
                          <section className="map-firm-office" key={office.id}>
                            <div className="map-firm-office-heading">
                              <h4>{office.officeCity}, {office.state}</h4>
                              <span>{office.estimatedHeadcount}</span>
                            </div>
                            <p>{office.officeHistory}</p>
                            <dl>
                              {formattedAddress(office) ? (
                                <div>
                                  <dt>Address</dt>
                                  <dd>{formattedAddress(office)}</dd>
                                </div>
                              ) : null}
                              <div>
                                <dt>Groups</dt>
                                <dd>{office.groups.join(', ')}</dd>
                              </div>
                              <div>
                                <dt>Prestige</dt>
                                <dd>{renderStars(office.prestigeStars)} stars</dd>
                              </div>
                              <div>
                                <dt>Pay</dt>
                                <dd>{renderStars(office.payStars)} stars</dd>
                              </div>
                              <div>
                                <dt>Competitiveness</dt>
                                <dd>{renderStars(office.competitivenessStars)} stars</dd>
                              </div>
                              <div>
                                <dt>Internship opportunities</dt>
                                <dd>{office.internshipOpportunities}</dd>
                              </div>
                              {office.notes ? (
                                <div>
                                  <dt>Notes</dt>
                                  <dd>{office.notes}</dd>
                                </div>
                              ) : null}
                            </dl>
                            {addressNeedsVerification(office) ? (
                              <p className="address-verification-note">Address needs verification.</p>
                            ) : null}
                          </section>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </section>
    </>
  );
}
