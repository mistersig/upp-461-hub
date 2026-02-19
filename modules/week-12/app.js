/* UPP 461 — Week 12 app.js
   - Theme toggle (WCAG-friendly)
   - Bug report mailto builder
   - Accessible image lightbox
   - Uniform quiz grader (matches Week 6 behavior)
   - Raster interactives (scope + IDW demo)
*/

(function(){
  'use strict';

  function qs(sel, root){ return (root || document).querySelector(sel); }
  function qsa(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }

  function escapeHtml(str){
    return (str || '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  /* Raster interactives
   A) Scope classifier (local/focal/zonal/global) — data-scope-demo
   B) IDW intuition — data-idw
*/

function initScopeDemo(){
  var root = qs('[data-scope-demo]');
  if (!root) return;

  var live = qs('[data-live]', root);

  function setLive(msg){
    if (live) live.textContent = msg;
  }

  function makeNotice(kind, html){
    return '<div class="notice ' + kind + '">' + html + '</div>';
  }

  qsa('[data-scope-item]', root).forEach(function(item){
    var sel = qs('select', item);
    var btn = qs('[data-check]', item);
    var out = qs('[data-out]', item);
    var correct = (item.getAttribute('data-correct') || '').trim();

    if (!sel || !btn || !out || !correct) return;

    btn.addEventListener('click', function(){
      var v = (sel.value || '').trim();
      if (!v){
        out.innerHTML = makeNotice('warn', '<strong>Select an option</strong> then click Check.');
        setLive('Scope demo: selection required.');
        return;
      }

      if (v === correct){
        out.innerHTML = makeNotice('good',
          '<strong>Correct.</strong> This is <strong>' + escapeHtml(correct) + '</strong> scope.');
        setLive('Scope demo: correct.');
      } else {
        out.innerHTML = makeNotice('bad',
          '<strong>Not quite.</strong> This is <strong>' + escapeHtml(correct) + '</strong> scope. ' +
          '<div class="small">Tip: local = cell-by-cell; focal = neighborhood window; zonal = within zones; global = whole raster.</div>');
        setLive('Scope demo: incorrect.');
      }
    });
  });
}

function initIDWDemo(){
  var form = qs('[data-idw]');
  if (!form) return;

  var power = qs('[data-idw-power]', form);
  var powerLabel = qs('[data-idw-power-label]', form);
  var out = qs('[data-idw-out]', form);
  var live = qs('[data-live]', form);

  // Example from the slides: values at three known points and their distances.
  var pts = [
    { name: 'Point A', value: 50, d: 4 },
    { name: 'Point B', value: 30, d: 2 },
    { name: 'Point C', value: 52, d: 6 }
  ];

  function setLive(msg){
    if (live) live.textContent = msg;
  }

  function compute(p){
    var weights = pts.map(function(pt){
      return 1 / Math.pow(pt.d, p);
    });
    var sumW = weights.reduce(function(a,b){ return a+b; }, 0);
    var norm = weights.map(function(w){ return w / sumW; });
    var est = norm.reduce(function(acc, w, i){ return acc + w * pts[i].value; }, 0);

    return { p: p, weights: weights, norm: norm, est: est };
  }

  function render(){
    if (!power || !out) return;
    var p = parseInt(power.value, 10);
    if (!Number.isFinite(p)) p = 2;
    if (powerLabel) powerLabel.textContent = String(p);

    var r = compute(p);

    var rows = pts.map(function(pt, i){
      var w = r.weights[i];
      var wn = r.norm[i];
      return '<tr>' +
        '<td>' + escapeHtml(pt.name) + '</td>' +
        '<td class="num">' + escapeHtml(String(pt.value)) + '</td>' +
        '<td class="num">' + escapeHtml(String(pt.d)) + '</td>' +
        '<td class="num">' + w.toFixed(4) + '</td>' +
        '<td class="num">' + (wn*100).toFixed(1) + '%</td>' +
      '</tr>';
    }).join('');

    out.innerHTML =
      '<div class="notice info">' +
        '<strong>Estimated value:</strong> <span class="mono">' + r.est.toFixed(2) + '</span> ' +
        '<span class="small">(IDW with power p=' + r.p + ')</span>' +
      '</div>' +
      '<div class="table-wrap" role="region" aria-label="IDW weights table" tabindex="0">' +
        '<table class="table">' +
          '<thead><tr><th>Known point</th><th class="num">Value</th><th class="num">Distance</th><th class="num">1/d^p</th><th class="num">Weight</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>' +
      '<p class="small">As <strong>p</strong> increases, the nearest points get much more influence (the surface becomes “spikier”). Lower <strong>p</strong> spreads influence farther (smoother surface).</p>';

    setLive('IDW demo updated.');
  }

  render();
  if (power) power.addEventListener('input', render);
}

  /* Theme (default light) */
  function initTheme(){
    var btn = qs('[data-theme-toggle]');
    var label = qs('[data-theme-label]');
    if (!btn) return;

    function setTheme(t){
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem('theme', t); } catch(e) {}
      btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      if (label) label.textContent = (t === 'dark') ? 'Dark' : 'Light';
    }

    var current = 'light';
    try {
      var stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') current = stored;
    } catch(e) {}

    setTheme(current);

    btn.addEventListener('click', function(){
      var now = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      setTheme(now === 'dark' ? 'light' : 'dark');
    });
  }

  /* Uniform quiz engine (data-quiz) */
  function initQuizzes(){
    var quiz = qs('[data-quiz]');
    if (!quiz) return;

    var feedback = qs('[data-feedback]', quiz);
    var live = qs('[data-live]', quiz);

    function setLive(msg){
      if (live) live.textContent = msg;
    }

    quiz.addEventListener('submit', function(e){
      e.preventDefault();

      var blocks = qsa('[data-question]', quiz);
      if (!blocks.length) return;

      var total = 0;
      var correct = 0;
      var parts = [];

      blocks.forEach(function(q){
        total += 1;
        var id = q.getAttribute('data-question');
        var answer = (q.getAttribute('data-answer') || '').toLowerCase();
        var chosenEl = qs('input[name="'+id+'"]:checked', quiz);
        var chosen = chosenEl ? (chosenEl.value || '').toLowerCase() : '';

        var whyCorrectEl = qs('[data-why-correct]', q);
        var whyWrongEl = qs('[data-why-wrong]', q);
        var whyCorrect = whyCorrectEl ? whyCorrectEl.textContent.trim() : '';
        var whyWrong = whyWrongEl ? whyWrongEl.textContent.trim() : '';

        if (!chosen){
          parts.push(
            '<div class="notice warn"><strong>Question '+escapeHtml(id)+':</strong> No answer selected.'+
            (whyCorrect ? ('<div class="small">'+escapeHtml(whyCorrect)+'</div>') : '')+
            '</div>'
          );
          return;
        }

        if (chosen === answer){
          correct += 1;
          parts.push(
            '<div class="notice good"><strong>Question '+escapeHtml(id)+': Correct.</strong>'+
            (whyCorrect ? ('<div class="small">'+escapeHtml(whyCorrect)+'</div>') : '')+
            '</div>'
          );
        } else {
          parts.push(
            '<div class="notice bad"><strong>Question '+escapeHtml(id)+': Not quite.</strong>'+
            (whyWrong ? ('<div class="small">'+escapeHtml(whyWrong)+'</div>') : '')+
            (whyCorrect ? ('<div class="small"><strong>Why the correct answer works:</strong> '+escapeHtml(whyCorrect)+'</div>') : '')+
            '</div>'
          );
        }
      });

      if (feedback){
        var summary =
          '<div class="card"><strong>Score:</strong> '+correct+' / '+total+
          '<div class="small">Use the explanations below to correct misunderstandings.</div></div>';
        feedback.innerHTML = summary + parts.join('');

        setLive('Quiz graded. Score ' + correct + ' out of ' + total + '.');

        // Move focus to feedback for keyboard users
        feedback.setAttribute('tabindex','-1');
        feedback.focus();
      }
    });

    var resetBtn = qs('[data-reset]', quiz);
    if (resetBtn){
      resetBtn.addEventListener('click', function(){
        try { quiz.reset(); } catch(e) {}
        if (feedback) feedback.innerHTML = '';
        setLive('Quiz cleared.');
      });
    }
  }

  /* Bug report mailto */
  function initBugReport(){
    var links = qsa('[data-bug-report]');
    if (!links.length) return;

    var title = (document.title || 'UPP 461 module').trim();
    var href = (location && location.href) ? location.href : '';
    var subject = 'UPP 461 bug report (Week 12): ' + title;

    var body = ''
      + 'Issue summary:\n\n'
      + 'Steps to reproduce:\n1. \n\n'
      + 'Expected result:\n\n'
      + 'Actual result:\n\n'
      + 'Page: ' + title + '\n'
      + (href ? ('URL: ' + href + '\n') : '')
      + '\nPlease attach a screenshot if possible.\n';

    var mailto = 'mailto:REPLACE_EMAIL'
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);

    links.forEach(function(a){ a.setAttribute('href', mailto); });
  }

  /* Image lightbox (accessible, keyboard-friendly)
     - Click/tap an image to view larger
     - Escape closes, focus returns to trigger
     - Focus is trapped within the dialog while open
  */
  function initImageLightbox(){
    var main = qs('main');
    if (!main) return;

    var imgs = qsa('img[src]:not([data-no-lightbox])', main)
      .filter(function(img){ return !img.closest('a,button'); })
      .filter(function(img){
        var alt = img.getAttribute('alt');
        return alt !== null && alt.trim() !== '';
      });

    if (!imgs.length) return;

    var modal = document.createElement('div');
    modal.className = 'img-lightbox';
    modal.hidden = true;
    modal.innerHTML = ''
      + '<div class="img-lightbox__backdrop" data-close="true"></div>'
      + '<div class="img-lightbox__dialog" role="dialog" aria-modal="true" aria-labelledby="imgLightboxTitle">'
      + '  <div class="img-lightbox__topbar">'
      + '    <h2 id="imgLightboxTitle" class="sr-only">Enlarged image</h2>'
      + '    <button type="button" class="img-lightbox__close" aria-label="Close image">✕</button>'
      + '  </div>'
      + '  <figure class="img-lightbox__figure">'
      + '    <img class="img-lightbox__img" alt="">'
      + '    <figcaption class="img-lightbox__caption" id="imgLightboxCaption"></figcaption>'
      + '  </figure>'
      + '  <div class="img-lightbox__footer">'
      + '    <a class="img-lightbox__open" href="#" target="_blank" rel="noopener">Open image in new tab</a>'
      + '  </div>'
      + '</div>';

    document.body.appendChild(modal);

    var dialog = qs('.img-lightbox__dialog', modal);
    var closeBtn = qs('.img-lightbox__close', modal);
    var modalImg = qs('.img-lightbox__img', modal);
    var caption = qs('.img-lightbox__caption', modal);
    var openLink = qs('.img-lightbox__open', modal);

    var lastFocus = null;
    var siblingsState = [];

    function setSiblingsAriaHidden(hide){
      if (hide){
        siblingsState = [];
        Array.from(document.body.children).forEach(function(el){
          if (el === modal) return;
          var prev = el.getAttribute('aria-hidden');
          siblingsState.push([el, prev]);
          el.setAttribute('aria-hidden', 'true');
        });
      } else {
        siblingsState.forEach(function(pair){
          var el = pair[0], prev = pair[1];
          if (prev === null) el.removeAttribute('aria-hidden');
          else el.setAttribute('aria-hidden', prev);
        });
        siblingsState = [];
      }
    }

    function trapTab(e){
      if (e.key !== 'Tab') return;
      var focusables = qsa('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', dialog)
        .filter(function(el){ return !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'); });
      if (!focusables.length) return;

      var first = focusables[0];
      var last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first){
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last){
        e.preventDefault();
        first.focus();
      }
    }

    function openLightbox(imgEl){
      lastFocus = document.activeElement;
      var src = imgEl.getAttribute('data-lightbox-src') || imgEl.currentSrc || imgEl.src;
      var alt = (imgEl.getAttribute('alt') || '').trim();

      modalImg.src = src;
      modalImg.alt = alt || '';
      caption.textContent = alt || '';
      caption.hidden = !caption.textContent;
      openLink.href = src;

      modal.hidden = false;
      document.body.classList.add('modal-open');
      setSiblingsAriaHidden(true);
      closeBtn.focus();
    }

    function closeLightbox(){
      if (modal.hidden) return;
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      setSiblingsAriaHidden(false);
      modalImg.src = '';
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    closeBtn.addEventListener('click', closeLightbox);
    modal.addEventListener('click', function(e){
      var t = e.target;
      if (t && t.dataset && t.dataset.close === 'true') closeLightbox();
    });
    dialog.addEventListener('keydown', trapTab);
    document.addEventListener('keydown', function(e){
      if (modal.hidden) return;
      if (e.key === 'Escape'){
        e.preventDefault();
        closeLightbox();
      }
    });

    imgs.forEach(function(img){
      var alt = (img.getAttribute('alt') || 'Image').trim() || 'Image';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'img-lightbox-trigger';
      btn.setAttribute('aria-label', 'Enlarge image: ' + alt);

      img.parentNode.insertBefore(btn, img);
      btn.appendChild(img);
      btn.addEventListener('click', function(){ openLightbox(img); });
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    initTheme();
    initBugReport();
    initImageLightbox();
    initQuizzes();
    initScopeDemo();
    initIDWDemo();
  });
})();
