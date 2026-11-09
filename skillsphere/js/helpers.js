/* ═══════════════════════════════════════════
   helpers.js — Shared utility functions
   Depends on: state.js (showToast reads DOM only)
   ═══════════════════════════════════════════ */

/* ── EMAIL VALIDATION ── */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── PASSWORD VISIBILITY TOGGLE ── */
function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

/* ── PASSWORD STRENGTH METER ── */
function checkPasswordStrength(val) {
  const fill  = document.getElementById('pw-fill');
  const label = document.getElementById('pw-label');
  let score = 0;
  if (val.length >= 8)          score++;
  if (/[A-Z]/.test(val))        score++;
  if (/[0-9]/.test(val))        score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { w: '0%',   color: '#EF4444', text: 'Too short' },
    { w: '25%',  color: '#EF4444', text: 'Weak' },
    { w: '50%',  color: '#F59E0B', text: 'Fair' },
    { w: '75%',  color: '#3B82F6', text: 'Good' },
    { w: '100%', color: '#14B8A6', text: 'Strong ✓' },
  ];
  const lvl = val.length === 0 ? 0 : Math.max(1, score);
  fill.style.width      = levels[lvl].w;
  fill.style.background = levels[lvl].color;
  label.textContent     = val.length === 0 ? 'Enter a password' : levels[lvl].text;
  label.style.color     = levels[lvl].color;
}

/* ── TOAST NOTIFICATION ── */
let toastTimer;
function showToast(icon, msg, color = '#14B8A6') {
  const toast     = document.getElementById('toast');
  const toastIcon = document.getElementById('toast-icon');
  const toastMsg  = document.getElementById('toast-msg');

  toastIcon.textContent  = icon;
  toastMsg.textContent   = msg;
  toast.style.borderLeft = `4px solid ${color}`;
  toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}
