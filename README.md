# upp-461-hub | UPP 461 Course Hub + Weekly Modules (GitHub Pages-ready)
Online support modules for upp-461
This repository is a **static course website** for **UPP 461 (Intro to GIS)** designed to be hosted on **GitHub Pages**. It includes:

- A **course hub home page** (root `index.html`)
- **12 weekly module folders** (`modules/week-01/` … `modules/week-12/`)
- **Week 06** is fully built (Spatial Reference Systems)
- All other weeks are **placeholders** (so you have the structure ready)

Everything is built with **plain HTML/CSS/JavaScript** (no build tools required).

---

## Features

### Accessibility (ADA / WCAG 2.1-minded)
- Skip link for keyboard users
- Visible focus states (`:focus-visible`)
- Logical heading structure
- Reduced-motion support
- High-contrast friendly theme system (Light default + Dark toggle)
- Quiz feedback that does **not** rely on color alone

### Standard module pattern
Each week’s module follows the same structure:
- **Start here**
- Lesson pages
- **Summary**
- **Quick quiz** (shows final score + per-question feedback)

### “Next section” button (more prominent)
All modules use a more prominent **Next section** button, aligned to the **right**, with a large click/tap target.

---

## Repository structure

```text
/
├─ index.html                # Course hub
├─ style.css                 # Course hub styles
├─ app.js                    # Course hub module list + settings
├─ shared/
│  ├─ module.css             # Shared styles used by placeholder modules
│  └─ module.js              # Shared JS used by placeholder modules
└─ modules/
   ├─ week-01/ ... week-12/
   │  ├─ index.html
   │  ├─ style.css
   │  ├─ app.js
   │  ├─ pages/
   │  │  ├─ 01-start-here.html
   │  │  ├─ 02-lesson.html
   │  │  ├─ 03-summary.html
   │  │  └─ 04-quiz.html
   │  ├─ assets/             # Week-specific images/files live here
   │  ├─ README.txt
   │  └─ MODULE_BUILDER_PROMPT.md
   └─ week-06/               # Fully built module (Spatial Reference Systems)
      ├─ pages/ (multiple lesson pages + quiz + summary)
      ├─ assets/ (images used in Week 06)
      └─ webmap.js (Leaflet activity)
