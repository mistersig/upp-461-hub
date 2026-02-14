/* SRS module JS (no build tools). Works from file:// and GitHub Pages. */
(function(){
  function safeGet(key){
    try { return localStorage.getItem(key); } catch(e){ return null; }
  }
  function safeSet(key, val){
    try { localStorage.setItem(key, val); } catch(e){}
  }

  function applyTheme(theme, persist){
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (persist) safeSet('theme', theme);

    var label = document.querySelector('[data-theme-label]');
    var btn = document.querySelector('[data-theme-toggle]');
    if (label) label.textContent = (theme === 'dark') ? 'Dark' : 'Light';
    if (btn) btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }

  function initTheme(){
    var stored = safeGet('theme');
    var initial = (stored === 'dark' || stored === 'light') ? stored : 'light';
    applyTheme(initial, false);

    var btn = document.querySelector('[data-theme-toggle]');
    if (btn){
      btn.addEventListener('click', function(){
        var current = document.documentElement.getAttribute('data-theme') || 'light';
        var next = (current === 'dark') ? 'light' : 'dark';
        applyTheme(next, true);
      });
    }
  }

  // Decimal degrees <-> DMS helper (student-facing)
  function toDMS(dec){
    var sign = dec < 0 ? -1 : 1;
    var abs = Math.abs(dec);
    var deg = Math.floor(abs);
    var minFloat = (abs - deg) * 60;
    var min = Math.floor(minFloat);
    var sec = (minFloat - min) * 60;
    return { sign: sign, deg: deg, min: min, sec: sec };
  }
  function dmsToDec(deg, min, sec, sign){
    var d = Math.abs(deg) + (Math.abs(min) / 60) + (Math.abs(sec) / 3600);
    return (sign < 0 ? -d : d);
  }

  function parseDmsText(text){
    var t = (text || '').trim().toUpperCase();
    if (!t) return null;

    // Hemisphere letter (N/S/E/W) or leading sign
    var hemi = null;
    var m = t.match(/[NSEW]/);
    if (m) hemi = m[0];

    var nums = t.match(/-?\d+(?:\.\d+)?/g) || [];
    if (nums.length === 0) return null;

    var deg = parseFloat(nums[0]);
    var min = nums.length > 1 ? parseFloat(nums[1]) : 0;
    var sec = nums.length > 2 ? parseFloat(nums[2]) : 0;
    if ([deg,min,sec].some(function(x){ return Number.isNaN(x); })) return null;

    var sign = 1;
    if (deg < 0) sign = -1;
    if (hemi === 'S' || hemi === 'W') sign = -1;
    if (hemi === 'N' || hemi === 'E') sign = 1;
    return { deg: Math.abs(deg), min: Math.abs(min), sec: Math.abs(sec), sign: sign, hemi: hemi };
  }

  function axisLimits(axis){
    return axis === 'lat' ? 90 : 180;
  }

  function initConverter(){
    var form = document.querySelector('[data-converter]');
    if (!form) return;

    var live = form.querySelector('[data-live]');
    function announce(msg){
      if (live) live.textContent = msg;
    }

    var axisSel = form.querySelector('select[name="axis"]');
    var decInput = form.querySelector('input[name="dec"]');
    var dmsText = form.querySelector('input[name="dmsText"]');
    var degInput = form.querySelector('input[name="deg"]');
    var minInput = form.querySelector('input[name="min"]');
    var secInput = form.querySelector('input[name="sec"]');
    var hemiSel = form.querySelector('select[name="hemi"]');

    var outDec2 = form.querySelector('[data-out-dec2dms]');
    var outDms2 = form.querySelector('[data-out-dms2dec]');

    // Keep hemisphere choices aligned to axis (lat => N/S, lon => E/W)
    function syncHemiOptions(){
      if (!hemiSel || !axisSel) return;
      var axis = axisSel.value;
      var want = (axis === 'lat') ? ['N','S'] : ['E','W'];
      var current = hemiSel.value;
      hemiSel.innerHTML = want.map(function(h){ return '<option value="'+h+'">'+h+'</option>'; }).join('');
      hemiSel.value = want.includes(current) ? current : want[0];
    }
    if (axisSel) axisSel.addEventListener('change', syncHemiOptions);
    syncHemiOptions();

    function setNotice(target, kind, html){
      if (!target) return;
      target.innerHTML = '<div class="notice ' + kind + '">' + html + '</div>';
    }

    function inferHemisphere(axis, sign){
      if (axis === 'lat') return sign < 0 ? 'S' : 'N';
      return sign < 0 ? 'W' : 'E';
    }

    function validateRange(axis, dec){
      var lim = axisLimits(axis);
      return Math.abs(dec) <= lim;
    }

    function doDecToDms(){
      var axis = axisSel ? axisSel.value : 'lat';
      var raw = (decInput ? decInput.value : '').trim();
      var dec = parseFloat(raw);
      if (!raw || Number.isNaN(dec)){
        setNotice(outDec2, 'bad', '<strong>Enter a valid decimal degree value.</strong> Example: <code>41.881832</code>');
        announce('Error: enter a valid decimal degree value.');
        return;
      }
      if (!validateRange(axis, dec)){
        setNotice(outDec2, 'bad', '<strong>Out of range.</strong> ' +
          (axis === 'lat' ? 'Latitude must be between -90 and 90.' : 'Longitude must be between -180 and 180.'));
        announce('Error: value out of range.');
        return;
      }

      var r = toDMS(dec);
      var hemi = inferHemisphere(axis, r.sign);
      // Populate DMS fields for convenience
      if (degInput) degInput.value = String(r.deg);
      if (minInput) minInput.value = String(r.min);
      if (secInput) secInput.value = String(r.sec.toFixed(3));
      if (hemiSel) hemiSel.value = hemi;
      if (dmsText) dmsText.value = r.deg + ' ' + r.min + ' ' + r.sec.toFixed(3) + ' ' + hemi;

      setNotice(outDec2, 'good', '<strong>DMS:</strong> ' + r.deg + '° ' + r.min + "' " + r.sec.toFixed(3) + '" ' + hemi);
      announce('Converted decimal degrees to degrees minutes seconds.');
    }

    function getDmsFromFieldsOrText(){
      var text = (dmsText ? dmsText.value : '').trim();
      if (text){
        return parseDmsText(text);
      }
      var deg = parseFloat(degInput ? degInput.value : '');
      var min = parseFloat(minInput ? minInput.value : '');
      var sec = parseFloat(secInput ? secInput.value : '');
      if ([deg,min,sec].some(function(x){ return Number.isNaN(x); })) return null;
      var hemi = hemiSel ? hemiSel.value : null;
      var sign = (hemi === 'S' || hemi === 'W') ? -1 : 1;
      return { deg: Math.abs(deg), min: Math.abs(min), sec: Math.abs(sec), sign: sign, hemi: hemi };
    }

    function doDmsToDec(){
      var axis = axisSel ? axisSel.value : 'lat';
      var parsed = getDmsFromFieldsOrText();
      if (!parsed){
        setNotice(outDms2, 'bad', '<strong>Enter DMS values.</strong> You can either fill degrees/minutes/seconds or paste a DMS string (example: <code>41 52 54.6 N</code>).');
        announce('Error: enter DMS values.');
        return;
      }
      if (parsed.min >= 60 || parsed.sec >= 60){
        setNotice(outDms2, 'bad', '<strong>Minutes and seconds must be less than 60.</strong>');
        announce('Error: invalid minutes or seconds.');
        return;
      }
      if (parsed.deg > axisLimits(axis)){
        setNotice(outDms2, 'bad', '<strong>Degrees out of range.</strong> ' +
          (axis === 'lat' ? 'Latitude degrees cannot exceed 90.' : 'Longitude degrees cannot exceed 180.'));
        announce('Error: degrees out of range.');
        return;
      }

      var dec = dmsToDec(parsed.deg, parsed.min, parsed.sec, parsed.sign);
      if (!validateRange(axis, dec)){
        setNotice(outDms2, 'bad', '<strong>Out of range.</strong> Double-check your hemisphere (N/S/E/W).');
        announce('Error: value out of range.');
        return;
      }

      // Populate decimal field for convenience
      if (decInput) decInput.value = dec.toFixed(6);
      setNotice(outDms2, 'good', '<strong>Decimal degrees:</strong> ' + dec.toFixed(6));
      announce('Converted degrees minutes seconds to decimal degrees.');
    }

    // Buttons
    var btnDec2 = form.querySelector('[data-dec2dms]');
    var btnDms2 = form.querySelector('[data-dms2dec]');
    if (btnDec2) btnDec2.addEventListener('click', function(){ doDecToDms(); });
    if (btnDms2) btnDms2.addEventListener('click', function(){ doDmsToDec(); });

    // Submit = auto: prefer decimal if present, otherwise DMS
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var rawDec = (decInput ? decInput.value : '').trim();
      var rawDms = (dmsText ? dmsText.value : '').trim();
      if (rawDec) doDecToDms();
      else if (rawDms || (degInput && degInput.value.trim())) doDmsToDec();
      else {
        setNotice(outDec2, 'bad', '<strong>Enter either a decimal degree value or a DMS value.</strong>');
        announce('Error: enter a value to convert.');
      }
    });
  }

  function initQuizzes(){
    var quiz = document.querySelector('[data-quiz]');
    if (!quiz) return;

    var feedback = quiz.querySelector('[data-feedback]');
    var live = quiz.querySelector('[data-live]');
    function setLive(msg){
      if (live) live.textContent = msg;
    }

    quiz.addEventListener('submit', function(e){
      e.preventDefault();
      var total = 0, correct = 0;
      var blocks = quiz.querySelectorAll('[data-question]');
      var parts = [];

      blocks.forEach(function(q){
        total += 1;
        var id = q.getAttribute('data-question');
        var answer = q.getAttribute('data-answer'); // correct value
        var chosen = (quiz.querySelector('input[name="'+id+'"]:checked') || {}).value;

        var whyCorrect = q.querySelector('[data-why-correct]').textContent.trim();
        var whyWrong = q.querySelector('[data-why-wrong]').textContent.trim();

        if (!chosen){
          parts.push('<div class="notice warn"><strong>Question '+id+':</strong> No answer selected. '+
                     '<div class="small">'+escapeHtml(whyCorrect)+'</div></div>');
          return;
        }

        if (chosen === answer){
          correct += 1;
          parts.push('<div class="notice good"><strong>Question '+id+': Correct.</strong> '+
                     '<div class="small">'+escapeHtml(whyCorrect)+'</div></div>');
        } else {
          parts.push('<div class="notice bad"><strong>Question '+id+': Not quite.</strong> '+
                     '<div class="small">'+escapeHtml(whyWrong)+'</div>'+
                     '<div class="small"><strong>Why the correct answer works:</strong> '+escapeHtml(whyCorrect)+'</div></div>');
        }
      });

      var summary = '<div class="card"><strong>Score:</strong> '+correct+' / '+total+
                    '<div class="small">Use the explanations below to correct misunderstandings.</div></div>';
      feedback.innerHTML = summary + parts.join('');
      setLive('Quiz graded. Score ' + correct + ' out of ' + total + '.');

      // Move focus to feedback for keyboard users
      feedback.setAttribute('tabindex','-1');
      feedback.focus();
    });

    // Reset button
    var resetBtn = quiz.querySelector('[data-reset]');
    if (resetBtn){
      resetBtn.addEventListener('click', function(){
        var feedback = quiz.querySelector('[data-feedback]');
        if (feedback) feedback.innerHTML = '';
        setLive('Quiz cleared.');
      });
    }
  }

  function escapeHtml(str){
    return (str || '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  
  function initBugReport(){
    var links = document.querySelectorAll('[data-bug-report]');
    if (!links || links.length === 0) return;

    var title = (document.title || 'SRS module').trim();
    var href = (location && location.href) ? location.href : '';
    var subject = 'SRS module bug report: ' + title;

    var body = ''
      + 'Issue:\n\n'
      + 'Steps to reproduce:\n1. \n\n'
      + 'Expected result:\n\n'
      + 'Actual result:\n\n'
      + 'Page: ' + title + '\n'
      + (href ? ('URL: ' + href + '\n') : '')
      + '\nPlease attach a screenshot if possible.\n';

    var mailto = 'mailto:REPLACE_EMAIL'
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);

    links.forEach(function(a){
      a.setAttribute('href', mailto);
    });
  }

// init
  document.addEventListener('DOMContentLoaded', function(){
    initTheme();
    initConverter();
    initQuizzes();
    initBugReport();
  });
})();
