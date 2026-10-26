'use strict';
const APP_NAME = "Shift Shock";
const C = ShiftCore;
const $ = id => document.getElementById(id);
let state = C.preset('haru');
let result = null;
let editingId = null;
let nextId = 1;
let draggingId = null;
let animating = false;

document.title = APP_NAME;
$('app-name').textContent = APP_NAME;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function notify(message) { $('notice').textContent = message; }
function invalidate() {
  result = null;
  notify('Board updated. Find the smallest fix to refresh the plan and exports.');
  render();
}
function displayPost(h) { return h.absent || !result ? h.current : result.assignment[h.id]; }

function renderBoard() {
  const board = $('board');
  board.replaceChildren();
  const counts = C.coverage(state.posts, state.helpers, result && result.assignment);
  const columns = [...state.posts, { name: C.FLOATING }];
  columns.forEach(post => {
    const floating = post.name === C.FLOATING;
    const column = element('section', 'column');
    column.setAttribute('aria-label', floating ? 'Floating helpers' : post.name);
    column.dataset.post = post.name;
    const header = element('div', 'column-header');
    header.append(element('h3', '', floating ? 'Floating' : post.name));
    const count = counts.find(p => p.name === post.name);
    const occupants = state.helpers.filter(h => displayPost(h) === post.name);
    const status = floating ? `${occupants.filter(h => !h.absent).length} FREE` : !post.required ? 'CLOSED' : `${count.count}/${post.required} ${count.missing ? 'GAP' : 'READY'}`;
    header.append(element('span', `post-state ${floating || !post.required ? 'neutral' : count.missing ? 'missing' : ''}`, status));
    const cards = element('div', 'cards');
    occupants.forEach(h => cards.append(helperCard(h)));
    if (!floating && count.missing) cards.append(element('div', 'empty-label', `${count.missing} ${count.missing === 1 ? 'person' : 'people'} needed`));
    else if (!occupants.length) cards.append(element('div', 'empty-label neutral', floating ? 'No one floating' : 'Post closed'));
    column.append(header, cards);
    column.addEventListener('dragover', e => { if (draggingId) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; column.classList.add('drag-over'); } });
    column.addEventListener('dragleave', e => { if (!column.contains(e.relatedTarget)) column.classList.remove('drag-over'); });
    column.addEventListener('drop', e => {
      e.preventDefault();
      column.classList.remove('drag-over');
      const helper = state.helpers.find(h => h.id === draggingId);
      draggingId = null;
      if (!helper || animating) return;
      if (!floating && !helper.skills.includes(post.name)) { notify(`${helper.name} needs the ${post.name} skill. Use Edit to change skills.`); return; }
      helper.current = post.name;
      invalidate();
    });
    board.append(column);
  });
}
function helperCard(h) {
  const moveIndex = result ? result.moves.findIndex(m => m.id === h.id) : -1;
  const card = element('article', `helper-card${h.absent ? ' absent' : ''}${moveIndex >= 0 ? ' moved' : ''}`);
  card.dataset.helperId = h.id;
  card.draggable = !animating;
  const toggle = element('button', 'card-toggle');
  toggle.type = 'button';
  toggle.disabled = animating;
  toggle.setAttribute('aria-pressed', String(h.absent));
  toggle.setAttribute('aria-label', `${h.name}, ${h.absent ? 'absent' : 'available'}. Mark ${h.absent ? 'available' : 'absent'}.`);
  toggle.append(element('span', 'helper-name', h.name));
  const skills = element('span', 'skills');
  (h.skills.length ? h.skills : ['No skills set']).forEach(skill => skills.append(element('span', 'skill', skill)));
  toggle.append(skills);
  toggle.addEventListener('click', () => {
    h.absent = !h.absent;
    invalidate();
    const replacement = [...document.querySelectorAll('.helper-card')].find(c => c.dataset.helperId === h.id);
    if (replacement) replacement.querySelector('.card-toggle').focus({ preventScroll: true });
  });
  const bottom = element('div', 'card-bottom');
  bottom.append(element('span', 'card-status', h.absent ? 'ABSENT' : moveIndex >= 0 ? `MOVE ${moveIndex + 1}` : 'AVAILABLE'));
  const edit = element('button', 'edit-card', 'Edit');
  edit.type = 'button';
  edit.disabled = animating;
  edit.setAttribute('aria-label', `Edit ${h.name}`);
  edit.addEventListener('click', () => openHelper(h));
  bottom.append(edit);
  card.append(toggle, bottom);
  if (moveIndex >= 0) card.append(element('span', 'move-badge', String(moveIndex + 1)));
  card.addEventListener('dragstart', e => { draggingId = h.id; e.dataTransfer.setData('text/plain', h.id); e.dataTransfer.effectAllowed = 'move'; });
  card.addEventListener('dragend', () => { draggingId = null; document.querySelectorAll('.drag-over').forEach(c => c.classList.remove('drag-over')); });
  return card;
}
function renderPlan() {
  const plan = $('plan');
  plan.replaceChildren(element('p', 'plan-label', result ? '02 / THE REPAIR PLAN' : '02 / READY WHEN YOU ARE'));
  if (!result) {
    plan.append(element('h3', '', 'Keep the good assignments. Fix the gaps.'));
    plan.append(element('p', 'hint', 'Mark who’s absent, then find the smallest fix. You’ll see each move in order, why it works, and any post that still needs help.'));
    plan.append(element('p', 'hint', 'Each helper covers one post. Bringing a floating helper onto a post also counts as a move.'));
    return;
  }
  const title = result.complete ? result.changes ? `${result.changes} ${result.changes === 1 ? 'move' : 'moves'}. Every post covered.` : 'All covered. No moves needed.' : `Partial plan · ${result.covered}/${result.required} places covered`;
  plan.append(element('h3', `result-status${result.complete ? '' : ' incomplete'}`, title));
  result.uncovered.forEach(u => plan.append(element('p', 'shortage', u.reason)));
  const list = element('ol', 'move-list');
  result.moves.forEach((move, index) => {
    const li = element('li');
    li.append(element('span', 'step', String(index + 1)));
    const detail = element('div');
    detail.append(element('strong', '', `${move.name}: ${move.from} → ${move.to}`), element('p', 'move-detail', move.reason));
    li.append(detail);
    list.append(li);
  });
  plan.append(list);
  if (!result.moves.length) plan.append(element('p', 'hint', result.complete ? 'Everyone available can stay where they are.' : 'Keep the remaining assignments. No reassignment can cover more required places.'));
  if (result.naive) plan.append(element('p', 'naive', `WHY ONE MOVE WON’T DO IT — ${result.naive}`));
}
function render() {
  renderBoard();
  renderPlan();
  const absent = state.helpers.filter(h => h.absent).length;
  const missing = C.coverage(state.posts, state.helpers, result && result.assignment).reduce((n, p) => n + p.missing, 0);
  $('summary').textContent = `${state.helpers.length - absent} available · ${absent} absent · ${missing} uncovered ${missing === 1 ? 'place' : 'places'}`;
  ['csv', 'png', 'copy'].forEach(id => { $(id).disabled = !result || animating; });
  ['solve', 'load', 'reset', 'requirements', 'preset'].forEach(id => { $(id).disabled = animating; });
  $('add').disabled = state.helpers.length >= 10 || animating;
  $('add').title = state.helpers.length >= 10 ? 'This board supports up to 10 helpers.' : 'Add a helper';
}

