# RsvpPicker

A row of big emoji options for picking one answer, like Going, Maybe or Can't go. Picking one fills it with color and wiggles the emoji.

- **Defaults:** `going` (zap fill with glow), `maybe` (sun) and `cant` (grape). Pass `options` with your own `{id, emoji, label}` for other choices with 2–4 options, such as "Open to chat / Busy / Not now". Ids other than the three defaults get the glass style when selected unless you add a tone class.
- **State:** uncontrolled with `defaultValue`, or controlled with `value` plus `onChange`.
- **Accessibility:** it renders as a `radiogroup`, so pass a `label` when "RSVP" isn't accurate. Every emoji has a text label.
- **The page provides:** persistence and any follow-up celebration (toast, confetti).
