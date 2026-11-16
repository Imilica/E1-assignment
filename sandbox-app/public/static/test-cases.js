async function load() {
  const cases = (await api('GET', '/api/test-cases')).data;
  document.getElementById('empty').hidden = cases.length > 0;
  document.getElementById('table').hidden = cases.length === 0;
  document.getElementById('rows').innerHTML = cases.map((c) => `
    <tr data-testid="test-case-row">
      <td data-testid="tc-title"><strong>${esc(c.title)}</strong>${c.description ? `<div class="muted">${esc(c.description)}</div>` : ''}</td>
      <td data-testid="tc-expected">${esc(c.expectedResult)}</td>
      <td><ol class="steps" data-testid="tc-steps">${c.steps.map((s) => `<li data-testid="tc-step">${esc(s)}</li>`).join('')}</ol></td>
      <td data-testid="tc-automated">${c.automated ? 'Yes' : 'No'}</td>
      <td><button class="secondary" data-id="${c.id}" data-testid="tc-delete">Delete</button></td>
    </tr>`).join('');
}
document.getElementById('rows').addEventListener('click', async (e) => {
  const id = e.target.dataset.id;
  if (id) { await api('DELETE', `/api/test-cases/${id}`); load(); }
});
load();
