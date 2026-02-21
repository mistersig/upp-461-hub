/* UPP 461 — Week 2 app.js
   Theme toggle • bug report • image lightbox • quiz grader
   Week 2 interactives: vector vs raster picker • topology rule matcher • measurement scale classifier • file size estimator • metadata checklist
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

  // ---- Quiz (uniform across modules) ----
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
        const qnum = fs.getAttribute('data-question');
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

  // -------------------- Week 2 interactives --------------------

  // Mini-quiz: vector vs raster (selects with data-correct)
  function initMiniSelectQuiz(){
    qsa('[data-mini-quiz]').forEach(root => {
      const btn = qs('[data-mini-grade]', root);
      const out = qs('[data-mini-score]', root);
      const selects = qsa('select[data-correct]', root);
      if(!btn || !selects.length) return;

      function grade(){
        let correct = 0;
        let answered = 0;
        selects.forEach(sel => {
          const fb = sel.closest('.mini-item') ? qs('[data-mini-feedback]', sel.closest('.mini-item')) : null;
          const want = sel.getAttribute('data-correct');
          const got = sel.value;
          const isAnswered = got && got !== 'choose';
          if(isAnswered) answered += 1;
          const ok = got === want;
          if(ok) correct += 1;

          if(fb){
            fb.className = 'notice ' + (ok ? 'good' : 'warn');
            fb.innerHTML = ok
              ? '<strong>✔</strong> Nice.'
              : ('<strong>✖</strong> Best choice: <strong>' + escapeHtml(want) + '</strong>. ' + escapeHtml(sel.getAttribute('data-why') || ''));
          }
        });

        if(out){
          out.textContent = 'Mini score: ' + correct + '/' + selects.length + (answered < selects.length ? (' (answered ' + answered + ')') : '');
        }
      }

      btn.addEventListener('click', grade);
      grade(); // initialize feedback to consistent layout
    });
  }

  // Topology rule matcher (radio or select with data-correct)
  function initRuleMatcher(){
    qsa('[data-rule-matcher]').forEach(root => {
      const btn = qs('[data-check]', root);
      const out = qs('[data-output]', root);
      if(!btn || !out) return;

      const input = qs('select[data-correct], input[type="radio"][data-correct]', root);
      // We'll support either a select (preferred) or a radio group
      const sel = qs('select[data-correct]', root);
      const groupName = root.getAttribute('data-rule-group') || 'rule';

      function getChoice(){
        if(sel) return sel.value;
        const checked = qs('input[type="radio"][name="' + groupName + '"]:checked', root);
        return checked ? checked.value : '';
      }

      function check(){
        const want = (sel ? sel.getAttribute('data-correct') : (root.getAttribute('data-correct') || '')).trim();
        const got = getChoice();
        if(!got){
          out.className = 'notice warn';
          out.textContent = 'Pick an answer first.';
          return;
        }
        const ok = got === want;
        out.className = 'notice ' + (ok ? 'good' : 'warn');
        out.innerHTML = ok
          ? '<strong>Correct.</strong> ' + escapeHtml(root.getAttribute('data-why-correct') || '')
          : ('<strong>Not quite.</strong> Correct: <strong>' + escapeHtml(want) + '</strong>. ' + escapeHtml(root.getAttribute('data-why-wrong') || ''));
      }

      btn.addEventListener('click', check);
    });
  }

  // File size estimator (rows, cols, bytes per cell)
  function initSizeEstimator(){
    qsa('[data-size-estimator]').forEach(root => {
      const rows = qs('input[data-rows]', root);
      const cols = qs('input[data-cols]', root);
      const bytes = qs('select[data-bytes]', root);
      const out = qs('[data-size-out]', root);
      const btn = qs('[data-size-calc]', root);
      if(!rows || !cols || !bytes || !out || !btn) return;

      function fmt(n){
        if(n >= 1024*1024*1024) return (n/(1024*1024*1024)).toFixed(2) + ' GiB';
        if(n >= 1024*1024) return (n/(1024*1024)).toFixed(2) + ' MiB';
        if(n >= 1024) return (n/1024).toFixed(2) + ' KiB';
        return n.toFixed(0) + ' bytes';
      }

      function calc(){
        const r = Number(rows.value);
        const c = Number(cols.value);
        const b = Number(bytes.value);
        if(!Number.isFinite(r) || !Number.isFinite(c) || !Number.isFinite(b) || r<=0 || c<=0 || b<=0){
          out.className = 'notice warn';
          out.textContent = 'Enter positive numbers for rows/cols and choose bytes per cell.';
          return;
        }
        const total = r * c * b;
        out.className = 'notice good';
        out.innerHTML = '<strong>Estimated raster payload:</strong> ' + escapeHtml(fmt(total)) +
          '<div class="small">This is a simplified estimate; formats add headers, compression, pyramids, and other overhead.</div>';
      }

      btn.addEventListener('click', calc);
      calc();
    });
  }

  // Metadata checklist builder (checkboxes)
  function initMetadataChecklist(){
    qsa('[data-metadata-builder]').forEach(root => {
      const btn = qs('[data-build]', root);
      const out = qs('[data-meta-out]', root);
      const copyBtn = qs('[data-copy]', root);
      const checks = qsa('input[type="checkbox"][data-item]', root);
      if(!btn || !out || !checks.length) return;

      function build(){
        const picked = checks.filter(ch => ch.checked).map(ch => ch.getAttribute('data-item'));
        if(!picked.length){
          out.className = 'notice warn';
          out.innerHTML = 'Select a few items, then click <strong>Build</strong>.';
          return;
        }
        out.className = 'card';
        out.innerHTML = '<h4>Metadata checklist (copy/paste)</h4><ul>' +
          picked.map(t => '<li>' + escapeHtml(t) + '</li>').join('') +
          '</ul>';
      }

      function copy(){
        const text = qsa('li', out).map(li => '- ' + li.textContent).join('\n');
        if(!text){
          out.className = 'notice warn';
          out.textContent = 'Build a checklist first.';
          return;
        }
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(text).then(() => {
            const msg = document.createElement('div');
            msg.className = 'notice good';
            msg.textContent = 'Copied checklist to clipboard.';
            out.prepend(msg);
            setTimeout(() => { msg.remove(); }, 1600);
          }).catch(() => {});
        }
      }

      btn.addEventListener('click', build);
      if(copyBtn) copyBtn.addEventListener('click', copy);
      build();
    });
  }

  function init(){
    initTheme();
    initBugReport();
    initLightbox();
    initQuiz();
    initMiniSelectQuiz();
    initRuleMatcher();
    initSizeEstimator();
    initMetadataChecklist();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();