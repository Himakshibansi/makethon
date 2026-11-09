/* ═══════════════════════════════════════════
   auth.js — Authentication modal & user session
   Depends on: state.js (currentUser, API_BASE)
               helpers.js (showToast, isValidEmail, togglePw, checkPasswordStrength)
               nav.js (showPage)
   ═══════════════════════════════════════════ */

/* ── MODAL CONTROL ── */

function openAuth(tab = 'signin') {
  document.getElementById('auth-overlay').classList.add('open');
  switchAuthTab(tab);
  document.body.style.overflow = 'hidden';
}

function closeAuth() {
  document.getElementById('auth-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('auth-overlay')) closeAuth();
}

function switchAuthTab(tab) {
  document.getElementById('tab-signin').classList.toggle('active', tab === 'signin');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('panel-signin').classList.toggle('active', tab === 'signin');
  document.getElementById('panel-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('panel-forgot').classList.toggle('active', tab === 'forgot');
}

function showForgotPassword() {
  document.getElementById('tab-signin').classList.remove('active');
  document.getElementById('tab-signup').classList.remove('active');
  document.getElementById('panel-signin').classList.remove('active');
  document.getElementById('panel-signup').classList.remove('active');
  document.getElementById('panel-forgot').classList.add('active');
}

/* ── SIGN IN ── */

async function handleSignIn() {
  const email    = document.getElementById('si-email').value.trim();
  const password = document.getElementById('si-password').value;

  if (!email || !password) {
    showToast('⚠️', 'Please fill in both fields', '#F59E0B'); return;
  }
  if (!isValidEmail(email)) {
    showToast('❌', 'Please enter a valid email address', '#EF4444'); return;
  }

  const btn          = document.querySelector('#panel-signin .auth-submit');
  const originalText = btn.textContent;
  btn.textContent    = 'Signing in...'; btn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      showToast('✅', 'Logged in successfully!', '#14B8A6');
      loginUser(data.user);
    } else {
      showToast('❌', data.error || 'Invalid credentials', '#EF4444');
    }
  } catch (err) {
    showToast('❌', 'Cannot connect to server. Is the backend running?', '#EF4444');
  } finally {
    btn.textContent = originalText; btn.disabled = false;
  }
}

/* ── SIGN UP ── */

async function handleSignUp() {
  const firstName = document.getElementById('su-firstname').value.trim();
  const lastName  = document.getElementById('su-lastname').value.trim();
  const email     = document.getElementById('su-email').value.trim();
  const role      = document.getElementById('su-role').value.trim();
  const password  = document.getElementById('su-password').value;
  const confirm   = document.getElementById('su-confirm').value;

  if (!firstName || !email || !password || !confirm) {
    showToast('⚠️', 'Please fill in all required fields', '#F59E0B'); return;
  }
  if (!isValidEmail(email)) {
    showToast('❌', 'Please enter a valid email address', '#EF4444'); return;
  }
  if (password.length < 8) {
    showToast('❌', 'Password must be at least 8 characters', '#EF4444'); return;
  }
  if (password !== confirm) {
    showToast('❌', 'Passwords do not match', '#EF4444'); return;
  }

  const btn          = document.querySelector('#panel-signup .auth-submit');
  const originalText = btn.textContent;
  btn.textContent    = 'Creating account...'; btn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, role, password }),
    });
    const data = await response.json();
    if (response.ok) {
      showToast('✅', 'Account created successfully!', '#14B8A6');
      loginUser(data.user);
    } else {
      showToast('❌', data.error || 'Failed to create account', '#EF4444');
    }
  } catch (err) {
    showToast('❌', 'Cannot connect to server. Is the backend running?', '#EF4444');
  } finally {
    btn.textContent = originalText; btn.disabled = false;
  }
}

/* ── FORGOT PASSWORD ── */

function handleForgotPassword() {
  const email = document.getElementById('fp-email').value.trim();
  if (!email || !isValidEmail(email)) {
    showToast('⚠️', 'Please enter a valid email address', '#F59E0B'); return;
  }

  const btn       = document.querySelector('#panel-forgot .auth-submit');
  btn.textContent = 'Sending...'; btn.disabled = true;

  setTimeout(() => {
    btn.textContent = 'Send Reset Link →'; btn.disabled = false;
    showToast('✅', `Reset link sent to ${email}!`, '#14B8A6');
    setTimeout(() => switchAuthTab('signin'), 1500);
  }, 1200);
}

/* ── SOCIAL AUTH ── */

function handleSocialAuth(provider) {
  showToast('🔗', `Connecting to ${provider}... (demo)`, '#2563EB');
  setTimeout(() => {
    loginUser({ email: `user@${provider.toLowerCase()}.com`, name: 'Demo User' });
  }, 1000);
}

/* ── LOGIN / LOGOUT ── */

function loginUser(user) {
  currentUser = user;
  closeAuth();

  const displayName = user.name || user.firstName || user.email.split('@')[0];
  const initials    = displayName.substring(0, 2).toUpperCase();
  const firstName   = displayName.split(' ')[0];

  document.getElementById('nav-avatar').textContent   = initials;
  document.getElementById('nav-username').textContent = firstName;
  document.getElementById('nav-links-main').style.display  = 'none';
  document.getElementById('nav-user-area').style.display   = 'flex';

  // Prefill dashboard greeting
  const greetEl = document.getElementById('dash-greeting-name');
  const subEl   = document.getElementById('dash-greeting-sub');
  if (greetEl) greetEl.textContent = `Welcome back, ${firstName} 👋`;
  if (subEl)   subEl.textContent   = 'Complete the assessment to generate your career report';

  showToast('✅', `Welcome back, ${firstName}! 🎉`, '#14B8A6');
  setTimeout(() => showPage('dashboard'), 1200);
}

function signOut() {
  currentUser = null;
  document.getElementById('nav-links-main').style.display = 'flex';
  document.getElementById('nav-user-area').style.display  = 'none';
  showToast('👋', 'Signed out successfully', '#64748B');
  showPage('home');
}

/* ── ESC KEY TO CLOSE ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAuth();
});
