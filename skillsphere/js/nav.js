/* ═══════════════════════════════════════════
   nav.js — Page routing & nav active states
   Depends on: state.js, dashboard.js (calls initDashboard)
   ═══════════════════════════════════════════ */

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  window.scrollTo(0, 0);

  // Update nav active highlights
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  if (name === 'home')      document.getElementById('nav-home')?.classList.add('active');
  if (name === 'wizard')    document.getElementById('nav-wizard')?.classList.add('active');
  if (name === 'dashboard') document.getElementById('nav-dashboard')?.classList.add('active');

  if (name === 'dashboard') initDashboard();
}
