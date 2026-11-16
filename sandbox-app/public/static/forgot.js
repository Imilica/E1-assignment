const f = document.getElementById('forgot-form');
const em = document.getElementById('email');
const er = document.getElementById('email-error');
const msg = document.getElementById('message');
f.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.hidden = true;
  const v = em.value.trim();
  if (!v) return setError(em, er, 'Email is required.');
  if (!EMAIL_RE.test(v)) return setError(em, er, 'Please enter a valid email address.');
  setError(em, er, '');
  const res = await api('POST', '/api/forgot-password', { email: v });
  if (res.ok) { msg.textContent = res.data.message; msg.hidden = false; }
  else setError(em, er, res.data.error);
});
