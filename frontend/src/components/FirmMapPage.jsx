import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import ibOffices from '../../../data/ibOffices.json';

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
  const logoHtml = logo
    ? `<img src="${logo}" alt="" onerror="this.style.display='none';this.parentElement.classList.add('logo-fallback-visible');" />`
    : '';

  return L.divIcon({
    className: 'office-marker',
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

function ClusteredOfficeMarkers() {
  const map = useMap();

  useEffect(() => {
    const clusterLayer = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 10,
      maxClusterRadius: 46,
      iconCreateFunction: clusterIcon
    });

    ibOffices.forEach((office) => {
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
  }, [map]);

  return null;
}

export default function FirmMapPage({ onBack }) {
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
        </div>

        <div className="map-card">
          <MapContainer
            center={[39.5, -98.35]}
            zoom={4}
            minZoom={3}
            maxZoom={12}
            scrollWheelZoom
            className="leaflet-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClusteredOfficeMarkers />
          </MapContainer>
        </div>
      </section>
    </>
  );
}
