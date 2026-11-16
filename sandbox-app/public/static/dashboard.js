(async () => {
  const me = await api('GET', '/api/me');
  document.querySelector('[data-testid=welcome]').textContent = `Welcome, ${me.data.email}!`;
  const cases = (await api('GET', '/api/test-cases')).data;
  document.getElementById('total').textContent = cases.length;
  document.getElementById('auto').textContent = cases.filter((c) => c.automated).length;
})();
