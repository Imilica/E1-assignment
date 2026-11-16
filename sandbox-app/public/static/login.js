const form = document.getElementById('login-form');
const email = document.getElementById('email');
const password = document.getElementById('password');
const emailErr = document.getElementById('email-error');
const passErr = document.getElementById('password-error');
const banner = document.getElementById('form-error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  banner.hidden = true;

  // Frontend validation: no backend call unless both fields are valid.
  let valid = true;
  const em = email.value.trim();
  if (!em) { setError(email, emailErr, 'Email is required.'); valid = false; }
  else if (!EMAIL_RE.test(em)) { setError(email, emailErr, 'Please enter a valid email address.'); valid = false; }
  else setError(email, emailErr, '');
  if (!password.value) { setError(password, passErr, 'Password is required.'); valid = false; }
  else setError(password, passErr, '');
  if (!valid) return;

  const res = await api('POST', form.dataset.endpoint, {
    email: em, password: password.value, remember: document.getElementById('remember').checked,
  });
  if (res.ok) location.href = res.data.redirect;
  else { banner.textContent = res.data.error || 'Login failed.'; banner.hidden = false; }
});
