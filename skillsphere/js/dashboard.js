/* ═══════════════════════════════════════════
   dashboard.js — Dashboard render functions & chart
   Depends on: state.js (assessmentReport, currentUser, COUNSELOR_DEFS,
               chartInstance, chartInit)
               helpers.js (showToast)
               map.js (initDashboardMap)
   External: Chart.js (loaded via CDN in index.html)
   ═══════════════════════════════════════════ */

/* ── MAIN INIT ── */

function initDashboard() {
  // Always refresh map (coords may have changed)
  setTimeout(() => initDashboardMap(), 200);

  // Render all dynamic panels from latest assessmentReport
  renderDashboardHeader();
  renderSkillsPanel();
  renderEntropyPanel();
  renderCareersPanel();
  renderScholarshipsPanel();
  renderCounselorsPanel();

  // Destroy and rebuild chart so it always reflects latest data
  if (chartInit && chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
    chartInit     = false;
  }
  if (!chartInit) {
    chartInit = true;
    setTimeout(() => initForecastChart(), 300);
  }
}

/* ── HERO ENTROPY CARD ── */

function updateHeroCard() {
  const r = assessmentReport;

  // Mini skill bars
  const barsEl = document.getElementById('hero-skill-bars');
  if (barsEl && r.entropy.length > 0) {
    barsEl.innerHTML = r.entropy.slice(0, 4).map(e => {
      const barClass = e.status === 'Stable'  ? 'bar-stable'  :
                       e.status === 'Monitor' ? 'bar-monitor' : 'bar-risk';
      const tagClass = e.status === 'Stable'  ? 'tag-stable'  :
                       e.status === 'Monitor' ? 'tag-monitor' : 'tag-risk';
      return `
        <div class="skill-bar-item">
          <div class="skill-bar-label">
            <span>${e.skill}</span>
            <span class="entropy-tag ${tagClass}">${e.status}</span>
          </div>
          <div class="skill-bar-track">
            <div class="skill-bar-fill ${barClass}" style="width:${e.score}%"></div>
          </div>
        </div>`;
    }).join('');
  }

  // Summary counters
  const scoreEl   = document.getElementById('hero-career-score');
  const pivotEl   = document.getElementById('hero-pivot-count');
  const scholarEl = document.getElementById('hero-scholar-count');
  if (scoreEl)   scoreEl.textContent   = r.careerScore           ?? '—';
  if (pivotEl)   pivotEl.textContent   = r.careers.length        || '—';
  if (scholarEl) scholarEl.textContent = r.scholarships.length   || '—';
}

/* ── DASHBOARD HEADER ── */

function renderDashboardHeader() {
  const r         = assessmentReport;
  const nameEl    = document.getElementById('dash-greeting-name');
  const subEl     = document.getElementById('dash-greeting-sub');
  const scoreEl   = document.getElementById('dash-health-score');
  const entropyEl = document.getElementById('dash-entropy-level');

  const name = r.profile?.name || currentUser?.name || '';
  if (nameEl)    nameEl.textContent    = name ? `Welcome back, ${name.split(' ')[0]} 👋` : 'Welcome 👋';
  if (subEl)     subEl.textContent     = r.careerScore
    ? 'Career report generated • Last updated: just now'
    : 'Complete the assessment to generate your career report';
  if (scoreEl)   scoreEl.textContent   = r.careerScore  ?? '—';
  if (entropyEl) entropyEl.textContent = r.entropyLevel ?? '—';
}

/* ── SKILLS PANEL ── */

function renderSkillsPanel() {
  const container = document.getElementById('dash-skills-container');
  if (!container) return;
  const skills = assessmentReport.skills;
  if (!skills.length) {
    container.innerHTML = '<span style="color:var(--muted);font-size:0.85rem;">No skills extracted yet. Complete the assessment.</span>';
    return;
  }
  container.innerHTML = skills.map(s => {
    const cls = s.badge === 'teal'  ? 'badge-teal'  :
                s.badge === 'amber' ? 'badge-amber' : 'badge-blue';
    return `<span class="skill-badge ${cls}">${s.name}</span>`;
  }).join('');
}

/* ── ENTROPY PANEL ── */

function renderEntropyPanel() {
  const container = document.getElementById('dash-entropy-container');
  if (!container) return;
  const entropy = assessmentReport.entropy;
  if (!entropy.length) {
    container.innerHTML = '<span style="color:var(--muted);font-size:0.85rem;">No entropy data yet. Complete the assessment.</span>';
    return;
  }
  const colorMap = { 'Stable': '#14B8A6', 'Monitor': '#F59E0B', 'At Risk': '#EF4444' };
  const barMap   = { 'Stable': 'bar-stable', 'Monitor': 'bar-monitor', 'At Risk': 'bar-risk' };
  container.innerHTML = entropy.map(e => {
    const color  = colorMap[e.status] || '#64748B';
    const barCls = barMap[e.status]   || 'bar-monitor';
    return `
      <div class="entropy-meter">
        <div class="em-label">
          <span>${e.skill}</span>
          <span style="color:${color};font-weight:600;">${e.score}% — ${e.status}</span>
        </div>
        <div class="em-track">
          <div class="em-fill ${barCls}" style="width:${e.score}%"></div>
        </div>
      </div>`;
  }).join('');
}

/* ── CAREER RECOMMENDATIONS PANEL ── */

function renderCareersPanel() {
  const container = document.getElementById('dash-careers-container');
  if (!container) return;
  const careers = assessmentReport.careers;
  if (!careers.length) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--muted);font-size:0.88rem;">No career recommendations yet. Complete the assessment to unlock your personalized pivot paths.</div>';
    return;
  }
  container.innerHTML = careers.map(c => `
    <div class="forecast-card">
      <div class="fc-icon">${c.icon || '🎯'}</div>
      <div class="fc-title">${c.title}</div>
      <div class="fc-desc">${c.desc}</div>
      <span class="fc-tag" style="${c.tagStyle || ''}">${c.tag || ''}</span>
    </div>`).join('');
}

