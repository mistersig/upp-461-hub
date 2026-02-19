/* UPP 461 — Week 5 app.js
   Theme toggle • bug report • image lightbox • quiz grader
   Week 5 interactives: SQL/where-clause builder + join troubleshooting
*/
(function () {
  'use strict';
  const qs = (sel, root) => (root || document).querySelector(sel);
  const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function escapeHtml(str){
    return (str || '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  // ---- Theme ----
  function initTheme(){
    const btn = qs('[data-theme-toggle]');
    const label = qs('[data-theme-label]');
    if(!btn || !label) return;

    function getTheme(){
      try { return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'; }
      catch(e){ return 'light'; }
    }
    function setTheme(t){
      const theme = (t === 'dark') ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('theme', theme); } catch(e){}
      label.textContent = theme === 'dark' ? 'Dark' : 'Light';
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
    setTheme(getTheme());
    btn.addEventListener('click', () => setTheme(getTheme() === 'dark' ? 'light' : 'dark'));
  }

  // ---- Bug report ----
  function initBugReport(){
    qsa('[data-bug-report]').forEach(a => {
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        const subject = 'UPP 461 — Week 5 bug report';
        const body = [
          'Week 5 — Attribute tables, queries, and joins',
          '',
          'Page URL:',
          location.href,
          '',
          'What happened?',
          '- ',
          '',
          'What did you expect?',
          '- ',
          '',
          'Steps to reproduce:',
          '1) ',
          '2) ',
          '',
          'Browser / device:',
          '- '
        ].join('\n');
        location.href = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      });
    });
  }

  // ---- Lightbox for zoomable images ----
  function initLightbox(){
    const imgs = qsa('img.zoomable');
    if(!imgs.length) return;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.hidden = true;
    overlay.innerHTML = [
      '<div class="lightbox-inner" role="dialog" aria-modal="true" aria-label="Image preview">',
      '  <button class="lightbox-close" type="button" aria-label="Close image preview">×</button>',
      '  <img class="lightbox-img" alt=""/>',
      '  <div class="lightbox-cap small" aria-live="polite"></div>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);

    const btnClose = qs('.lightbox-close', overlay);
    const imgEl = qs('.lightbox-img', overlay);
    const capEl = qs('.lightbox-cap', overlay);
    let lastFocus = null;

    function open(src, alt, cap){
      lastFocus = document.activeElement;
      imgEl.src = src;
      imgEl.alt = alt || '';
      capEl.textContent = cap || alt || '';
      overlay.hidden = false;
      document.body.style.overflow = 'hidden';
      btnClose.focus();
    }
    function close(){
      overlay.hidden = true;
      document.body.style.overflow = '';
      imgEl.src = '';
      imgEl.alt = '';
      capEl.textContent = '';
      if(lastFocus && lastFocus.focus) lastFocus.focus();
    }

    btnClose.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if(e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => {
      if(overlay.hidden) return;
      if(e.key === 'Escape') close();
    });

    imgs.forEach(img => {
      img.tabIndex = 0;
      img.setAttribute('role','button');
      img.setAttribute('aria-label', img.alt ? ('Enlarge image: ' + img.alt) : 'Enlarge image');

      const handler = () => {
        let cap = '';
        const fig = img.closest('figure');
        if(fig){
          const fc = qs('figcaption', fig);
          if(fc) cap = fc.textContent || '';
        }
        open(img.getAttribute('src'), img.alt, cap);
      };

      img.addEventListener('click', handler);
      img.addEventListener('keydown', (e) => {
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); handler(); }
      });
    });
  }

  // ---- Quiz ----
  function initQuiz(){
    const form = qs('form[data-quiz]');
    if(!form) return;
    const feedback = qs('[data-feedback]', form);
    const live = qs('[data-live]', form);
    const announce = (msg) => { if(live) live.textContent = msg; };

    function clear(){
      if(feedback) feedback.innerHTML = '';
      qsa('fieldset[data-question]', form).forEach(fs => {
        fs.classList.remove('correct','incorrect');
        qsa('[data-result]', fs).forEach(el => el.remove());
      });
    }
    function make(kind, html){
      const div = document.createElement('div');
      div.className = 'notice ' + kind;
      div.setAttribute('data-result','');
      div.innerHTML = html;
      return div;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clear();
      const questions = qsa('fieldset[data-question]', form);
      const total = questions.length;
      let correct = 0;
      let unanswered = 0;

      questions.forEach(fs => {
        const ans = (fs.getAttribute('data-answer') || '').trim();
        const chosen = qs('input[type="radio"]:checked', fs);
        if(!chosen){
          unanswered++;
          fs.classList.add('incorrect');
          fs.appendChild(make('warn','<strong>Not answered.</strong> Pick an option.'));
          return;
        }
        const v = (chosen.value || '').trim();
        const whyC = qs('[data-why-correct]', fs);
        const whyW = qs('[data-why-wrong]', fs);

        if(v === ans){
          correct++;
          fs.classList.add('correct');
          fs.appendChild(make('good','<strong>Correct.</strong> ' + escapeHtml(whyC ? whyC.textContent : '')));
        } else {
          fs.classList.add('incorrect');
          fs.appendChild(make('bad','<strong>Not quite.</strong> ' + escapeHtml(whyW ? whyW.textContent : '') +
            ' <span class="small">Correct answer: <strong>' + escapeHtml(ans.toUpperCase()) + '</strong>.</span>'));
        }
      });

      const pct = total ? Math.round((correct/total)*100) : 0;
      const cls = (pct >= 80) ? 'good' : (pct >= 60) ? 'warn' : 'bad';
      if(feedback){
        feedback.innerHTML = '<div class="notice ' + cls + '"><strong>Score:</strong> ' + correct + '/' + total + ' (' + pct + '%).' +
          (unanswered ? ' <span class="small">Unanswered: ' + unanswered + '.</span>' : '') + '</div>';
      }
      announce('Quiz graded. Score ' + correct + ' out of ' + total + '.');
    });

    const resetBtn = qs('[data-reset]', form);
    if(resetBtn){
      resetBtn.addEventListener('click', () => {
        form.reset(); clear(); announce('Quiz cleared.');
      });
    }
  }

  // ---- SQL / where clause demo ----
  function initSqlDemo(){
    const root = qs('#sql-demo');
    if(!root) return;

    const fieldA = qs('#sql-field-a', root);
    const opA = qs('#sql-op-a', root);
    const valA = qs('#sql-val-a', root);

    const logic = qs('#sql-logic', root);
    const fieldB = qs('#sql-field-b', root);
    const opB = qs('#sql-op-b', root);
    const valB = qs('#sql-val-b', root);

    const outExpr = qs('[data-sql-expression]', root);
    const outRes = qs('[data-sql-results]', root);
    const btnRun = qs('[data-sql-run]', root);
    const btnReset = qs('[data-sql-reset]', root);

    const data = [
      {ID:'001', COUNTYFP:'031', STATEFP:'17', POP: 5200,  MED_AGE: 34.2, NAME:'Cook Tract A'},
      {ID:'002', COUNTYFP:'031', STATEFP:'17', POP:12000,  MED_AGE: 29.8, NAME:'Cook Tract B'},
      {ID:'003', COUNTYFP:'043', STATEFP:'17', POP: 8000,  MED_AGE: 40.1, NAME:'DuPage Sample'},
      {ID:'004', COUNTYFP:'031', STATEFP:'17', POP: 3000,  MED_AGE: 41.5, NAME:'Cook Tract C'},
      {ID:'005', COUNTYFP:'031', STATEFP:'17', POP:15000,  MED_AGE: 27.5, NAME:'Cook Central'},
      {ID:'006', COUNTYFP:'093', STATEFP:'17', POP: 9500,  MED_AGE: 36.6, NAME:'Kane Sample'},
      {ID:'007', COUNTYFP:'031', STATEFP:'18', POP: 4000,  MED_AGE: 33.0, NAME:'Not Illinois'}
    ];

    function isNumberField(field){ return typeof data[0][field] === 'number'; }

    function fmtValue(field, raw){
      const s = String(raw || '').trim();
      if(!s) return '';
      if(isNumberField(field)) return s;
      return "'" + s.replaceAll("'","''") + "'";
    }

    function evalCond(rec, field, op, raw){
      const s = String(raw || '').trim();
      if(!s) return false;
      const v = rec[field];
      if(typeof v === 'undefined') return false;

      if(op === 'LIKE'){
        return String(v).toLowerCase().includes(s.toLowerCase());
      }
      if(typeof v === 'number'){
        const n = Number(s);
        if(!Number.isFinite(n)) return false;
        if(op === '=') return v === n;
        if(op === '!=') return v !== n;
        if(op === '>') return v > n;
        if(op === '>=') return v >= n;
        if(op === '<') return v < n;
        if(op === '<=') return v <= n;
        return false;
      } else {
        const a = String(v).toLowerCase();
        const b = s.toLowerCase();
        if(op === '=') return a === b;
        if(op === '!=') return a !== b;
        if(op === '>') return a > b;
        if(op === '>=') return a >= b;
        if(op === '<') return a < b;
        if(op === '<=') return a <= b;
        return false;
      }
    }

    function run(){
      const aField = fieldA.value;
      const aOp = opA.value;
      const aVal = valA.value;

      let expr = aField + ' ' + aOp + ' ' + fmtValue(aField, aVal);

      const hasB = fieldB && fieldB.value;
      if(hasB){
        expr += ' ' + (logic ? logic.value : 'AND') + ' ' + fieldB.value + ' ' + opB.value + ' ' + fmtValue(fieldB.value, valB.value);
      }

      const matches = data.filter(rec => {
        const okA = evalCond(rec, aField, aOp, aVal);
        if(!hasB) return okA;
        const okB = evalCond(rec, fieldB.value, opB.value, valB.value);
        return (logic && logic.value === 'OR') ? (okA || okB) : (okA && okB);
      });

      outExpr.innerHTML = '<div class="mono">WHERE ' + escapeHtml(expr) + '</div>';
      if(!matches.length){
        outRes.innerHTML = '<div class="notice warn"><strong>0 matches.</strong> Try relaxing the query or switching AND ↔ OR.</div>';
        return;
      }
      const ids = matches.map(r => r.ID).join(', ');
      const preview = matches.slice(0,4).map(r => (r.ID + ' — COUNTYFP ' + r.COUNTYFP + ', STATEFP ' + r.STATEFP + ', POP ' + r.POP)).join('<br/>');
      outRes.innerHTML = '<div class="notice good"><strong>Matched:</strong> ' + matches.length + '/' + data.length +
        ' records. <span class="small">IDs: ' + escapeHtml(ids) + '</span></div>' +
        '<div class="small" style="margin-top:.5rem;">' + preview + (matches.length>4 ? '<br/><span class="small">…and more</span>' : '') + '</div>';
    }

    function reset(){
      fieldA.value = 'COUNTYFP';
      opA.value = '=';
      valA.value = '031';
      if(logic) logic.value = 'AND';
      if(fieldB) fieldB.value = '';
      if(opB) opB.value = '=';
      if(valB) valB.value = '';
      outExpr.textContent = '';
      outRes.innerHTML = '<div class="notice">Choose conditions, then click <strong>Run</strong>.</div>';
    }

    btnRun && btnRun.addEventListener('click', run);
    btnReset && btnReset.addEventListener('click', reset);
    reset();
  }

  // ---- Join troubleshooting demo ----
  function initJoinDemo(){
    const root = qs('#join-demo');
    if(!root) return;
    const scenario = qs('#join-scenario', root);
    const btn = qs('[data-join-run]', root);
    const out = qs('[data-join-result]', root);
    if(!scenario || !btn || !out) return;

    function show(html){ out.innerHTML = html; }
    function run(){
      const v = scenario.value;
      if(v === 'clean'){
        show('<div class="notice good"><strong>Clean keys:</strong> 100% match.</div><div class="small">Same type and same formatting on both sides.</div>');
      } else if(v === 'leadingZeros'){
        show('<div class="notice warn"><strong>Leading zeros:</strong> many joins fail.</div><div class="small">Mismatch: <span class="mono">031</span> vs <span class="mono">31</span>. Store as <strong>text</strong> and pad zeros.</div>');
      } else if(v === 'dupes'){
        show('<div class="notice warn"><strong>Duplicates:</strong> results can multiply rows.</div><div class="small">Aggregate first or use a <strong>relate</strong> for one-to-many.</div>');
      } else if(v === 'whitespace'){
        show('<div class="notice warn"><strong>Hidden spaces:</strong> values look the same but don’t match.</div><div class="small">Trim/clean, then re-join.</div>');
      } else {
        show('<div class="notice">Pick a scenario, then click <strong>Show result</strong>.</div>');
      }
    }
    btn.addEventListener('click', run);
    run();
  }

  function init(){
    initTheme();
    initBugReport();
    initLightbox();
    initQuiz();
    initSqlDemo();
    initJoinDemo();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();