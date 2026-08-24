---
name: aewol-ui-taste
description: >-
  Aewol frontend UI work. Use when editing Vue views, layouts, styling, tokens,
  copy, or components in aewol-frontend. Keeps the existing brand and blocks
  landing-page AI slop.
---

# Aewol UI taste

Reading this as: existing pet-care finance **product app** (not a landing page) for members who need to trust money and care records, with a calm Korean consumer language, leaning toward the current navy/olive tokens + Pretendard.

Dials for this repo: `DESIGN_VARIANCE 4` / `MOTION_INTENSITY 3` / `VISUAL_DENSITY 6`. Preserve the brand. Do not overhaul.

## Do

- Follow `.cursor/skills/redesign-existing-projects/SKILL.md` (audit, then small upgrades).
- Keep `--color-navy`, `--color-leaf` / olive, `--color-app-bg`, Pretendard, existing radius/space tokens.
- Prefer targeted CSS/token/component changes over rewriting screens.
- User-facing copy stays Korean, sentence case, no marketing cliches.
- Motion stays GPU (`transform`/`opacity`), and honors `prefers-reduced-motion`.

## Do not

- Do not apply `design-taste-frontend` landing defaults (React/RSC, GSAP, Geist/Outfit, zig-zag marketing grids, grain overlays, glass everywhere).
- Do not swap the typeface or the green/navy palette.
- Do not turn wallet/home action rows (충전 / QR / 조회) into a 2-column marketing feature grid.
- Do not add Lucide, new icon packs, or placeholder photos (`picsum`).
- Do not put em-dashes (`—`) in user-visible strings. Comments may keep them.
- Do not migrate styling libraries.

## Pre-flight

- Tokens still come from `src/assets/styles/variables.css`.
- Interactive controls have hover, active/press, and a visible focus ring.
- Amounts use tabular figures where digits line up.
- Empty/error/loading states stay; do not replace them with decorative heroes.
