/* UPP 461 — Week 1 app.js
   Theme toggle • bug report • image lightbox • quiz grader
   Week 1 interactives: Tobler slider • GIS use picker • file naming rules checker
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
    const links = qsa('[data-bug-report]');
    if(!links.length) return;

    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        const subject = 'UPP 461 module bug report';
        const page = location.pathname.split('/').slice(-2).join('/');
        const body = [
          'Issue summary:',
          '',
          'Steps to reproduce:',
          '1) ',
          '2) ',
          '',
          'Expected:',
          '',
          'Actual:',
          '',
          'Page: ' + page,
          'Screenshot link (optional):',
          '',
          'Browser / device:',
          '- '
        ].join('\n');

        location.href = 'mailto:REPLACE_EMAIL?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      });
    });
  }

  // ---- Lightbox (legacy .lightbox*) ----
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
        const ans = fs.getAttribute('data-answer');
        const chosen = qs('input[type="radio"]:checked', fs);
        if(!chosen){ unanswered += 1; }
        const chosenVal = chosen ? chosen.value : null;

        const whyCorrect = (qs('[data-why-correct]', fs) || {}).textContent || '';
        const whyWrong = (qs('[data-why-wrong]', fs) || {}).textContent || '';

        if(chosenVal === ans){
          correct += 1;
          fs.classList.add('correct');
          fs.appendChild(make('good', '<strong>Correct.</strong> ' + escapeHtml(whyCorrect)));
        } else {
          fs.classList.add('incorrect');
          const correctLabel = qs('input[value="' + ans + '"]', fs);
          const correctText = correctLabel && correctLabel.parentElement ? correctLabel.parentElement.textContent.trim() : ans;
          fs.appendChild(make('warn',
            '<strong>Not quite.</strong> ' +
            (chosen ? '' : '<div class="small">You left this one blank.</div>') +
            '<div class="small"><strong>Correct answer:</strong> ' + escapeHtml(correctText) + '</div>' +
            '<div class="small">' + escapeHtml(whyWrong || '') + '</div>'
          ));
        }
      });

      const score = Math.round((correct / total) * 100);
      const msg = 'Score: ' + correct + '/' + total + ' (' + score + '%)' + (unanswered ? (' — ' + unanswered + ' unanswered') : '');
      if(feedback){
        const sum = document.createElement('div');
        sum.className = 'notice';
        sum.innerHTML = '<strong>' + escapeHtml(msg) + '</strong> <span class="small">Review the explanations below.</span>';
        feedback.prepend(sum);
      }
      announce('Quiz graded. ' + msg);
      const top = qs('[data-feedback]', form);
      if(top && top.scrollIntoView) top.scrollIntoView({behavior:'smooth', block:'start'});
    });

    const resetBtn = qs('[data-reset]', form);
    if(resetBtn){
      resetBtn.addEventListener('click', () => {
        form.reset(); clear(); announce('Quiz cleared.');
      });
    }
  }

  // ---------------- Week 1 interactives ----------------

  // Tobler slider: distance -> "relatedness" curve (illustrative)
  function initToblerSlider(){
    qsa('[data-tobler]').forEach(root => {
      const slider = qs('input[type="range"]', root);
      const out = qs('[data-tobler-out]', root);
      const label = qs('[data-tobler-distance]', root);
      if(!slider || !out || !label) return;

      function update(){
        const km = Number(slider.value);
        label.textContent = km + ' km';
        // simple exponential decay (illustrative)
        const rel = Math.exp(-km/25);
        const pct = Math.round(rel * 100);
        out.className = 'notice ' + (pct > 60 ? 'good' : (pct > 30 ? 'warn' : 'bad'));
        out.innerHTML = '<strong>Illustrative “relatedness”:</strong> ' + pct + '%'
          + '<div class="small">Not a law of physics—just a rule of thumb: nearby things tend to be more similar/connected.</div>';
      }

      slider.addEventListener('input', update);
      update();
    });
  }

  // GIS use picker: communicative vs analytical (selects with data-correct)
  function initMiniUseQuiz(){
    qsa('[data-mini-quiz]').forEach(root => {
      const btn = qs('[data-mini-grade]', root);
      const out = qs('[data-mini-score]', root);
      const selects = qsa('select[data-correct]', root);
      if(!btn || !selects.length) return;

      // Reset any browser-restored values so answers are NOT pre-checked on load.
      selects.forEach(sel => { sel.value = 'choose'; });

      // Clear any feedback on load (don’t reveal answers until the student clicks “Check answers”).
      selects.forEach(sel => {
        const item = sel.closest('.mini-item');
        const fb = item ? qs('[data-mini-feedback]', item) : null;
        if(fb){
          fb.className = 'small';
          fb.textContent = '';
        }
      });
      if(out) out.textContent = 'Make your selections, then press “Check answers”.';

      function grade(){
        let correct = 0;
        let answered = 0;

        selects.forEach(sel => {
          const item = sel.closest('.mini-item');
          const fb = item ? qs('[data-mini-feedback]', item) : null;
          const want = sel.getAttribute('data-correct');
          const got = sel.value;
          const isAnswered = got && got !== 'choose';
          if(isAnswered) answered += 1;

          if(!fb) return;

          if(!isAnswered){
            fb.className = 'notice warn';
            fb.innerHTML = '<strong>↺</strong> Choose an option first.';
            return;
          }

          const ok = got === want;
          if(ok) correct += 1;

          fb.className = 'notice ' + (ok ? 'good' : 'warn');
          fb.innerHTML = ok
            ? '<strong>✔</strong> Nice.'
            : ('<strong>✖</strong> Best choice: <strong>' + escapeHtml(want) + '</strong>. ' + escapeHtml(sel.getAttribute('data-why') || ''));
        });

        if(out){
          out.textContent = 'Mini score: ' + correct + '/' + selects.length
            + (answered < selects.length ? (' (answered ' + answered + ')') : '');
        }
      }

      // If the student changes an answer after grading, clear that row’s feedback and prompt to re-check.
      selects.forEach(sel => {
        sel.addEventListener('change', () => {
          const item = sel.closest('.mini-item');
          const fb = item ? qs('[data-mini-feedback]', item) : null;
          if(fb){
            fb.className = 'small';
            fb.textContent = '';
          }
          if(out) out.textContent = 'Selections updated — press “Check answers”.';
        });
      });

      btn.addEventListener('click', grade);
    });
  }

  // File naming rules validator
  function initNameChecker(){
    qsa('[data-name-checker]').forEach(root => {
      const inp = qs('input[type="text"]', root);
      const btn = qs('[data-check]', root);
      const out = qs('[data-output]', root);
      if(!inp || !btn || !out) return;

      // Rules (ArcGIS-friendly):
      // - no spaces (underscores OK)
      // - no special characters except underscore
      // - begin with letter
      // - applies to path segments
      const badChars = /[^A-Za-z0-9_\\\/:-]/; // allow slashes, backslashes, colon for drive
      function segmentProblems(seg){
        const probs=[];
        if(seg.length===0) return probs;
        if(/\s/.test(seg)) probs.push('Contains a space (use underscores).');
        if(badChars.test(seg)) probs.push('Contains special characters (use only letters, numbers, underscores).');
        if(/^[0-9]/.test(seg)) probs.push('Begins with a number (begin with a letter).');
        return probs;
      }

      function check(){
        const val = (inp.value || '').trim();
        if(!val){
          out.className='notice warn';
          out.textContent='Enter a filename or path to check.';
          return;
        }

        const parts = val.split(/[\\\/]+/).filter(Boolean);
        const issues=[];
        parts.forEach((seg, i) => {
          // ignore drive letter like C:
          if(i===0 && /^[A-Za-z]:$/.test(seg)) return;
          const probs=segmentProblems(seg);
          probs.forEach(p => issues.push('"' + seg + '": ' + p));
        });

        if(!issues.length){
          out.className='notice good';
          out.innerHTML='<strong>Looks good.</strong> This name follows the course ArcGIS file/folder rules.';
          return;
        }

        out.className='notice warn';
        out.innerHTML='<strong>Fix suggested:</strong><ul>' + issues.map(s => '<li>' + escapeHtml(s) + '</li>').join('') + '</ul>';
      }

      btn.addEventListener('click', check);
    });
  }

  function init(){
    initTheme();
    initBugReport();
    initLightbox();
    initQuiz();
    initToblerSlider();
    initMiniUseQuiz();
    initNameChecker();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();