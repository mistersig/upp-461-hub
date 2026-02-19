/* UPP 461 — Week 3 app.js
   - Theme toggle (WCAG-friendly)
   - Bug report mailto builder
   - Accessible image lightbox
   - Uniform quiz grader
   - Week 3 interactives (figure–ground, contrast, palettes, layout choices, hierarchy)
*/
(function(){
  'use strict';

  function qs(sel, root){ return (root || document).querySelector(sel); }
  function qsa(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }

  // ---------- Theme ----------
  const THEME_KEY = 'upp461_theme';
  function setTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    const label = qs('[data-theme-label]');
    const btn = qs('[data-theme-toggle]');
    if(label) label.textContent = theme === 'dark' ? 'Dark' : 'Light';
    if(btn) btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    try{ localStorage.setItem(THEME_KEY, theme); }catch(e){}
  }
  function initTheme(){
    let theme = 'light';
    try{
      const saved = localStorage.getItem(THEME_KEY);
      if(saved === 'dark' || saved === 'light') theme = saved;
    }catch(e){}
    setTheme(theme);
    const btn = qs('[data-theme-toggle]');
    if(btn){
      btn.addEventListener('click', function(){
        const cur = document.documentElement.getAttribute('data-theme') || 'light';
        setTheme(cur === 'dark' ? 'light' : 'dark');
      });
    }
  }

  // ---------- Bug report ----------
  function initBugReport(){
    const link = qs('[data-bug-report]');
    if(!link) return;
    link.addEventListener('click', function(e){
      e.preventDefault();
      const subject = encodeURIComponent('UPP 461 Week 3 module bug');
      const body = encodeURIComponent(
        'Describe what happened:\n\n' +
        'Page: ' + window.location.href + '\n' +
        'Browser: ' + navigator.userAgent + '\n'
      );
      window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
    });
  }

  // ---------- Lightbox ----------
  function initLightbox(){
    const imgs = qsa('img[data-lightbox]');
    if(imgs.length === 0) return;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image viewer');
    overlay.innerHTML = `
      <button class="lightbox-close" type="button" aria-label="Close image">×</button>
      <img class="lightbox-img" alt="" />
      <p class="lightbox-cap small" aria-live="polite"></p>
    `;
    document.body.appendChild(overlay);

    const imgEl = qs('.lightbox-img', overlay);
    const capEl = qs('.lightbox-cap', overlay);
    const closeBtn = qs('.lightbox-close', overlay);

    function close(){
      overlay.classList.remove('open');
      document.body.classList.remove('no-scroll');
      if(lastFocus) lastFocus.focus();
    }
    function open(src, alt, cap){
      imgEl.src = src;
      imgEl.alt = alt || '';
      capEl.textContent = cap || '';
      overlay.classList.add('open');
      document.body.classList.add('no-scroll');
      closeBtn.focus();
    }

    let lastFocus = null;

    imgs.forEach(function(img){
      img.tabIndex = 0;
      img.addEventListener('click', function(){
        lastFocus = document.activeElement;
        const cap = img.closest('figure') ? qs('figcaption', img.closest('figure'))?.textContent : '';
        open(img.getAttribute('src'), img.getAttribute('alt'), cap);
      });
      img.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          img.click();
        }
      });
    });

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function(e){
      if(e.target === overlay) close();
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
  }

  // ---------- Quiz ----------
  function renderQuiz(mount, questions){
    mount.innerHTML = '';
    questions.forEach(function(q, idx){
      const block = document.createElement('fieldset');
      block.className = 'q';
      block.innerHTML = `
        <legend><span class="qnum">Q${idx+1}.</span> ${escapeHtml(q.q)}</legend>
        <div class="choices"></div>
        <p class="feedback small" aria-live="polite"></p>
      `;
      const choices = qs('.choices', block);
      q.choices.forEach(function(c, cidx){
        const id = `q${idx}_c${cidx}`;
        const label = document.createElement('label');
        label.className = 'choice';
        label.innerHTML = `<input type="radio" name="q${idx}" value="${cidx}" /> ${escapeHtml(c)}`;
        choices.appendChild(label);
      });
      mount.appendChild(block);
    });
  }

  function gradeQuiz(root, questions){
    let correct = 0;
    const details = [];
    const blocks = qsa('.q', root);

    blocks.forEach(function(block, idx){
      const picked = qs(`input[name="q${idx}"]:checked`, block);
      const fb = qs('.feedback', block);
      const ans = questions[idx].answer;

      if(!picked){
        fb.textContent = 'Pick an answer.';
        fb.classList.remove('ok','bad');
        details.push({ ok:false, picked:null, answer: ans });
        return;
      }

      const val = parseInt(picked.value, 10);
      const ok = val === ans;
      if(ok) correct += 1;

      const correctLabel = (questions[idx].choices && questions[idx].choices[ans]) ? questions[idx].choices[ans] : `Choice ${ans+1}`;
      const prefix = ok ? 'Correct. ' : `Not quite. Correct answer: ${correctLabel}. `;
      fb.textContent = prefix + (questions[idx].why || '');
      fb.classList.toggle('ok', ok);
      fb.classList.toggle('bad', !ok);

      details.push({ ok, picked: val, answer: ans });
    });

    return { correct, total: questions.length, details };
  }

  function initQuiz(){
    const quiz = qs('[data-quiz]');
    if(!quiz) return;
    const mount = qs('[data-quiz-mount]', quiz);
    const submit = qs('[data-quiz-submit]', quiz);
    const reset = qs('[data-quiz-reset]', quiz);
    const scoreEl = qs('[data-quiz-score]', quiz);
    const dataEl = qs('#quiz-data', quiz);

    let questions = [];
    try{ questions = JSON.parse(dataEl.textContent); }catch(e){ questions = []; }
    if(questions.length === 0) return;

    // Answer key container (created once)
    let keyWrap = qs('[data-quiz-key]', quiz);
    if(!keyWrap){
      keyWrap = document.createElement('details');
      keyWrap.className = 'card quiz-key';
      keyWrap.setAttribute('data-quiz-key','');
      keyWrap.hidden = true;
      keyWrap.innerHTML = `
        <summary><strong>Answer key</strong> (shows after you submit)</summary>
        <div class="quiz-key-body" data-quiz-key-body></div>
      `;
      // Insert after toolbar
      const tb = qs('.toolbar', quiz);
      if(tb && tb.parentNode) tb.parentNode.insertBefore(keyWrap, tb.nextSibling);
      else quiz.appendChild(keyWrap);
    }
    const keyBody = qs('[data-quiz-key-body]', keyWrap);

    function renderKey(result){
      if(!keyBody) return;
      keyBody.innerHTML = '';
      const ol = document.createElement('ol');
      ol.className = 'quiz-key-list';

      questions.forEach(function(q, idx){
        const ansIdx = q.answer;
        const ansText = (q.choices && q.choices[ansIdx]) ? q.choices[ansIdx] : `Choice ${ansIdx+1}`;
        const pickedIdx = result.details[idx] ? result.details[idx].picked : null;
        const pickedText = (pickedIdx !== null && q.choices && q.choices[pickedIdx]) ? q.choices[pickedIdx] : (pickedIdx === null ? '—' : `Choice ${pickedIdx+1}`);
        const ok = result.details[idx] ? result.details[idx].ok : false;

        const li = document.createElement('li');
        li.className = ok ? 'ok' : 'bad';
        li.innerHTML = `
          <div><strong>Q${idx+1}.</strong> ${escapeHtml(q.q)}</div>
          <div class="small muted">Your answer: ${escapeHtml(pickedText)}</div>
          <div class="small"><strong>Correct:</strong> ${escapeHtml(ansText)}</div>
          ${q.why ? `<div class="small muted">${escapeHtml(q.why)}</div>` : ''}
        `;
        ol.appendChild(li);
      });

      keyBody.appendChild(ol);
    }

    renderQuiz(mount, questions);

    submit.addEventListener('click', function(){
      const r = gradeQuiz(quiz, questions);
      scoreEl.textContent = `Score: ${r.correct}/${r.total}`;
      scoreEl.classList.add('pill');

      // Show answer key + populate
      keyWrap.hidden = false;
      keyWrap.open = true;
      renderKey(r);
    });

    reset.addEventListener('click', function(){
      qsa('input[type="radio"]', quiz).forEach(function(i){ i.checked = false; });
      qsa('.feedback', quiz).forEach(function(p){ p.textContent = ''; p.classList.remove('ok','bad'); });
      scoreEl.textContent = '';
      scoreEl.classList.remove('pill');

      // Hide key
      if(keyWrap){
        keyWrap.hidden = true;
        keyWrap.open = false;
      }
      if(keyBody) keyBody.innerHTML = '';
    });
  }

  function escapeHtml(s){
    return String(s)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'","&#039;");
  }

  // ---------- Week 3 widgets ----------
  function initFigureGround(){
    const root = qs('[data-widget="figure-ground"]');
    if(!root) return;
    const selTemp = qs('[data-fg-temp]', root);
    const selGround = qs('[data-ground]', root);
    const chkOutline = qs('[data-outline]', root);

    const mock = qs('.map-mock', root);
    if(!mock) return;

    function apply(){
      const temp = selTemp.value;   // warm/cool
      const ground = selGround.value; // light/dark
      mock.setAttribute('data-ground', ground);
      mock.setAttribute('data-temp', temp);
      mock.setAttribute('data-outline', chkOutline.checked ? 'on' : 'off');
    }
    [selTemp, selGround, chkOutline].forEach(function(el){
      el.addEventListener('change', apply);
    });
    apply();
  }

  // Contrast helper (WCAG relative luminance)
  function hexToRgb(hex){
    const h = String(hex).trim().replace('#','');
    if(!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return {
      r: parseInt(h.slice(0,2),16),
      g: parseInt(h.slice(2,4),16),
      b: parseInt(h.slice(4,6),16),
    };
  }
  function srgbToLin(c){
    const s = c/255;
    return s <= 0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4);
  }
  function luminance(rgb){
    const r=srgbToLin(rgb.r), g=srgbToLin(rgb.g), b=srgbToLin(rgb.b);
    return 0.2126*r + 0.7152*g + 0.0722*b;
  }
  function contrastRatio(fg, bg){
    const L1 = luminance(fg);
    const L2 = luminance(bg);
    const lighter = Math.max(L1,L2);
    const darker = Math.min(L1,L2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function initContrast(){
    const root = qs('[data-widget="contrast"]');
    if(!root) return;

    const fgIn = qs('[data-contrast-fg]', root);
    const bgIn = qs('[data-contrast-bg]', root);
    const fgColor = qs('[data-contrast-fg-color]', root);
    const bgColor = qs('[data-contrast-bg-color]', root);
    const fgL = qs('[data-contrast-fg-l]', root);
    const bgL = qs('[data-contrast-bg-l]', root);
    const fgLbl = qs('[data-contrast-fg-lbl]', root);
    const bgLbl = qs('[data-contrast-bg-lbl]', root);

    const run = qs('[data-contrast-run]', root);
    const out = qs('[data-contrast-out]', root);
    const prev = qs('[data-contrast-preview]', root);

    const modal = qs('[data-contrast-modal]', root);
    const grid = qs('[data-swatch-grid]', root);
    const closeBtns = qsa('[data-modal-close]', root);
    const pickBtns = qsa('[data-contrast-pick]', root);

    let pickTarget = 'fg';
    let lastFocus = null;

    const SWATCHES = [
      '#111827','#0f172a','#1f2937','#374151','#6b7280','#9ca3af','#d1d5db','#f3f4f6','#ffffff',
      '#1e40af','#2563eb','#0ea5e9','#0f766e','#16a34a','#65a30d',
      '#f59e0b','#f97316','#dc2626','#be123c','#7c3aed'
    ];

    function clamp01(x){ return Math.max(0, Math.min(1, x)); }

    function rgbToHsl(rgb){
      const r = rgb.r/255, g = rgb.g/255, b = rgb.b/255;
      const max = Math.max(r,g,b), min = Math.min(r,g,b);
      let h=0, s=0;
      const l = (max+min)/2;
      const d = max-min;
      if(d !== 0){
        s = d / (1 - Math.abs(2*l - 1));
        switch(max){
          case r: h = ((g-b)/d) % 6; break;
          case g: h = ((b-r)/d) + 2; break;
          case b: h = ((r-g)/d) + 4; break;
        }
        h *= 60;
        if(h < 0) h += 360;
      }
      return { h, s, l };
    }

    function hslToRgb(hsl){
      const h = hsl.h, s = clamp01(hsl.s), l = clamp01(hsl.l);
      const c = (1 - Math.abs(2*l - 1)) * s;
      const hp = (h % 360) / 60;
      const x = c * (1 - Math.abs((hp % 2) - 1));
      let r1=0,g1=0,b1=0;
      if(0<=hp && hp<1){ r1=c; g1=x; b1=0; }
      else if(1<=hp && hp<2){ r1=x; g1=c; b1=0; }
      else if(2<=hp && hp<3){ r1=0; g1=c; b1=x; }
      else if(3<=hp && hp<4){ r1=0; g1=x; b1=c; }
      else if(4<=hp && hp<5){ r1=x; g1=0; b1=c; }
      else { r1=c; g1=0; b1=x; }
      const m = l - c/2;
      return {
        r: Math.round((r1+m)*255),
        g: Math.round((g1+m)*255),
        b: Math.round((b1+m)*255),
      };
    }

    function rgbToHex(rgb){
      const to2 = (n) => n.toString(16).padStart(2,'0');
      return '#' + to2(rgb.r) + to2(rgb.g) + to2(rgb.b);
    }

    function normalizeHex(v){
      const s = String(v || '').trim();
      if(/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
      return null;
    }

    function syncFromText(which){
      const input = (which === 'fg') ? fgIn : bgIn;
      const col = (which === 'fg') ? fgColor : bgColor;
      const slider = (which === 'fg') ? fgL : bgL;
      const lbl = (which === 'fg') ? fgLbl : bgLbl;

      const hex = normalizeHex(input.value);
      if(!hex) return false;

      col.value = hex;
      const rgb = hexToRgb(hex);
      if(!rgb) return false;
      const hsl = rgbToHsl(rgb);
      slider.value = Math.round(hsl.l * 100);
      lbl.textContent = slider.value + '%';
      return true;
    }

    function setHex(which, hex){
      const input = (which === 'fg') ? fgIn : bgIn;
      input.value = hex;
      syncFromText(which);
    }

    function applyLightness(which){
      const input = (which === 'fg') ? fgIn : bgIn;
      const slider = (which === 'fg') ? fgL : bgL;
      const lbl = (which === 'fg') ? fgLbl : bgLbl;

      const hex = normalizeHex(input.value);
      if(!hex) return;
      const rgb = hexToRgb(hex);
      if(!rgb) return;

      const hsl = rgbToHsl(rgb);
      hsl.l = parseInt(slider.value, 10) / 100;
      lbl.textContent = slider.value + '%';
      const outHex = rgbToHex(hslToRgb(hsl));
      input.value = outHex;
      if(which === 'fg') fgColor.value = outHex; else bgColor.value = outHex;
    }

    function go(){
      const fgHex = normalizeHex(fgIn.value);
      const bgHex = normalizeHex(bgIn.value);
      const fg = fgHex ? hexToRgb(fgHex) : null;
      const bg = bgHex ? hexToRgb(bgHex) : null;

      if(!fg || !bg){
        out.textContent = 'Use 6-digit hex colors like #112233.';
        out.classList.remove('ok','bad');
        return;
      }
      const ratio = contrastRatio(fg,bg);
      const passAA = ratio >= 4.5;
      const passLarge = ratio >= 3.0;

      prev.style.color = fgHex;
      prev.style.background = bgHex;

      out.textContent =
        `Contrast ratio: ${ratio.toFixed(2)}. ` +
        (passAA ? 'Passes AA for normal text (≥ 4.5).' :
          (passLarge ? 'Passes for large text (≥ 3.0), but fails AA for normal text.' :
            'Fails (needs ≥ 3.0 for large text, ≥ 4.5 for normal text).'));

      out.classList.toggle('ok', passAA);
      out.classList.toggle('bad', !passAA);
    }

    function openModal(target){
      pickTarget = target;
      if(!modal || !grid) return;
      lastFocus = document.activeElement;

      // Build swatches once per open (simple + small)
      grid.innerHTML = '';
      SWATCHES.forEach(function(hex){
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'swatch';
        b.style.background = hex;
        b.setAttribute('role','listitem');
        b.setAttribute('aria-label', 'Choose ' + hex);
        b.setAttribute('data-hex', hex);
        b.innerHTML = '<span class="swatch-label">' + hex + '</span>';
        b.addEventListener('click', function(){
          setHex(pickTarget, hex);
          go();
          closeModal();
        });
        grid.appendChild(b);
      });

      modal.hidden = false;
      modal.classList.add('open');
      document.body.classList.add('no-scroll');

      // Focus first swatch
      const first = qs('.swatch', grid);
      if(first) first.focus();
    }

    function closeModal(){
      if(!modal) return;
      modal.classList.remove('open');
      modal.hidden = true;
      document.body.classList.remove('no-scroll');
      if(lastFocus && lastFocus.focus) lastFocus.focus();
    }

    // Bind events
    run.addEventListener('click', go);

    [fgIn,bgIn].forEach(function(inp){
      inp.addEventListener('input', function(){
        const which = (inp === fgIn) ? 'fg' : 'bg';
        if(syncFromText(which)) go();
      });
      inp.addEventListener('blur', function(){
        const which = (inp === fgIn) ? 'fg' : 'bg';
        // Normalize to lowercase with leading #
        const hex = normalizeHex(inp.value);
        if(hex){ inp.value = hex; syncFromText(which); go(); }
      });
    });

    if(fgColor){
      fgColor.addEventListener('input', function(){ setHex('fg', fgColor.value); go(); });
    }
    if(bgColor){
      bgColor.addEventListener('input', function(){ setHex('bg', bgColor.value); go(); });
    }
    if(fgL){
      fgL.addEventListener('input', function(){ applyLightness('fg'); go(); });
    }
    if(bgL){
      bgL.addEventListener('input', function(){ applyLightness('bg'); go(); });
    }

    pickBtns.forEach(function(btn){
      btn.addEventListener('click', function(){
        openModal(btn.getAttribute('data-contrast-pick'));
      });
    });

    closeBtns.forEach(function(btn){
      btn.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && modal && !modal.hidden){
        e.preventDefault();
        closeModal();
      }
    });

    // Initial sync + run
    syncFromText('fg');
    syncFromText('bg');
    go();
  }

  function initPalette(){
    const root = qs('[data-widget="palette"]');
    if(!root) return;
    const typeSel = qs('[data-palette-type]', root);
    const kIn = qs('[data-palette-k]', root);
    const run = qs('[data-palette-run]', root);
    const row = qs('[data-palette-row]', root);
    const note = qs('[data-palette-note]', root);

    const palettes = {
      categorical: [
        ['#1b9e77','#d95f02','#7570b3'],
        ['#1b9e77','#d95f02','#7570b3','#e7298a'],
        ['#1b9e77','#d95f02','#7570b3','#e7298a','#66a61e'],
        ['#1b9e77','#d95f02','#7570b3','#e7298a','#66a61e','#e6ab02'],
        ['#1b9e77','#d95f02','#7570b3','#e7298a','#66a61e','#e6ab02','#a6761d']
      ],
      sequential: [
        ['#eff3ff','#bdd7e7','#6baed6'],
        ['#f7fbff','#c6dbef','#6baed6','#2171b5'],
        ['#f7fcf5','#c7e9c0','#74c476','#238b45','#00441b'],
        ['#fff5f0','#fcbba1','#fc9272','#fb6a4a','#cb181d','#67000d'],
        ['#ffffe5','#fee391','#fec44f','#fe9929','#d95f0e','#993404','#662506']
      ],
      diverging: [
        ['#2166ac','#f7f7f7','#b2182b'],
        ['#2166ac','#92c5de','#f7f7f7','#f4a582','#b2182b'],
        ['#053061','#4393c3','#f7f7f7','#d6604d','#67001f'],
        ['#053061','#4393c3','#92c5de','#f7f7f7','#f4a582','#d6604d','#67001f']
      ]
    };

    function go(){
      const type = typeSel.value;
      let k = parseInt(kIn.value, 10);
      if(isNaN(k)) k = 5;
      k = Math.max(3, Math.min(7, k));
      kIn.value = String(k);

      let p;
      if(type === 'diverging'){
        // diverging palettes only defined up to 7; map k to nearest
        const options = palettes.diverging;
        p = options[Math.min(options.length-1, Math.max(0, k-3))];
      }else{
        const options = palettes[type];
        p = options[Math.min(options.length-1, Math.max(0, k-3))];
      }

      row.innerHTML = '';
      p.forEach(function(c){
        const sw = document.createElement('span');
        sw.className = 'swatch';
        sw.style.background = c;
        sw.title = c;
        row.appendChild(sw);
      });

      note.textContent = type === 'categorical'
        ? 'Use distinct hues for categories.'
        : type === 'sequential'
          ? 'Use value/saturation changes for magnitude.'
          : 'Use two hues with a neutral middle for below/above a reference value.';
    }

    run.addEventListener('click', go);
    go();
  }

  function initElements(){
    const root = qs('[data-widget="elements"]');
    if(!root) return;
    const scenario = qs('[data-scenario]', root);
    const btn = qs('[data-elements-check]', root);
    const out = qs('[data-elements-out]', root);

    const recommended = {
      transit: { must:['title','legend','north','credits'], optional:['scale','text'], avoid:['scale'] },
      report:  { must:['title','legend','scale','credits'], optional:['north','text'], avoid:[] },
      poster:  { must:['title','legend','credits'], optional:['scale','north','text'], avoid:[] }
    };

    function checkedValues(){
      return qsa('input[type="checkbox"]', root)
        .filter(i => i.checked)
        .map(i => i.value);
    }

    btn.addEventListener('click', function(){
      const s = scenario.value;
      const pick = new Set(checkedValues());
      const rec = recommended[s];

      const missing = rec.must.filter(x => !pick.has(x));
      const extra = Array.from(pick).filter(x => rec.must.indexOf(x) === -1 && rec.optional.indexOf(x) === -1);

      let msg = '';
      if(missing.length === 0) msg += 'Nice. You included the essentials. ';
      else msg += 'Missing essentials: ' + missing.join(', ') + '. ';

      if(s === 'transit' && pick.has('scale')){
        msg += 'For transit diagrams, scale is usually not meaningful. ';
      }
      if(extra.length){
        msg += 'Double-check whether these add value: ' + extra.join(', ') + '.';
      }else{
        msg += 'Your selections look purposeful.';
      }
      out.textContent = msg;
    });
  }

  function initHierarchy(){
    const root = qs('[data-widget="hierarchy"]');
    if(!root) return;
    const list = qs('[data-reorder]', root);
    const btnUp = qs('[data-move="up"]', root);
    const btnDown = qs('[data-move="down"]', root);
    const check = qs('[data-hierarchy-check]', root);
    const out = qs('[data-hierarchy-out]', root);
    const canvas = qs('[data-hierarchy-canvas]', root);

    let selected = null;

    function select(li){
      qsa('li', list).forEach(x => x.classList.remove('sel'));
      li.classList.add('sel');
      selected = li;
      renderPreview();
    }

    qsa('li', list).forEach(function(li){
      li.tabIndex = 0;
      li.addEventListener('click', function(){ select(li); });
      li.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault(); select(li);
        }
      });
    });

    function move(dir){
      if(!selected) return;
      const sib = (dir === 'up') ? selected.previousElementSibling : selected.nextElementSibling;
      if(!sib) return;
      if(dir === 'up') list.insertBefore(selected, sib);
      else list.insertBefore(sib, selected);
      renderPreview();
    }

    function renderPreview(){
      if(!canvas) return;
      const order = qsa('li', list).map(li => li.getAttribute('data-key'));
      const n = order.length;

      qsa('.hc-el', canvas).forEach(function(el){
        const key = el.getAttribute('data-key');
        const idx = order.indexOf(key);
        if(idx === -1) return;

        const weight = (n - idx) / n; // 1..small
        const scale = 0.78 + 0.35 * weight;
        const opacity = 0.55 + 0.45 * weight;

        el.style.zIndex = String(100 + (n - idx));
        el.style.opacity = String(opacity);
        el.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`;

        // Selected outline sync
        el.classList.toggle('sel', selected && selected.getAttribute('data-key') === key);
      });
    }

    btnUp.addEventListener('click', () => move('up'));
    btnDown.addEventListener('click', () => move('down'));

    check.addEventListener('click', function(){
      const keys = qsa('li', list).map(li => li.getAttribute('data-key'));
      const mapPos = keys.indexOf('map');
      const titlePos = keys.indexOf('title');
      const legendPos = keys.indexOf('legend');

      const ok = (mapPos === 0 || mapPos === 1) && (titlePos <= 2) && (legendPos <= 3);
      out.textContent = ok
        ? 'Good hierarchy: the map and title are high priority, and support elements follow.'
        : 'Try again: the map frame and title should be near the top. Support elements should not overpower them.';
      out.classList.toggle('ok', ok);
      out.classList.toggle('bad', !ok);
    });

    // Select first item by default
    const first = qs('li', list);
    if(first) select(first);
  }

  // ---------- init ----------
  initTheme();
  initBugReport();
  initLightbox();
  initQuiz();
  initFigureGround();
  initContrast();
  initPalette();
  initElements();
  initHierarchy();

})();