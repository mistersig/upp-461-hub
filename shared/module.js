/* UPP 461 module core JS (no build tools). 
   - Light default + accessible dark toggle (persists)
   - Bug-report mailto template
   - Simple quiz scoring with per-question feedback
*/
(function(){
  const STORAGE_KEY = "upp461_theme";

  function safeGet(key){
    try { return localStorage.getItem(key); } catch(e){ return null; }
  }
  function safeSet(key, val){
    try { localStorage.setItem(key, val); } catch(e){}
  }

  function applyTheme(theme, persist){
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (persist) safeSet(STORAGE_KEY, theme);

    const label = document.querySelector("[data-theme-label]");
    const btn = document.querySelector("[data-theme-toggle]");
    if (btn) btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    if (label) label.textContent = theme === "dark" ? "Light theme" : "Dark theme";
  }

  function initTheme(){
    const saved = safeGet(STORAGE_KEY);
    const theme = saved === "dark" ? "dark" : "light";
    applyTheme(theme, false);

    const btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    btn.addEventListener("click", function(){
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next, true);
    });
  }

  function setBugMailto(){
    const link = document.querySelector("[data-bug-link]");
    if (!link) return;

    const page = location.pathname.split("/").slice(-2).join("/");
    const subject = encodeURIComponent("UPP 461 module bug report");
    const body = encodeURIComponent(
`Issue summary:
Steps to reproduce:
Expected:
Actual:
Page: ${page}
Screenshot link (optional):`
    );

    link.href = `mailto:REPLACE_EMAIL?subject=${subject}&body=${body}`;
  }

  function initQuiz(){
    const form = document.querySelector("[data-quiz-form]");
    if (!form) return;

    const result = document.querySelector("[data-quiz-result]");
    const feedback = document.querySelector("[data-quiz-feedback]");

    form.addEventListener("submit", function(e){
      e.preventDefault();

      const questions = Array.from(form.querySelectorAll("fieldset[data-q]"));
      let correct = 0;
      const lines = [];

      questions.forEach((fs, idx) => {
        const qid = fs.getAttribute("data-q");
        const answer = fs.getAttribute("data-answer"); // value of correct option
        const whyCorrect = fs.getAttribute("data-why-correct") || "Correct.";
        const whyWrong = fs.getAttribute("data-why-wrong") || "Not quite.";

        const chosen = form.querySelector(`input[name="${qid}"]:checked`);
        const chosenVal = chosen ? chosen.value : null;

        if (chosenVal === answer) correct += 1;

        const qTitle = fs.querySelector("legend") ? fs.querySelector("legend").textContent.trim() : `Question ${idx+1}`;
        const isCorrect = chosenVal === answer;
        const symbol = isCorrect ? "✅" : "❌";

        const chosenText = chosen ? (chosen.closest("label") ? chosen.closest("label").textContent.trim() : chosenVal) : "No answer selected";
        const correctInput = form.querySelector(`input[name="${qid}"][value="${answer}"]`);
        const correctText = correctInput && correctInput.closest("label") ? correctInput.closest("label").textContent.trim() : answer;

        lines.push(
          `<div class="quiz-item" role="group" aria-label="${qTitle}">
            <h3 class="quiz-q">${symbol} ${escapeHtml(qTitle)}</h3>
            <p><strong>Your answer:</strong> ${escapeHtml(chosenText)}</p>
            <p><strong>Correct answer:</strong> ${escapeHtml(correctText)}</p>
            <p class="${isCorrect ? "ok" : "bad"}">${escapeHtml(isCorrect ? whyCorrect : whyWrong)}</p>
          </div>`
        );
      });

      const total = questions.length;
      if (result) result.textContent = `Final score: ${correct}/${total}`;
      if (feedback) feedback.innerHTML = lines.join("");
      if (result) result.focus && result.focus();
    });
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function main(){
    initTheme();
    setBugMailto();
    initQuiz();
  }

  document.addEventListener("DOMContentLoaded", main);
})();