/* ── SCHOLARSHIPS PANEL ── */

function renderScholarshipsPanel() {
  const container = document.getElementById('dash-scholarships-container');
  if (!container) return;
  const scholarships = assessmentReport.scholarships;
  if (!scholarships.length) {
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--muted);font-size:0.88rem;">No scholarships matched yet. Complete the assessment to unlock tailored opportunities.</div>';
    return;
  }
  container.innerHTML = scholarships.map(s => `
    <div class="scholarship-card">
      <div class="sc-info">
        <h4>${s.name}</h4>
        <div class="sc-tags" style="margin-top:0.4rem;">
          ${(s.tags || []).map(t => `<span class="sc-tag" style="${t.style || ''}">${t.label}</span>`).join('')}
        </div>
      </div>
      <button class="sc-apply" onclick="window.open('${s.applyUrl || '#'}','_blank')">Apply Now →</button>
    </div>`).join('');
}

/* ── COUNSELORS PANEL ── */

function renderCounselorsPanel() {
  const container = document.getElementById('dash-counselors-container');
  if (!container) return;
  const counselors = assessmentReport.counselors;
  COUNSELOR_DEFS   = counselors; // sync global for map.js

  if (!counselors.length) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:1.5rem;color:var(--muted);font-size:0.85rem;">Enable location in the wizard to find counselors near you.</div>';
    return;
  }
  container.innerHTML = counselors.map((c, i) => `
    <div class="counselor-card" id="counselor-card-${i}" style="cursor:pointer;" onclick="focusCounselorOnMap(${i})">
      <div class="counselor-avatar">${c.initials}</div>
      <div style="flex:1;">
        <div class="counselor-info">
          <h4>${c.name}</h4>
          <p>${c.title} · ${c.exp}</p>
          <div class="dist" id="counselor-dist-${i}">📍 ${c.distKm.toFixed(1)} km away</div>
        </div>
        <button class="btn-xs btn-xs-primary" onclick="event.stopPropagation();showToast('📅','Booking feature coming soon','#2563EB')">Book Meeting</button>
        <button class="btn-xs btn-xs-ghost"   onclick="event.stopPropagation();showToast('✉️','Contact feature coming soon','#64748B')">Contact</button>
      </div>
    </div>`).join('');
}

/* ── COUNSELOR MAP HELPERS (called by map.js) ── */

function updateCounselorCard(index, distStr, neighborhood) {
  const distEl = document.getElementById(`counselor-dist-${index}`);
  if (distEl) {
    distEl.textContent = `📍 ${distStr} away${neighborhood ? ' · ' + neighborhood : ''}`;
  }
}

function focusCounselorOnMap(index) {
  const marker = counselorMarkers[index];
  if (marker && leafletMap) {
    leafletMap.setView(marker.getLatLng(), 15, { animate: true });
    marker.openPopup();
  }
  highlightCounselorCard(index);
}

function highlightCounselorCard(index) {
  const total = assessmentReport.counselors.length;
  for (let i = 0; i < total; i++) {
    const card = document.getElementById(`counselor-card-${i}`);
    if (card) {
      card.style.borderColor = i === index ? 'var(--teal)' : 'var(--border)';
      card.style.boxShadow   = i === index ? '0 0 0 2px rgba(20,184,166,0.25)' : '';
    }
  }
}

/* ── FORECAST CHART ── */

function initForecastChart() {
  const ctx = document.getElementById('forecastChart');
  if (!ctx) return;

  const entropy = assessmentReport.entropy;
  const COLORS  = ['#14B8A6', '#F59E0B', '#EF4444', '#2563EB', '#8B5CF6', '#F97316'];

  // Build Chart.js datasets with simple linear trend projection per skill
  const datasets = entropy.slice(0, 5).map((e, i) => {
    const score = e.score;
    // Stable: grows slightly, Monitor: flat/declining, At Risk: declines fast
    const delta = e.status === 'Stable' ? 1.2 : e.status === 'Monitor' ? -0.8 : -3.2;
    const data  = [0, 2, 4, 6, 8, 10, 12].map(
      mo => Math.max(0, Math.min(100, Math.round(score + delta * mo)))
    );
    const color = COLORS[i % COLORS.length];
    return {
      label: e.skill,
      data,
      borderColor:     color,
      backgroundColor: color + '12', // ~7% opacity hex suffix
      tension: 0.4, fill: true, borderWidth: 2.5, pointRadius: 3,
    };
  });

  // Empty state if no entropy data
  if (!datasets.length) {
    ctx.parentElement.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--muted);font-size:0.88rem;">Complete the assessment to see your 12-month skill trajectory forecast.</div>';
    return;
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels: ['Now', '2M', '4M', '6M', '8M', '10M', '12M'], datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend:  { labels: { color: '#64748B', font: { family: 'DM Sans', size: 12 }, boxWidth: 16, padding: 16 } },
        tooltip: { backgroundColor: '#0B3D91', titleColor: 'white', bodyColor: 'rgba(255,255,255,0.7)' },
      },
      scales: {
        x: {
          grid:  { color: 'rgba(0,0,0,0.04)' },
          ticks: { color: '#94A3B8', font: { family: 'DM Sans' } },
        },
        y: {
          grid:  { color: 'rgba(0,0,0,0.04)' },
          ticks: { color: '#94A3B8', font: { family: 'DM Sans' } },
          min: 0, max: 100,
          title: { display: true, text: 'Relevance Score %', color: '#94A3B8' },
        },
      },
    },
  });
}
