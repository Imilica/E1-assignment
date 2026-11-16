// Shared helpers: top menu, JSON fetch, form-error helpers.
async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}

async function renderNav() {
  const nav = document.getElementById('nav');
  const me = await api('GET', '/api/me');
  if (me.ok) {
    nav.innerHTML = `
      <a href="/dashboard" data-testid="nav-dashboard">Dashboard</a>
      <a href="/test-cases" data-testid="nav-test-cases">Test Cases</a>
      <span class="spacer"></span>
      <span class="user" data-testid="nav-user">${me.data.email} (${me.data.role})</span>
      <button id="logout" data-testid="nav-logout">Logout</button>`;
    document.getElementById('logout').onclick = async () => {
      await api('POST', '/api/logout');
      location.href = '/login';
    };
  } else {
    nav.innerHTML = `
      <a href="/login" data-testid="nav-login">Login</a>
      <a href="/admin/login" data-testid="nav-admin">Admin</a>`;
  }
}

function setError(input, errEl, msg) {
  errEl.textContent = msg || '';
  input.classList.toggle('invalid', !!msg);
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

renderNav();
