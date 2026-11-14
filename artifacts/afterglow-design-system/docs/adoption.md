# Adoption

- The live Afterglow app (`artifacts/afterglow`) consumes this package directly:
  it imports `@workspace/afterglow-design-system/styles.css`, the source families
  from `components/afterglow/*`, and compatibility controls from `components/ui/*`.
- Night out (dark) is the default theme; a header switch toggles Day party (light).
  The app persists the choice under its own storage key (`afterglow-app-theme`).
- Canvas was not changed by this adoption. Future mockups can use the
  mockup-sandbox design-systems flow when separately requested.
