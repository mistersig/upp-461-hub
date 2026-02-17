UPP 461 • Week 9 — Web Module + Slide Deck

This folder is designed to be dropped into your hub repo at:
  /modules/week-09/

Then the module will be available at:
  /modules/week-09/index.html

------------------------------------------------------------
1) GitHub Pages steps (project site)
------------------------------------------------------------
1. Push your hub repo to GitHub.
2. In GitHub: Settings → Pages
3. Build and deployment:
   - Source: Deploy from a branch
   - Branch: main (or your default) / root
4. Save. GitHub Pages will publish your site.

Note: This module uses ONLY RELATIVE paths (no leading “/”), so it will work when nested inside the hub.

------------------------------------------------------------
2) LMS linking guidance
------------------------------------------------------------
LMS = Learning Management System (e.g., Canvas, Blackboard).
Link students to the module start page:
  modules/week-09/index.html

If your LMS supports external links, point to your GitHub Pages URL for that path.

------------------------------------------------------------
3) Replace REPLACE_EMAIL
------------------------------------------------------------
Search/replace:
  REPLACE_EMAIL
with your preferred email address.

The “Report a bug” link auto-fills:
- issue summary
- steps to reproduce
- expected vs actual
- current page URL + filename
- screenshot request

------------------------------------------------------------
4) Add this week into the hub list
------------------------------------------------------------
Add a link to:
  modules/week-09/index.html
in the hub’s /app.js weeks array (or wherever you list weekly modules).

------------------------------------------------------------
Sanity check (relative links used)
------------------------------------------------------------
Home link:
- index.html → ../../index.html
- pages/*.html → ../../../index.html

Week title link:
- index.html → index.html
- pages/*.html → ../index.html

Nav links:
- All relative, no leading “/”
- Assets referenced via ../assets/... from pages, and ./assets/... if ever used in index

