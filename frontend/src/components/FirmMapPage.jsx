import { divIcon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import ibOffices from '../../../data/ibOffices.json';

const officeMarkerIcon = divIcon({
  className: 'office-marker',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -10]
});

function renderStars(count) {
  return `${count}/5`;
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
            {ibOffices.map((office) => (
              <Marker key={office.id} position={[office.latitude, office.longitude]} icon={officeMarkerIcon}>
                <Popup>
                  <div className="office-popup">
                    <h3>
                      {office.firm} · {office.officeCity}, {office.state}
                    </h3>
                    <p className="office-popup-type">{office.type}</p>
                    <p>{office.officeHistory}</p>
                    <dl>
                      <div>
                        <dt>Groups</dt>
                        <dd>{office.groups.join(', ')}</dd>
                      </div>
                      <div>
                        <dt>Estimated headcount</dt>
                        <dd>{office.estimatedHeadcount}</dd>
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
                    </dl>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </section>
    </>
  );
}
