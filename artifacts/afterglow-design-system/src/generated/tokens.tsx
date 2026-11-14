/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#fff6ee",
      "foreground": "#17121f",
      "border": "rgba(23,18,31,0.12)",
      "card": "#ffffff",
      "cardForeground": "#17121f",
      "popover": "#ffffff",
      "popoverForeground": "#17121f",
      "primary": "#ff4fa3",
      "primaryForeground": "#17121f",
      "secondary": "rgba(255,255,255,0.92)",
      "secondaryForeground": "#17121f",
      "muted": "rgba(255,255,255,0.72)",
      "mutedForeground": "#5c5370",
      "accent": "rgba(255,255,255,0.92)",
      "accentForeground": "#17121f",
      "destructive": "#d61f3a",
      "destructiveForeground": "#ffffff",
      "input": "rgba(23,18,31,0.12)",
      "ring": "#c2006a",
      "chart1": "#ff4fa3",
      "chart2": "#c6ff3d",
      "chart3": "#ffd23d",
      "chart4": "#3de0ff",
      "chart5": "#b28cff",
      "sidebar": "#fff6ee",
      "sidebarForeground": "#17121f",
      "sidebarBorder": "rgba(23,18,31,0.12)",
      "sidebarPrimary": "#ff4fa3",
      "sidebarPrimaryForeground": "#17121f",
      "sidebarAccent": "rgba(255,255,255,0.92)",
      "sidebarAccentForeground": "#17121f",
      "sidebarRing": "#c2006a"
    },
    "dark": {
      "background": "#0e0b16",
      "foreground": "#fbf7ff",
      "border": "rgba(255,255,255,0.16)",
      "card": "#1a1528",
      "cardForeground": "#fbf7ff",
      "popover": "#1a1528",
      "popoverForeground": "#fbf7ff",
      "primary": "#ff4fa3",
      "primaryForeground": "#17121f",
      "secondary": "rgba(255,255,255,0.14)",
      "secondaryForeground": "#fbf7ff",
      "muted": "rgba(255,255,255,0.08)",
      "mutedForeground": "#b8afc8",
      "accent": "rgba(255,255,255,0.14)",
      "accentForeground": "#fbf7ff",
      "destructive": "#ff5c5c",
      "destructiveForeground": "#17121f",
      "input": "rgba(255,255,255,0.16)",
      "ring": "#c6ff3d",
      "chart1": "#ff4fa3",
      "chart2": "#c6ff3d",
      "chart3": "#ffd23d",
      "chart4": "#3de0ff",
      "chart5": "#b28cff",
      "sidebar": "#0e0b16",
      "sidebarForeground": "#fbf7ff",
      "sidebarBorder": "rgba(255,255,255,0.16)",
      "sidebarPrimary": "#ff4fa3",
      "sidebarPrimaryForeground": "#17121f",
      "sidebarAccent": "rgba(255,255,255,0.14)",
      "sidebarAccentForeground": "#fbf7ff",
      "sidebarRing": "#c6ff3d"
    }
  },
  "fontFamily": {
    "sans": [
      "DM Sans",
      "system-ui",
      "-apple-system",
      "sans-serif"
    ],
    "display": [
      "Bricolage Grotesque",
      "Arial Black",
      "system-ui",
      "sans-serif"
    ],
    "serif": [
      "Instrument Serif",
      "Georgia",
      "serif"
    ],
    "mono": [
      "ui-monospace",
      "SFMono-Regular",
      "Menlo",
      "Consolas",
      "monospace"
    ]
  },
  "radius": "24px",
  "spacing": "0.25rem",
  "fontImport": "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=DM+Sans:opsz,wght@9..40,400..700&family=Instrument+Serif:ital@1&display=swap",
  "source": {
    "name": "Afterglow",
    "version": 1,
    "color": {
      "themes": [
        {
          "id": "dark",
          "name": "Night out"
        },
        {
          "id": "light",
          "name": "Day party"
        }
      ],
      "tokens": [
        {
          "name": "bg",
          "value": {
            "dark": "#0e0b16",
            "light": "#fff6ee"
          },
          "usage": "Page background: a clean, solid deep-ink ground (cream in Day party) that lets full-value color blocks pop, exactly as on the cover. Aura glows are optional."
        },
        {
          "name": "bg-raised",
          "value": {
            "dark": "#1a1528",
            "light": "#ffffff"
          },
          "usage": "Solid raised surfaces where blur is unavailable or too costly (long lists, Android fallbacks)."
        },
        {
          "name": "glass",
          "value": {
            "dark": "rgba(255,255,255,0.08)",
            "light": "rgba(255,255,255,0.72)"
          },
          "usage": "Frosted panel fill. Always use with backdrop-filter blur(var(--blur-glass)) and a line border."
        },
        {
          "name": "glass-strong",
          "value": {
            "dark": "rgba(255,255,255,0.14)",
            "light": "rgba(255,255,255,0.92)"
          },
          "usage": "Hover/pressed glass, sheets and modals that sit above other glass."
        },
        {
          "name": "line",
          "value": {
            "dark": "rgba(255,255,255,0.16)",
            "light": "rgba(23,18,31,0.12)"
          },
          "usage": "1px borders on glass, dividers, input outlines at rest."
        },
        {
          "name": "ink",
          "value": {
            "dark": "#fbf7ff",
            "light": "#17121f"
          },
          "usage": "Primary text and icons on bg, bg-raised and glass in both themes."
        },
        {
          "name": "ink-muted",
          "value": {
            "dark": "#b8afc8",
            "light": "#5c5370"
          },
          "usage": "Secondary text (meta, captions, hints) on bg and glass; 4.5:1+ in both themes."
        },
        {
          "name": "pop",
          "value": "#ff4fa3",
          "usage": "Hero accent: the primary action, the brand moment. Fill only; text on it is on-bright."
        },
        {
          "name": "pop-ink",
          "value": {
            "dark": "#ff86c0",
            "light": "#c2006a"
          },
          "usage": "Pink when it has to be text or a link on bg / glass (pop itself is too light for text on Day party)."
        },
        {
          "name": "zap",
          "value": "#c6ff3d",
          "usage": "Electric lime. 'Going' state, success, secondary celebratory actions. Fill only, with on-bright text."
        },
        {
          "name": "sun",
          "value": "#ffd23d",
          "usage": "Warm yellow. 'Maybe' state, highlights, stickers. Fill only."
        },
        {
          "name": "sky",
          "value": "#3de0ff",
          "usage": "Cyan accent for color blocks, posters, avatars and stickers. Fill only."
        },
        {
          "name": "grape",
          "value": "#b28cff",
          "usage": "Soft violet for color blocks, posters, avatars and stickers. Fill only; never blended with sky in a gradient."
        },
        {
          "name": "on-bright",
          "value": "#17121f",
          "usage": "Text, icons and sticker outlines on any neon fill (pop, zap, sun, sky, grape). Never white on neon."
        },
        {
          "name": "danger",
          "value": {
            "dark": "#ff5c5c",
            "light": "#d61f3a"
          },
          "usage": "Errors and destructive confirmations only. Text-safe on bg in both themes."
        },
        {
          "name": "focus",
          "value": {
            "dark": "#c6ff3d",
            "light": "#c2006a"
          },
          "usage": "Keyboard focus ring: 3px solid, 3px offset."
        },
        {
          "name": "aura-1",
          "value": {
            "dark": "rgba(255,79,163,0.16)",
            "light": "rgba(255,79,163,0.10)"
          },
          "usage": "Optional faint pink glow (opt in with ag-root--aura) behind glass-heavy screens; also the pink focus halo on inputs. Never strong enough to tint the color blocks."
        },
        {
          "name": "aura-2",
          "value": {
            "dark": "rgba(255,210,61,0.10)",
            "light": "rgba(255,210,61,0.14)"
          },
          "usage": "Optional faint warm glow paired with aura-1 (opt in with ag-root--aura)."
        }
      ]
    },
    "type": {
      "fonts": [],
      "families": {
        "display": "\"Bricolage Grotesque\", \"Arial Black\", system-ui, sans-serif",
        "body": "\"DM Sans\", system-ui, -apple-system, sans-serif",
        "accent": "\"Instrument Serif\", Georgia, serif"
      },
      "groups": [
        {
          "name": "Display",
          "family": "display",
          "styles": [
            {
              "name": "display-xl",
              "fontSize": "64px",
              "lineHeight": "60px",
              "fontWeight": 800,
              "letterSpacing": "-0.03em",
              "sample": "Rooftop szn ☀️",
              "usage": "Event titles on posters and hero moments. One per screen."
            },
            {
              "name": "display-lg",
              "fontSize": "44px",
              "lineHeight": "44px",
              "fontWeight": 800,
              "letterSpacing": "-0.025em",
              "sample": "You're invited",
              "usage": "Screen titles, invite headers."
            },
            {
              "name": "title",
              "fontSize": "28px",
              "lineHeight": "32px",
              "fontWeight": 700,
              "letterSpacing": "-0.015em",
              "sample": "Who's going",
              "usage": "Section headers, card titles."
            }
          ]
        },
        {
          "name": "Text",
          "family": "body",
          "styles": [
            {
              "name": "body-lg",
              "fontSize": "18px",
              "lineHeight": "26px",
              "fontWeight": 500,
              "sample": "Bring snacks, bring friends, bring the vibes.",
              "usage": "Invite descriptions, intro copy."
            },
            {
              "name": "body",
              "fontSize": "16px",
              "lineHeight": "24px",
              "fontWeight": 400,
              "sample": "Saturday at 8pm · The roof at Mika's",
              "usage": "Default UI text."
            },
            {
              "name": "label",
              "fontSize": "14px",
              "lineHeight": "20px",
              "fontWeight": 600,
              "sample": "Going · 24",
              "usage": "Buttons (small), field labels, tabs, counts."
            },
            {
              "name": "caption",
              "fontSize": "12px",
              "lineHeight": "16px",
              "fontWeight": 500,
              "letterSpacing": "0.02em",
              "sample": "Hosted by Ariel",
              "usage": "Timestamps, helper text, sticker text."
            }
          ]
        },
        {
          "name": "Accent",
          "family": "accent",
          "styles": [
            {
              "name": "flourish",
              "fontSize": "36px",
              "lineHeight": "40px",
              "fontWeight": 400,
              "fontStyle": "italic",
              "sample": "obviously",
              "usage": "One or two words of personality inside a display line. Never a full sentence."
            }
          ]
        }
      ]
    },
    "spacing": {
      "tokens": [
        {
          "name": "space-1",
          "value": "4px",
          "usage": "Icon-to-label nudge, avatar overlap offsets."
        },
        {
          "name": "space-2",
          "value": "8px",
          "usage": "Gap between chips, inline elements."
        },
        {
          "name": "space-3",
          "value": "12px",
          "usage": "Gap between buttons in a row, RSVP options."
        },
        {
          "name": "space-4",
          "value": "16px",
          "usage": "Card padding (compact), list row padding."
        },
        {
          "name": "space-5",
          "value": "20px",
          "usage": "Button horizontal padding, field padding."
        },
        {
          "name": "space-6",
          "value": "24px",
          "usage": "Card padding (default), screen side margins."
        },
        {
          "name": "space-8",
          "value": "32px",
          "usage": "Gap between sections."
        },
        {
          "name": "space-12",
          "value": "48px",
          "usage": "Hero breathing room, top of screen."
        }
      ]
    },
    "radius": {
      "tokens": [
        {
          "name": "radius-sm",
          "value": "10px",
          "usage": "Small chips, inputs inside cards."
        },
        {
          "name": "radius-md",
          "value": "16px",
          "usage": "Inputs, list rows, small cards."
        },
        {
          "name": "radius-lg",
          "value": "24px",
          "usage": "Glass cards, sheets."
        },
        {
          "name": "radius-xl",
          "value": "32px",
          "usage": "Event posters, hero cards."
        },
        {
          "name": "radius-pill",
          "value": "999px",
          "usage": "Buttons, RSVP options, stickers, avatars. Default for anything tappable."
        }
      ]
    },
    "shadow": {
      "tokens": [
        {
          "name": "glow-pop",
          "value": {
            "dark": "0 8px 32px rgba(255,79,163,0.45)",
            "light": "0 8px 24px rgba(255,79,163,0.35)"
          },
          "usage": "Under the primary pop button only."
        },
        {
          "name": "glow-zap",
          "value": {
            "dark": "0 8px 28px rgba(198,255,61,0.35)",
            "light": "0 6px 20px rgba(120,170,0,0.28)"
          },
          "usage": "Under a selected 'Going' RSVP and zap buttons."
        },
        {
          "name": "shadow-card",
          "value": {
            "dark": "0 16px 48px rgba(0,0,0,0.45)",
            "light": "0 12px 32px rgba(70,20,60,0.12)"
          },
          "usage": "Glass cards and event posters floating over the aura."
        }
      ]
    },
    "blur": {
      "tokens": [
        {
          "name": "blur-glass",
          "value": "20px",
          "usage": "backdrop-filter on glass panels, buttons and nav bars."
        },
        {
          "name": "blur-heavy",
          "value": "40px",
          "usage": "Full-screen modal backdrops and blurred poster backgrounds."
        }
      ]
    }
  },
  "motion": {
    "duration": {
      "fast": "120ms",
      "base": "220ms",
      "slow": "360ms"
    },
    "easing": {
      "standard": "cubic-bezier(.22, 1, .36, 1)",
      "bounce": "cubic-bezier(.34, 1.56, .64, 1)"
    }
  },
  "elevation": {
    "light": {
      "sm": "0 1px 2px rgba(70,20,60,0.08)",
      "md": "0 6px 16px rgba(70,20,60,0.10)",
      "lg": "0 12px 32px rgba(70,20,60,0.12)"
    },
    "dark": {
      "sm": "0 1px 2px rgba(0,0,0,0.40)",
      "md": "0 8px 24px rgba(0,0,0,0.40)",
      "lg": "0 16px 48px rgba(0,0,0,0.45)"
    }
  }
} as const;

export type Tokens = typeof tokens;
export default tokens;
