/* UPP 461 — Week 4 app.js
   Theme toggle • bug report • image lightbox • quiz grader
   Week 4 interactives: color ramp preview • classification sandbox • normalization calculator
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
        const subject = 'UPP 461 — Week 4 bug report';
        const body = [
          'Week 4 — Mapping Quantitative Data',
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

  // ===== Color ramp preview =====
  function initRampDemo(){
    const root = qs('#ramp-demo');
    if(!root) return;
    const typeSel = qs('#ramp-type', root);
    const classesSel = qs('#ramp-classes', root);
    const out = qs('[data-ramp-out]', root);
    const guidance = qs('[data-ramp-guidance]', root);

    const ramps = {
      sequential: ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#08519c','#08306b'],
      diverging: ['#b2182b','#d6604d','#f4a582','#fddbc7','#f7f7f7','#d1e5f0','#92c5de','#4393c3','#2166ac']
    };

    function pickColors(type, k){
      const base = ramps[type] || ramps.sequential;
      if(k <= 2) return [base[0], base[base.length-1]];
      const idx = [];
      for(let i=0;i<k;i++){
        idx.push(Math.round(i*(base.length-1)/(k-1)));
      }
      return idx.map(i => base[i]);
    }

    function render(){
      const type = typeSel.value;
      const k = parseInt(classesSel.value, 10) || 5;
      const colors = pickColors(type, k);

      out.innerHTML = colors.map((c,i) =>
        '<div class="swatch" style="background:'+c+'" aria-label="Class '+(i+1)+' color"></div>'
      ).join('');

      const tip = (type === 'diverging')
        ? 'Use a diverging ramp when a meaningful midpoint exists (e.g., change from 0).'
        : 'Use a sequential ramp for ordered quantities (low → high).';
      const classTip = (k >= 5 && k <= 7)
        ? 'Nice: 5–7 classes is often readable.'
        : 'Reminder: 5–7 classes is a good default; more than ~7 is hard to distinguish.';
      guidance.innerHTML = '<div class="notice">'+escapeHtml(tip)+'<br/><span class="small">'+escapeHtml(classTip)+'</span></div>';
    }

    typeSel.addEventListener('change', render);
    classesSel.addEventListener('change', render);
    render();
  }

  // ===== Classification sandbox =====
  function jenks(data, nClasses){
    const sorted = data.slice().sort((a,b)=>a-b);
    const n = sorted.length;
    const lower = Array.from({length:n+1},()=>Array(nClasses+1).fill(0));
    const variance = Array.from({length:n+1},()=>Array(nClasses+1).fill(0));

    for(let i=1;i<=nClasses;i++){
      lower[0][i] = 1;
      variance[0][i] = 0;
      for(let j=1;j<=n;j++) variance[j][i] = Infinity;
    }

    let sum = 0, sumSq = 0, w = 0;
    for(let l=1;l<=n;l++){
      sum = 0; sumSq = 0; w = 0;
      for(let m=1;m<=l;m++){
        const i3 = l - m + 1;
        const val = sorted[i3-1];
        w++;
        sum += val;
        sumSq += val*val;
        const v = sumSq - (sum*sum)/w;
        const i4 = i3 - 1;
        if(i4 !== 0){
          for(let j=2;j<=nClasses;j++){
            if(variance[l][j] >= (v + variance[i4][j-1])){
              lower[l][j] = i3;
              variance[l][j] = v + variance[i4][j-1];
            }
          }
        }
      }
      lower[l][1] = 1;
      variance[l][1] = sumSq - (sum*sum)/w;
    }

    const breaks = Array(nClasses+1).fill(0);
    breaks[nClasses] = sorted[n-1];
    breaks[0] = sorted[0];

    let k = n;
    for(let j=nClasses; j>=2; j--){
      const id = lower[k][j] - 2;
      breaks[j-1] = sorted[id];
      k = lower[k][j] - 1;
    }
    return breaks;
  }

  function quantileBreaks(data, nClasses){
    const sorted = data.slice().sort((a,b)=>a-b);
    const n = sorted.length;
    const breaks = [sorted[0]];
    for(let i=1;i<nClasses;i++){
      const idx = Math.floor(i*n/nClasses);
      breaks.push(sorted[Math.min(idx, n-1)]);
    }
    breaks.push(sorted[n-1]);
    return breaks;
  }

  function equalIntervalBreaks(data, nClasses){
    const min = Math.min.apply(null, data);
    const max = Math.max.apply(null, data);
    const step = (max - min) / nClasses;
    const breaks = [min];
    for(let i=1;i<nClasses;i++) breaks.push(min + step*i);
    breaks.push(max);
    return breaks;
  }

  function assignCounts(data, breaks){
    const counts = Array(breaks.length-1).fill(0);
    for(const v of data){
      for(let i=0;i<breaks.length-1;i++){
        const lo = breaks[i];
        const hi = breaks[i+1];
        const last = (i === breaks.length-2);
        if((v >= lo && v < hi) || (last && v >= lo && v <= hi)){
          counts[i]++; break;
        }
      }
    }
    return counts;
  }

  function fmt(x){
    if(!isFinite(x)) return '';
    const abs = Math.abs(x);
    if(abs >= 1000) return Math.round(x).toLocaleString();
    return (Math.round(x*10)/10).toString();
  }

  function initClassDemo(){
    const root = qs('#class-demo');
    if(!root) return;

    const datasetSel = qs('#class-dataset', root);
    const methodSel = qs('#class-method', root);
    const classesSel = qs('#class-classes', root);
    const outBreaks = qs('[data-class-breaks]', root);
    const outCounts = qs('[data-class-counts]', root);

    const datasets = {
      'Hotel room prices ($)': [50, 95, 120, 70, 180, 220, 250, 310, 330, 360, 410, 470, 520, 550, 610, 650, 720, 800],
      'Home values (log scale)': [4.6,4.7,4.8,4.9,4.95,5.0,5.05,5.1,5.15,5.2,5.22,5.25,5.3,5.35,5.4,5.45,5.55,5.8],
      'Skewed counts': [0,0,1,1,1,2,2,3,3,4,5,8,13,21,34,55,89]
    };

    function compute(){
      const data = datasets[datasetSel.value] || datasets['Hotel room prices ($)'];
      const k = parseInt(classesSel.value, 10) || 5;
      let breaks;
      if(methodSel.value === 'quantile') breaks = quantileBreaks(data, k);
      else if(methodSel.value === 'equal') breaks = equalIntervalBreaks(data, k);
      else if(methodSel.value === 'jenks') breaks = jenks(data, k);
      else breaks = equalIntervalBreaks(data, k);

      const counts = assignCounts(data, breaks);
      const rows = breaks.slice(0,-1).map((b,i)=>{
        const lo = breaks[i];
        const hi = breaks[i+1];
        return '<tr><td>'+escapeHtml(fmt(lo))+'</td><td>'+escapeHtml(fmt(hi))+'</td><td>'+counts[i]+'</td></tr>';
      }).join('');

      outBreaks.innerHTML =
        '<div class="table-wrap" tabindex="0" role="region" aria-label="Class break table">' +
        '<table><thead><tr><th scope="col">From</th><th scope="col">To</th><th scope="col"># values</th></tr></thead>' +
        '<tbody>'+rows+'</tbody></table></div>';

      const sum = counts.reduce((a,b)=>a+b,0);
      outCounts.innerHTML =
        '<div class="notice"><strong>Class balance:</strong> ' + counts.join(' • ') +
        '<span class="small"> (total ' + sum + ' values)</span></div>';
    }

    datasetSel.addEventListener('change', compute);
    methodSel.addEventListener('change', compute);
    classesSel.addEventListener('change', compute);
    compute();
  }

  // ===== Normalization calculator =====
  function initNormDemo(){
    const root = qs('#norm-demo');
    if(!root) return;
    const countEl = qs('#norm-count', root);
    const denomEl = qs('#norm-denom', root);
    const perEl = qs('#norm-per', root);
    const out = qs('[data-norm-out]', root);
    const outTip = qs('[data-norm-tip]', root);

    function compute(){
      const count = parseFloat(countEl.value);
      const denom = parseFloat(denomEl.value);
      const per = parseFloat(perEl.value);
      if(!isFinite(count) || !isFinite(denom) || denom <= 0 || !isFinite(per) || per <= 0){
        out.innerHTML = '<div class="notice warn">Enter a count, a positive denominator, and a per-unit.</div>';
        outTip.textContent = '';
        return;
      }
      const rate = (count / denom) * per;
      out.innerHTML = '<div class="notice good"><strong>Normalized rate:</strong> ' + fmt(rate) + ' per ' + fmt(per) + '</div>';
      outTip.innerHTML = '<div class="small">If your map units vary in size (population, area), choropleths usually communicate <strong>rates/densities</strong> better than raw totals.</div>';
    }

    qsa('input,select', root).forEach(el => el.addEventListener('input', compute));
    compute();
  }

  function init(){
    initTheme();
    initBugReport();
    initLightbox();
    initQuiz();
    initRampDemo();
    initClassDemo();
    initNormDemo();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();