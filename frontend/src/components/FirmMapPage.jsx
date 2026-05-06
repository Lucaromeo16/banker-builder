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
  'LMM / Regional Boutique',
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
  'LMM / Regional Boutique',
  'Big 4 Corporate Finance'
];

const TYPE_CLASS_NAMES = {
  BB: 'bb',
  EB: 'eb',
  MM: 'mm',
  'LMM / Regional Boutique': 'lmm',
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
  const notes = String(office.notes || '').toLowerCase();

  if (type.includes('big 4')) return 'Big 4 Corporate Finance';
  if (type.includes('lmm') || type.includes('regional boutique') || type.includes('regional advisory')) return 'LMM / Regional Boutique';
  if (type.includes('international bb') || type.includes('canadian bb')) {
    return notes.includes('mm') || notes.includes('middle-market') || notes.includes('niche') || type.includes('/ mm') ? 'MM' : 'BB';
  }
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
    return firm.includes('centerview') ||
      firm.includes('allen') ||
      firm.includes('gordon dyal') ||
      firm.includes('m. klein') ||
      firm.includes('liontree') ||
      firm.includes('raine') ||
      firm.includes('tidal') ||
      firm.includes('leerink')
      ? 'EB'
      : 'LMM / Regional Boutique';
  }

  return 'LMM / Regional Boutique';
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

function popupHtml(office) {
  return `
    <div class="office-popup">
      <h3>${escapeHtml(office.firm)} · ${escapeHtml(office.officeCity)}, ${escapeHtml(office.state)}</h3>
      <p class="office-popup-type">${escapeHtml(office.type)}</p>
      <p>${escapeHtml(office.officeHistory)}</p>
      <dl>
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

function ClusteredOfficeMarkers({ offices }) {
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
      clusterLayer.addLayer(marker);
    });

    map.addLayer(clusterLayer);

    return () => {
      map.removeLayer(clusterLayer);
    };
  }, [map, offices]);

  return null;
}

export default function FirmMapPage({ onBack }) {
  const [viewMode, setViewMode] = useState('map');
  const [filters, setFilters] = useState({
    bankType: 'All',
    group: 'All',
    minPrestige: 0,
    minPay: 0,
    minCompetitiveness: 0
  });

  const filteredOffices = useMemo(
    () => ibOffices.filter((office) => officeMatchesFilters(office, filters)),
    [filters]
  );

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

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
            {filteredOffices.length === 0 ? <div className="map-empty-state">No offices match the selected filters.</div> : null}
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
              <ClusteredOfficeMarkers offices={filteredOffices} />
            </MapContainer>
          </div>
        ) : (
          <section className="map-list-view" aria-live="polite">
            <div className="map-list-heading">
              <h3>Showing {filteredOffices.length} matching offices</h3>
            </div>

            {filteredOffices.length === 0 ? (
              <div className="map-list-empty">No offices match the selected filters.</div>
            ) : (
              <div className="map-list-grid">
                {filteredOffices.map((office) => (
                  <article className="map-office-card" key={office.id}>
                    <div className="map-office-card-heading">
                      <div>
                        <h3>{office.firm}</h3>
                        <p>{office.officeCity}, {office.state}</p>
                      </div>
                      <span className={`map-type-pill map-type-pill-${TYPE_CLASS_NAMES[bankTypeForOffice(office)] || TYPE_CLASS_NAMES.Unknown}`}>
                        {bankTypeForOffice(office)}
                      </span>
                    </div>
                    <p className="map-office-history">{office.officeHistory}</p>
                    <dl>
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
                        <dt>Estimated headcount</dt>
                        <dd>{office.estimatedHeadcount}</dd>
                      </div>
                      <div>
                        <dt>Original type</dt>
                        <dd>{office.type}</dd>
                      </div>
                    </dl>
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
