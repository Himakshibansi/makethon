/* ═══════════════════════════════════════════
   wizard.js — Assessment wizard logic
   Depends on: state.js (userGeoCoords, assessmentReport, API_BASE)
               helpers.js (showToast)
               nav.js (showPage)
               dashboard.js (updateHeroCard)
   ═══════════════════════════════════════════ */

/* ── STEP NAVIGATION ── */
let currentStep = 1;

function nextStep(step) {
  document.getElementById('wizard-step-' + currentStep).classList.remove('active');
  document.getElementById('step-ind-' + currentStep).classList.remove('active');
  document.getElementById('step-ind-' + currentStep).classList.add('done');

  currentStep = step;

  const stepEl = document.getElementById('wizard-step-' + step);
  if (stepEl) {
    stepEl.classList.add('active');
    document.getElementById('step-ind-' + step).classList.add('active');
    document.getElementById('step-ind-' + step).classList.remove('done');
    document.getElementById('wizard-progress').style.width = (step * 25) + '%';
  }
}

/* ── GEOLOCATION ── */

function requestLocation() {
  if (!navigator.geolocation) {
    showToast('❌', 'Geolocation is not supported by your browser.', '#EF4444');
    return;
  }

  const btn = document.querySelector('[onclick="requestLocation()"]');
  if (btn) { btn.textContent = '⏳ Detecting location...'; btn.disabled = true; }

  navigator.geolocation.getCurrentPosition(
    async pos => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      userGeoCoords = { lat, lng, accuracy };

      // Reverse-geocode user position
      let city = '', state = '', country = 'India';
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        const addr = data.address || {};
        city    = addr.city || addr.town || addr.village || addr.county || '';
        state   = addr.state  || '';
        country = addr.country || 'India';
      } catch (_) {}

      document.getElementById('f-city').value  = city;
      document.getElementById('f-state').value = state;
      const sel = document.getElementById('f-country');
      for (let opt of sel.options) {
        if (opt.text.toLowerCase() === country.toLowerCase()) { sel.value = opt.value; break; }
      }

      const accStr = accuracy ? ` (±${Math.round(accuracy)}m accuracy)` : '';
      if (btn) {
        btn.textContent       = '✅ Location Captured';
        btn.style.background  = 'linear-gradient(135deg,#14B8A6,#059669)';
      }
      showToast('✅', `Detected: ${city || 'your area'}${accStr}`, '#14B8A6');
    },
    err => {
      const msgs = {
        1: 'Location access denied. Please enter your city manually.',
        2: 'Position unavailable. Try again or enter manually.',
        3: 'Location request timed out. Try again or enter manually.',
      };
      showToast('⚠️', msgs[err.code] || 'Could not detect location.', '#F59E0B');
      if (btn) { btn.textContent = '📍 Allow Location Access'; btn.disabled = false; }
    },
    { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
  );
}

/* ── ASSESSMENT SUBMISSION ── */

function submitAssessment() {
  // Collect all wizard form values
  const profile = {
    name:    document.getElementById('f-name').value.trim(),
    age:     document.getElementById('f-age').value.trim(),
    edu:     document.getElementById('f-edu').value,
    role:    document.getElementById('f-role').value.trim(),
    history: document.getElementById('f-history').value.trim(),
    skills:  document.getElementById('f-skills').value.trim(),
    goal:    document.getElementById('f-goal').value,
    finance: document.getElementById('f-finance').value,
    scholar: document.getElementById('f-scholar').value,
    abroad:  document.getElementById('toggle-abroad').classList.contains('on'),
    city:    document.getElementById('f-city').value.trim(),
    state:   document.getElementById('f-state').value.trim(),
    country: document.getElementById('f-country').value,
    mode:    document.getElementById('f-mode').value,
    accessibility: [...document.querySelectorAll('.acc-option input:checked')]
                     .map(el => el.parentElement.textContent.trim()),
    geo: userGeoCoords || null,
  };

  // Show processing state
  const card       = document.querySelector('.wizard-card');
  const processing = document.getElementById('wizard-processing');
  card.style.display       = 'none';
  processing.style.display = 'block';
  setTimeout(() => { document.getElementById('loading-bar').style.width = '100%'; }, 100);

  // Fire all API calls in parallel
  Promise.allSettled([
    fetch(`${API_BASE}/api/parse-skills`,      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ history: profile.history, skills: profile.skills }) }),
    fetch(`${API_BASE}/api/entropy-analysis`,  { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile }) }),
    fetch(`${API_BASE}/api/career-recommend`,  { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile }) }),
    fetch(`${API_BASE}/api/scholarship-match`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile }) }),
    fetch(`${API_BASE}/api/counselor-match`,   { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ geo: profile.geo, city: profile.city, state: profile.state }) }),
  ]).then(async results => {
    const [skillsRes, entropyRes, careersRes, scholarRes, counselorRes] = results;

    async function parseOk(settled) {
      if (settled.status === 'fulfilled' && settled.value.ok) {
        try { return await settled.value.json(); } catch (_) { return null; }
      }
      return null;
    }

    const [skillsData, entropyData, careersData, scholarData, counselorData] = await Promise.all([
      parseOk(skillsRes), parseOk(entropyRes), parseOk(careersRes), parseOk(scholarRes), parseOk(counselorRes),
    ]);

    // Persist report into global state
    assessmentReport = {
      profile,
      skills:       skillsData?.skills       || [],
      entropy:      entropyData?.entropy      || [],
      careerScore:  entropyData?.careerScore  || null,
      entropyLevel: entropyData?.entropyLevel || null,
      careers:      careersData?.careers      || [],
      scholarships: scholarData?.scholarships || [],
      counselors:   counselorData?.counselors || [],
    };

    // Refresh hero card with real data
    updateHeroCard();

    setTimeout(() => showPage('dashboard'), 600);
  });
}