async function findFix() {
  if (animating) return;
  const before = new Map([...document.querySelectorAll('.helper-card')].map(card => [card.dataset.helperId, card.getBoundingClientRect()]));
  try { result = C.solve(state.posts, state.helpers); } catch (error) { notify(error.message); return; }
  animating = true;
  render();
  const changedCards = [];
  document.querySelectorAll('.helper-card').forEach(card => {
    const old = before.get(card.dataset.helperId);
    const rect = card.getBoundingClientRect();
    if (!old || (old.x === rect.x && old.y === rect.y)) return;
    card.style.transition = 'none';
    card.style.transform = `translate(${old.x - rect.x}px, ${old.y - rect.y}px)`;
    card.style.zIndex = '3';
    changedCards.push(card);
  });
  // FLIP: actual DOM destinations with a short transition from the old positions.
  void $('board').offsetWidth;
  requestAnimationFrame(() => {
    changedCards.forEach(card => { card.style.transition = 'transform 420ms cubic-bezier(.22,.8,.3,1)'; card.style.transform = ''; });
    setTimeout(() => {
      animating = false;
      render();
      notify(result.complete ? 'Plan ready. Numbered tags match the move list; exports use this plan.' : 'Best partial plan ready. Exports include the uncovered-post warning.');
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450);
  });
}

function openHelper(helper) {
  editingId = helper ? helper.id : null;
  $('helper-title').textContent = helper ? `Edit ${helper.name}` : 'Add helper';
  $('helper-name').value = helper ? helper.name : '';
  $('helper-error').textContent = '';
  $('skill-options').replaceChildren();
  state.posts.forEach((p, index) => {
    const label = element('label');
    const checkbox = element('input');
    checkbox.type = 'checkbox'; checkbox.value = p.name; checkbox.name = 'skills'; checkbox.id = `skill-${index}`;
    checkbox.checked = Boolean(helper && helper.skills.includes(p.name));
    label.append(checkbox, document.createTextNode(p.name));
    $('skill-options').append(label);
  });
  $('helper-post').replaceChildren();
  [C.FLOATING, ...state.posts.map(p => p.name)].forEach(name => {
    const option = element('option', '', name === C.FLOATING ? 'Floating' : name);
    option.value = name;
    $('helper-post').append(option);
  });
  $('helper-post').value = helper ? helper.current : C.FLOATING;
  $('helper-dialog').showModal();
  $('helper-name').focus();
}
$('helper-form').addEventListener('submit', event => {
  event.preventDefault();
  const name = $('helper-name').value.trim();
  const skills = [...$('skill-options').querySelectorAll('input:checked')].map(input => input.value);
  const current = $('helper-post').value;
  if (!name) { $('helper-error').textContent = 'Enter a name.'; return; }
  if (state.helpers.some(h => h.id !== editingId && h.name.toLowerCase() === name.toLowerCase())) { $('helper-error').textContent = 'Use a different name so each helper is easy to identify.'; return; }
  if (current !== C.FLOATING && !skills.includes(current)) { $('helper-error').textContent = `Choose the ${current} skill or set the current post to Floating.`; return; }
  if (editingId) Object.assign(state.helpers.find(h => h.id === editingId), { name, skills, current });
  else if (state.helpers.length < 10) state.helpers.push({ id: `custom-${nextId++}`, name, skills, current, absent: false });
  $('helper-dialog').close();
  invalidate();
});
$('requirements').addEventListener('click', () => {
  $('needs-options').replaceChildren();
  state.posts.forEach((post, index) => {
    const row = element('div', 'need-row');
    const label = element('label', '', post.name); label.htmlFor = `need-${index}`;
    const input = element('input'); input.type = 'number'; input.id = `need-${index}`; input.min = '0'; input.max = '10'; input.step = '1'; input.required = true; input.value = post.required;
    row.append(label, input); $('needs-options').append(row);
  });
  $('needs-dialog').showModal();
});
$('needs-form').addEventListener('submit', e => {
  e.preventDefault();
  state.posts.forEach((post, index) => { post.required = Number($(`need-${index}`).value); });
  $('needs-dialog').close(); invalidate();
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('add').addEventListener('click', () => openHelper(null));
$('solve').addEventListener('click', findFix);
function loadPreset() { state = C.preset($('preset').value); result = null; render(); notify('School festival preset loaded. Click any tag to change attendance.'); }
$('load').addEventListener('click', loadPreset);
$('reset').addEventListener('click', () => { $('preset').value = 'haru'; loadPreset(); notify('Reset to School festival with Haru absent.'); });

function rosterText() {
  const lines = [APP_NAME + ' — School festival', result.complete ? 'All required posts covered.' : `PARTIAL PLAN: ${result.covered}/${result.required} required places covered.`];
  result.uncovered.forEach(u => lines.push(u.reason));
  state.posts.forEach(p => lines.push(`${p.name} (${p.required} needed): ${state.helpers.filter(h => !h.absent && result.assignment[h.id] === p.name).map(h => h.name).join(', ') || '—'}`));
  lines.push('Floating: ' + (state.helpers.filter(h => !h.absent && result.assignment[h.id] === C.FLOATING).map(h => h.name).join(', ') || '—'));
  lines.push('Absent: ' + (state.helpers.filter(h => h.absent).map(h => h.name).join(', ') || '—'));
  if (result.moves.length) lines.push('', 'Moves:', ...result.moves.map((m, i) => `${i + 1}. ${m.text}`));
  return lines.join('\n');
}
function download(blob, suffix) {
  const url = URL.createObjectURL(blob);
  const a = element('a'); a.href = url; a.download = `${APP_NAME.toLowerCase().replace(/\s+/g, '-')}-roster.${suffix}`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify(`Roster ${suffix.toUpperCase()} download prepared.`);
}
$('csv').addEventListener('click', () => {
  let text = C.csv(state.posts, state.helpers, result.assignment);
  text += '\r\n\r\n"Plan status","' + (result.complete ? 'All required posts covered' : 'PARTIAL PLAN') + '"';
  const quote = s => '"' + s.replace(/"/g, '""') + '"';
  state.posts.forEach(p => {
    const count = C.coverage(state.posts, state.helpers, result.assignment).find(item => item.name === p.name);
    text += '\r\n' + ['Post coverage', p.name, `${count.count}/${p.required} staffed`, `${count.missing} uncovered`].map(quote).join(',');
  });
  result.uncovered.forEach(u => { text += '\r\n"Uncovered post",' + quote(u.reason); });
  download(new Blob([text], { type: 'text/csv;charset=utf-8' }), 'csv');
});
$('copy').addEventListener('click', async () => {
  const text = rosterText();
  try {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text); notify('Roster copied. Ready to send to your team.');
  } catch (_) { $('copy-text').value = text; $('copy-dialog').showModal(); $('copy-text').focus(); $('copy-text').select(); }
});
$('png').addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) { notify('Canvas is unavailable in this browser. Use CSV or text export.'); return; }
  const width = 1200;
  // Measure and wrap every line before sizing, so longer names and partial plans are not clipped.
  ctx.font = '20px system-ui, sans-serif';
  const lines = [];
  rosterText().split('\n').slice(1).forEach(paragraph => {
    let line = '';
    for (const char of paragraph) {
      if (ctx.measureText(line + char).width > width - 120) { lines.push(line); line = ''; }
      line += char;
    }
    lines.push(line);
  });
  canvas.width = width; canvas.height = Math.max(650, 180 + lines.length * 34);
  ctx.fillStyle = '#f4f0e5'; ctx.fillRect(0, 0, width, canvas.height);
  ctx.fillStyle = '#292c26'; ctx.font = 'bold 44px system-ui, sans-serif'; ctx.fillText(APP_NAME, 54, 76);
  ctx.font = '14px system-ui, sans-serif'; ctx.fillText('SCHOOL FESTIVAL / NEW DUTY ROSTER', 56, 108);
  ctx.fillRect(56, 126, width - 112, 2);
  ctx.font = '20px system-ui, sans-serif';
  lines.forEach((line, index) => { ctx.fillStyle = index === 0 ? (result.complete ? '#285b43' : '#a3382b') : '#292c26'; ctx.fillText(line, 56, 166 + index * 34); });
  canvas.toBlob(blob => { if (blob) download(blob, 'png'); else notify('Image export failed. Use CSV or text export.'); }, 'image/png');
});
render();
