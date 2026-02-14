/* UPP 461 Course Hub — app.js
   - Renders module cards from a single data list
   - Theme toggle with localStorage
   - Bug report mailto link with prefilled template
*/

const STORAGE_KEY = "upp461_theme";

const weeks = [
  { week: 1, title: "Week 1", url: "modules/week-01/index.html" },
  { week: 2, title: "Week 2", url: "modules/week-02/index.html" },
  { week: 3, title: "Week 3", url: "modules/week-03/index.html" },
  { week: 4, title: "Week 4", url: "modules/week-04/index.html" },
  { week: 5, title: "Week 5", url: "modules/week-05/index.html" },
  { week: 6, title: "Week 6 - ", url: "modules/week-06/index.html" },
  { week: 7, title: "Week 7", url: "modules/week-07/index.html" },
  { week: 8, title: "Week 8", url: "modules/week-08/index.html" },
  { week: 9, title: "Week 9", url: "modules/week-09/index.html" },
  { week: 10, title: "Week 10", url: "modules/week-10/index.html" },
  { week: 11, title: "Week 11", url: "modules/week-11/index.html" },
  { week: 12, title: "Week 12", url: "modules/week-12/index.html" },
];

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");

  const btn = document.getElementById("themeToggle");
  const icon = btn?.querySelector(".toggle-icon");
  const text = btn?.querySelector(".toggle-text");

  if (btn) btn.setAttribute("aria-pressed", String(isDark));
  if (icon) icon.textContent = isDark ? "☀️" : "🌙";
  if (text) text.textContent = isDark ? "Light theme" : "Dark theme";
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const theme = saved === "dark" ? "dark" : "light"; // light default
  applyTheme(theme);

  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
    });
  }
}

function renderWeeks() {
  const grid = document.getElementById("weeksGrid");
  if (!grid) return;

  const frag = document.createDocumentFragment();

  weeks.forEach(({ week, title, url }) => {
    const li = document.createElement("li");
    li.className = "card";

    const top = document.createElement("div");
    top.className = "card-top";

    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = `Week ${String(week).padStart(2, "0")}`;

    const status = document.createElement("span");
    status.className = "pill";
    status.textContent = "Module";
    status.setAttribute("aria-label", "Module card");

    top.appendChild(pill);
    top.appendChild(status);

    const h3 = document.createElement("h3");
    h3.textContent = title;

    const a = document.createElement("a");
    a.className = "btn";
    a.href = url;
    a.textContent = "Open module";
    a.setAttribute("aria-label", `Open Week ${week}: ${title}`);

    li.appendChild(top);
    li.appendChild(h3);
    li.appendChild(a);

    frag.appendChild(li);
  });

  grid.innerHTML = "";
  grid.appendChild(frag);
}

function setBugMailto() {
  const bugLink = document.getElementById("bugLink");
  if (!bugLink) return;

  const subject = "UPP 461 Course Hub Bug Report";
  const bodyLines = [
    "Issue:",
    "Steps to reproduce:",
    "Expected:",
    "Actual:",
    "Page:",
    "Please attach a screenshot:"
  ];

  const params = new URLSearchParams({
    subject,
    body: bodyLines.join("\n")
  });

  bugLink.href = `mailto:REPLACE_EMAIL?${params.toString()}`;
}

function main() {
  initTheme();
  renderWeeks();
  setBugMailto();
}

document.addEventListener("DOMContentLoaded", main);
