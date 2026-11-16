const form = document.getElementById('tc-form');
const stepsEl = document.getElementById('steps');
const $ = (id) => document.getElementById(id);

document.getElementById('back').addEventListener('click', (e) => {
  if (history.length > 1 && document.referrer) { e.preventDefault(); history.back(); }
});

function addStep(value = '') {
  const row = document.createElement('div');
  row.className = 'row';
  row.style.marginBottom = '6px';
  row.dataset.testid = 'step-row';
  row.innerHTML = `<span class="num"></span>
    <input type="text" placeholder="Test step" data-testid="step-input">
    <button type="button" class="secondary" aria-label="Remove step" data-testid="remove-step">&times;</button>`;
  row.querySelector('input').value = value;
  row.querySelector('button').onclick = () => { row.remove(); renumber(); };
  stepsEl.appendChild(row);
  renumber();
  return row.querySelector('input');
}
function renumber() {
  [...stepsEl.children].forEach((r, i) => {
    r.querySelector('.num').textContent = `${i + 1}.`;
    r.querySelector('button').hidden = stepsEl.children.length === 1;
  });
}
const stepValues = () => [...stepsEl.querySelectorAll('input')].map((i) => i.value.trim());

function validate() {
  const title = $('title').value.trim();
  const expected = $('expected').value.trim();
  const steps = stepValues().filter(Boolean);
  setError($('title'), $('title-error'), title ? '' : 'Title is required.');
  setError($('expected'), $('expected-error'), expected ? '' : 'Expected Result is required.');
  $('steps-error').textContent = steps.length ? '' : 'At least one test step is required.';
  return { valid: !!(title && expected && steps.length), title, expected, steps };
}

$('add-step').onclick = () => addStep().focus();

// Enter must not submit (or add a step) unless every required field is valid.
form.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA' || e.target.type === 'checkbox') return;
  if (e.target.tagName === 'BUTTON') return; // let buttons activate normally
  e.preventDefault();
  if (validate().valid) form.requestSubmit();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const v = validate();
  if (!v.valid) return;
  const res = await api('POST', '/api/test-cases', {
    title: v.title, description: $('description').value.trim(),
    expectedResult: v.expected, steps: v.steps, automated: $('automated').checked,
  });
  if (res.ok) location.href = '/test-cases';
  else $('steps-error').textContent = Object.values(res.data.errors || { e: 'Failed to save.' }).join(' ');
});

addStep();
