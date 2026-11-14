# Provenance

The authoritative source is the user-uploaded Afterglow design system, kept
verbatim in `docs/references/uploaded-system/` (tokens.json, README, component
bundle CSS/JS, and family READMEs). It supersedes the earlier proposal entirely.

- `tokens.json` maps the source colors, type, spacing, radius, blur, depth and
  motion into standard roles, and keeps the full source under
  `$extensions.afterglow.source`.
- `scripts/source/afterglow-components.css` is the source bundle CSS (minus its
  font import, which `typography.fontImport` provides).
- Source component families are reauthored as typed React in
  `src/components/afterglow/`; the uploaded global JS bundle is never executed.
- Emoji used in stories come only from the source (🎉🤔😢☀️🔥).
