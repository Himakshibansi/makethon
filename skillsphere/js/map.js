/* ═══════════════════════════════════════════
   map.js — Geospatial utilities & Leaflet map
   Depends on: state.js (userGeoCoords, COUNSELOR_DEFS, leafletMap,
               counselorMarkers, assessmentReport)
               helpers.js (showToast)
               dashboard.js (updateCounselorCard, highlightCounselorCard)
   External: Leaflet (loaded via CDN in index.html)
   ═══════════════════════════════════════════ */

/* ── MATH HELPERS ── */

/**
 * Haversine formula — great-circle distance in km between two lat/lng points.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Inverse Vincenty — destination point given origin, bearing (°) and distance (km).
 * Used to place counselor pins at geometrically exact distances from the user.
 */
function destPoint(lat, lng, bearingDeg, distKm) {
  const R  = 6371;
  const δ  = distKm / R;
  const θ  = bearingDeg * Math.PI / 180;
  const φ1 = lat * Math.PI / 180;
  const λ1 = lng * Math.PI / 180;
  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );
  const λ2 =
    λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { lat: φ2 * 180 / Math.PI, lng: λ2 * 180 / Math.PI };
}

/**
 * Nominatim reverse-geocode — returns most granular named neighbourhood string.
 */
async function reverseGeocodeNeighborhood(lat, lng) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const a    = data.address || {};
    return a.suburb || a.neighbourhood || a.quarter || a.city_district || a.city || a.town || a.county || '';
  } catch (_) {
    return '';
  }
}

/* ── LEAFLET MAP INIT ── */

async function initDashboardMap() {
  const mapEl = document.getElementById('leaflet-map');
  const msgEl = document.getElementById('map-static-msg');
  if (!mapEl) return;

  // No location yet — prompt user
  if (!userGeoCoords) {
    if (msgEl) {
      msgEl.innerHTML = `
        <div style="font-size:2.5rem;margin-bottom:0.8rem;">📍</div>
        <p style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem;">
          Enable location in the wizard to see counselors on an accurate map near you.
        </p>
        <button class="btn-accent" style="font-size:0.82rem;" onclick="showPage('wizard')">
          Go to Wizard →
        </button>`;
      msgEl.style.display = 'block';
    }
    mapEl.style.display = 'none';
    return;
  }

  const { lat, lng, accuracy } = userGeoCoords;

  mapEl.style.display = 'block';
  if (msgEl) msgEl.style.display = 'none';

  // Tear down old map instance before rebuilding
  if (leafletMap) { leafletMap.remove(); leafletMap = null; }
  counselorMarkers = [];

  leafletMap = L.map('leaflet-map', { zoomControl: true, scrollWheelZoom: false })
                .setView([lat, lng], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(leafletMap);

  // GPS accuracy circle
  if (accuracy) {
    L.circle([lat, lng], {
      radius: accuracy,
      color: '#2563EB', fillColor: '#2563EB',
      fillOpacity: 0.08, weight: 1.5, dashArray: '4 4',
    }).addTo(leafletMap);
  }

  // User marker with pulsing ring
  const userIcon = L.divIcon({
    html: `<div style="position:relative;width:20px;height:20px;">
             <div style="position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,0.25);animation:geoRing 2s ease-out infinite;"></div>
             <div style="position:absolute;inset:3px;border-radius:50%;background:#2563EB;border:2.5px solid white;box-shadow:0 2px 8px rgba(37,99,235,0.7);"></div>
           </div>`,
    className: '', iconSize: [20, 20], iconAnchor: [10, 10],
  });
  L.marker([lat, lng], { icon: userIcon })
    .addTo(leafletMap)
    .bindPopup(
      `<b>You are here</b>${accuracy ? `<br><span style="font-size:0.75rem;color:#64748B;">GPS accuracy: ±${Math.round(accuracy)}m</span>` : ''}`
    )
    .openPopup();

  // Build counselor positions using bearing + distance (geodesic accuracy)
  const counselors = COUNSELOR_DEFS.map(c => {
    const pos      = destPoint(lat, lng, c.bearing, c.distKm);
    const actualKm = haversineKm(lat, lng, pos.lat, pos.lng);
    return { ...c, lat: pos.lat, lng: pos.lng, actualKm };
  });

  // Reverse-geocode all positions in parallel
  const neighborhoods = await Promise.all(
    counselors.map(c => reverseGeocodeNeighborhood(c.lat, c.lng))
  );

  // Place markers and wire up card interaction
  counselors.forEach((c, i) => {
    const neighborhood = neighborhoods[i] || '';
    const distStr      = `${c.actualKm.toFixed(1)} km`;

    const cIcon = L.divIcon({
      html: `<div id="cmarker-${i}" style="background:#14B8A6;width:38px;height:38px;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(20,184,166,0.55);display:flex;align-items:center;justify-content:center;color:white;font-size:0.7rem;font-weight:700;font-family:sans-serif;cursor:pointer;transition:transform 0.2s;">${c.initials}</div>`,
      className: '', iconSize: [38, 38], iconAnchor: [19, 19],
    });

    const marker = L.marker([c.lat, c.lng], { icon: cIcon }).addTo(leafletMap);
    marker.bindPopup(`
      <div style="font-family:'DM Sans',sans-serif;min-width:160px;">
        <b style="font-size:0.9rem;">${c.name}</b><br>
        <span style="font-size:0.78rem;color:#64748B;">${c.title} · ${c.exp}</span><br>
        <span style="font-size:0.78rem;color:#14B8A6;margin-top:4px;display:block;">
          📍 ${distStr} away${neighborhood ? ' · ' + neighborhood : ''}
        </span>
      </div>
    `);

    marker.on('click', () => highlightCounselorCard(i));
    counselorMarkers.push(marker);

    // Update sidebar card distance with real neighborhood
    updateCounselorCard(i, distStr, neighborhood);
  });

  // Fit map bounds to include user + all counselors
  const allPoints = [[lat, lng], ...counselors.map(c => [c.lat, c.lng])];
  leafletMap.fitBounds(allPoints, { padding: [40, 40] });

  // Update map caption
  const labelEl = document.getElementById('map-location-label');
  if (labelEl) {
    const cityName = document.getElementById('f-city')?.value || 'your area';
    labelEl.textContent = `${counselors.length} counselors found within 15km of ${cityName}`;
    labelEl.style.display = 'block';
  }
}
