/* ═══════════════════════════════════════════
   state.js — Global shared application state
   ═══════════════════════════════════════════
   All other modules read/write these variables.
   Must be loaded FIRST before any other JS file.
   ═══════════════════════════════════════════ */

/* ── API ── */
const API_BASE = 'http://127.0.0.1:5000';

/* ── AUTH ── */
let currentUser = null;

/* ── ASSESSMENT REPORT ──
   Populated by wizard.js → submitAssessment() after API responses.
   Read by dashboard.js render functions and neural.js updateHeroCard().

   Expected API shapes:
     skills:      [{ name: string, badge: 'blue'|'teal'|'amber' }]
     entropy:     [{ skill: string, score: number, status: 'Stable'|'Monitor'|'At Risk' }]
     careerScore: number | null
     entropyLevel:'Low'|'Med'|'High' | null
     careers:     [{ icon, title, desc, tag, tagStyle }]
     scholarships:[{ name, tags:[{label,style}], applyUrl }]
     counselors:  [{ name, initials, title, exp, bearing, distKm }]
*/
let assessmentReport = {
  profile:      null,
  skills:       [],
  entropy:      [],
  careerScore:  null,
  entropyLevel: null,
  careers:      [],
  scholarships: [],
  counselors:   [],
};

/* ── GEO / MAP ── */
let userGeoCoords   = null;  // { lat, lng, accuracy } set by wizard.js → requestLocation()
let COUNSELOR_DEFS  = [];    // synced from assessmentReport.counselors by dashboard.js
let leafletMap      = null;  // Leaflet map instance, managed by map.js
let counselorMarkers = [];   // Leaflet marker array, managed by map.js

/* ── CHART ── */
let chartInstance = null;
let chartInit     = false;
