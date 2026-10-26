/* Pure, dependency-free logic. A classic script also works with file:// URLs. */
(function (root) {
  'use strict';
  const FLOATING = 'floating';
  const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
  const byName = (a, b) => compare(a.name.toLowerCase(), b.name.toLowerCase()) || compare(a.name, b.name) || compare(a.id, b.id);
  function preset(scenario = 'haru') {
    return {
      posts: ['Reception', 'Guide', 'Stage', 'Kitchen', 'First aid'].map(name => ({ name, required: 1 })),
      helpers: [
        { id: 'haru', name: 'Haru', skills: ['Reception'], current: 'Reception' },
        { id: 'ken', name: 'Ken', skills: ['Reception', 'Guide'], current: 'Guide' },
        { id: 'sora', name: 'Sora', skills: ['Stage', 'Kitchen'], current: 'Stage' },
        { id: 'yui', name: 'Yui', skills: ['Kitchen', 'Stage'], current: 'Kitchen' },
        { id: 'aiko', name: 'Aiko', skills: ['First aid', 'Kitchen'], current: 'First aid' },
        { id: 'mina', name: 'Mina', skills: ['Guide'], current: FLOATING },
        { id: 'ren', name: 'Ren', skills: ['Stage', 'Kitchen'], current: FLOATING }
      ].map(h => ({ ...h, absent: h.id === scenario }))
    };
  }
  function validate(posts, helpers) {
    if (!posts.length || posts.length > 6 || helpers.length > 10) throw new Error('Use 1–6 posts and at most 10 helpers.');
    const names = posts.map(p => p.name);
    if (new Set(names).size !== names.length || names.includes(FLOATING)) throw new Error('Post names must be unique.');
    if (posts.some(p => !p.name || !Number.isInteger(p.required) || p.required < 0 || p.required > 10)) throw new Error('Each post needs 0–10 people.');
    if (new Set(helpers.map(h => h.id)).size !== helpers.length) throw new Error('Helper IDs must be unique.');
    if (helpers.some(h => typeof h.id !== 'string' || !h.name.trim() || !Array.isArray(h.skills) || h.skills.some(s => !names.includes(s)) || (h.current !== FLOATING && !names.includes(h.current)))) throw new Error('Check helper names, skills and current posts.');
  }
  function coverage(posts, helpers, assignment) {
    return posts.map(p => {
      const count = helpers.filter(h => !h.absent && (assignment ? assignment[h.id] : h.current) === p.name && h.skills.includes(p.name)).length;
      return { ...p, count, missing: Math.max(0, p.required - count) };
    });
  }
  function better(a, b) {
    return !b || a.changes < b.changes || (a.changes === b.changes && (a.floatingUsed < b.floatingUsed || (a.floatingUsed === b.floatingUsed && a.key < b.key)));
  }
  function shortage(post, posts, helpers) {
    const skilled = helpers.filter(h => h.skills.includes(post.name)).sort(byName);
    const available = skilled.filter(h => !h.absent);
    const prefix = `${post.name} cannot be ${post.required > 1 ? 'fully ' : ''}covered: `;
    if (!skilled.length) return prefix + `no helper has the ${post.name} skill.`;
    if (!available.length) return prefix + (skilled.length === 1 ? `only ${skilled[0].name} can do ${post.name} and ${skilled[0].name} is absent.` : `all qualified helpers (${skilled.map(h => h.name).join(', ')}) are absent.`);
    // Hall's condition supplies a concrete staffing bottleneck, including shared skills.
    const active = helpers.filter(h => !h.absent).sort(byName);
    const groups = [];
    for (let mask = 1; mask < 1 << posts.length; mask++) {
      const group = posts.filter((p, i) => mask & (1 << i));
      if (!group.includes(post)) continue;
      const need = group.reduce((n, p) => n + p.required, 0);
      const people = active.filter(h => group.some(p => h.skills.includes(p.name)));
      if (people.length < need) groups.push({ group, need, people });
    }
    groups.sort((a, b) => a.group.length - b.group.length);
    const g = groups[0];
    if (g) return prefix + `${g.group.map(p => p.name).join(' + ')} need ${g.need} ${g.need === 1 ? 'person' : 'people'}, but only ${g.people.length} available (${g.people.map(h => h.name).join(', ')}) can cover these posts. One person can cover only one post.`;
    return prefix + 'available skills overlap with other required posts.';
  }
  function explainMoves(posts, helpers, assignment) {
    const live = Object.fromEntries(helpers.filter(h => !h.absent).map(h => [h.id, h.current]));
    const pending = helpers.filter(h => !h.absent && h.current !== assignment[h.id]).sort(byName);
    const leftBy = {};
    const moves = [];
    while (pending.length) {
      const counts = coverage(posts, helpers, live);
      let index = pending.findIndex(h => counts.some(p => p.name === assignment[h.id] && p.missing > 0));
      if (index < 0) index = 0;
      const h = pending.splice(index, 1)[0];
      const to = assignment[h.id];
      const destination = counts.find(p => p.name === to);
      let reason;
      if (to === FLOATING) reason = 'required posts are covered; available as backup';
      else if (leftBy[to]) reason = `${to} was left ${destination.required > 1 ? 'short' : 'empty'} by ${leftBy[to]}'s move`;
      else if (destination.missing) reason = `${to} was ${destination.count ? 'short-staffed' : 'empty'}; ${h.name} can do ${to}`;
      else reason = `${h.name} can do ${to}; coordinated reassignment`;
      live[h.id] = to;
      const oldPost = coverage(posts, helpers, live).find(p => p.name === h.current);
      if (oldPost && oldPost.missing) leftBy[h.current] = h.name;
      moves.push({ id: h.id, name: h.name, from: h.current, to, reason, text: `${h.name}: ${h.current} -> ${to} (${reason})` });
    }
    return moves;
  }
  function solve(posts, helpers) {
    validate(posts, helpers);
    const active = helpers.filter(h => !h.absent).sort(byName);
    // Dynamic programming exhausts assignments, merging equivalent capped coverage states.
    let states = new Map([['0,'.repeat(posts.length), { counts: posts.map(() => 0), changes: 0, floatingUsed: 0, key: '', assignment: {} }]]);
    for (const h of active) {
      const next = new Map();
      const choices = posts.map((p, i) => h.skills.includes(p.name) ? i : -1).filter(i => i >= 0).concat(-1);
      for (const state of states.values()) for (const index of choices) {
        const to = index < 0 ? FLOATING : posts[index].name;
        const counts = state.counts.slice();
        if (index >= 0) counts[index] = Math.min(posts[index].required, counts[index] + 1);
        const candidate = {
          counts, changes: state.changes + Number(to !== h.current),
          floatingUsed: state.floatingUsed + Number(h.current === FLOATING && to !== FLOATING),
          key: state.key + String(index < 0 ? posts.length : index),
          assignment: { ...state.assignment, [h.id]: to }
        };
        const key = counts.join(',');
        if (better(candidate, next.get(key))) next.set(key, candidate);
      }
      states = next;
    }
    let best;
    let covered = -1;
    for (const candidate of states.values()) {
      const total = candidate.counts.reduce((a, b) => a + b, 0);
      if (total > covered || (total === covered && better(candidate, best))) { best = candidate; covered = total; }
    }
    const required = posts.reduce((n, p) => n + p.required, 0);
    const uncovered = posts.filter((p, i) => best.counts[i] < p.required).map(p => ({ post: p.name, missing: p.required - best.counts[posts.indexOf(p)], reason: shortage(p, posts, helpers) }));
    const moves = explainMoves(posts, helpers, best.assignment);
    const initial = coverage(posts, helpers);
    let naive = '';
    if (initial.some(p => p.missing) && (covered < required || best.changes > 1)) {
      const hole = initial.find(p => p.missing);
      const candidates = active.filter(h => h.current !== hole.name && h.skills.includes(hole.name));
      if (candidates.length === 1) {
        const h = candidates[0];
        const source = initial.find(p => p.name === h.current);
        if (source && source.count <= source.required && source.required > 0) naive = `Moving the only available ${hole.name}-capable person, ${h.name}, would ${source.count === 1 ? 'empty' : 'leave a gap at'} ${source.name}.`;
      }
      if (!naive) naive = covered < required ? 'No one-change fix can cover every post: the staffing shortage remains even in the best plan.' : `No one-change fix covers every post. The smallest complete fix changes ${best.changes} helpers.`;
    }
    return { assignment: best.assignment, changes: best.changes, floatingUsed: best.floatingUsed, covered, required, complete: covered === required, uncovered, moves, naive };
  }
  function rosterRows(posts, helpers, assignment) {
    return helpers.slice().sort(byName).map(h => [h.name, h.absent ? 'Absent' : 'Available', h.current, h.absent ? 'Absent' : (assignment ? assignment[h.id] : h.current), h.skills.join('; ')]);
  }
  function csv(posts, helpers, assignment) {
    const safe = value => '"' + (/^[=+@\-\t\r\n]/.test(value) ? "'" + value : value).replace(/"/g, '""') + '"';
    return '\uFEFF' + [['Name', 'Status', 'Original post', 'New post', 'Skills'], ...rosterRows(posts, helpers, assignment)].map(row => row.map(safe).join(',')).join('\r\n');
  }
  root.ShiftCore = { FLOATING, preset, solve, coverage, csv, rosterRows };
})(typeof globalThis !== 'undefined' ? globalThis : this);
