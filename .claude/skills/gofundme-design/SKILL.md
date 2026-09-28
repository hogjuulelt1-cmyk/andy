---
name: gofundme-design
description: Design system skill for gofundme. Activate when building UI components, pages, or any visual elements. Provides exact color tokens, typography scale, spacing grid, component patterns, and craft rules. Read references/DESIGN.md before writing any CSS or JSX.
---

# gofundme Design System

You are building UI for **gofundme**. Dark-themed, neutral palette, sans-serif typography (Nunito Sans), compact density on a 4px grid, expressive motion.

## Visual Reference

**IMPORTANT**: Study ALL screenshots below before writing any UI. Match colors, typography, spacing, layout, and motion exactly as shown.

### Homepage

![gofundme Homepage](screenshots/homepage.png)

> Read `references/DESIGN.md` for full token details.

## Design Philosophy

- **Layered depth** — use shadow tokens to create a sense of physical layering. Each elevation level has a specific shadow.
- **Gradient accents** — gradients are used thoughtfully for emphasis, not decoration.
- **Type pairing** — Nunito Sans for body/UI text, Lato for headings/display. Never introduce a third typeface.
- **compact density** — 4px base grid. Every dimension is a multiple of 4.
- **neutral palette** — the color temperature runs neutral, matching the sans-serif typography.
- **Expressive motion** — animations are an integral part of the experience. Use spring physics and layout animations.

## Color System

### Core Palette

| Role | Token | Hex | Use |
|------|-------|-----|-----|
| Background | `--background` | `#343a40` | Page/app background |
| Surface | `--surface` | `#ffffff` | Cards, panels, modals |
| Text Primary | `--text-primary` | `#ccf88e` | Headings, body text |
| Text Muted | `--text-muted` | `#d8d8d8` | Captions, placeholders |

### Status Colors

| Status | Hex | Use |
|--------|-----|-----|
| Success | `#02a95c` | Confirmations, positive trends |
| Warning | `#f7b231` | Caution states, pending items |
| Danger | `#dc3545` | Errors, destructive actions |

### Extended Palette

- `#02904e`
- `#cbccce`
- `#5d8000`
- `#bb2d3b` — Warm accent — hover glow or decorative highlight

### CSS Variable Tokens

```css
--hrt-color-button-primary-surface: #274A34;
--hrt-color-button-primary-surface-hover: #2D6339;
--hrt-color-button-primary-surface-pressed: rgba(53,125,58,0.25);
--hrt-color-button-primary-text: #CCF88E;
--hrt-color-button-primary-surface-strong: #CCF88E;
--hrt-color-button-primary-surface-strong-hover: #E9FCCE;
--hrt-color-button-primary-surface-strong-pressed: rgba(255,255,255,0.4);
--hrt-color-button-primary-text-on-strong: #274A34;
--hrt-color-button-secondary-surface: rgba(255,255,255,0);
--hrt-color-button-secondary-surface-hover: rgba(35,35,35,0.05);
--hrt-color-button-secondary-border: #B7B7B6;
--hrt-color-button-secondary-text: #232323;
--hrt-color-button-secondary-text-disabled: #B7B7B6;
--hrt-color-button-secondary-border-hover: #585858;
--hrt-color-button-secondary-border-disabled: #D8D8D8;
--hrt-color-surface-button-primary-strong-pressed: rgba(53,125,58,0.25);
--hrt-color-surface-button-secondary-pressed: rgba(35,35,35,0.1);
--hrt-color-surface-accent-blue-subtle: #E1F6F6;
--hrt-color-surface-accent-blue-medium: #A7E3E3;
--hrt-color-surface-accent-blue-medium-hover: #E1F6F6;
```

## Typography

### Font Stack

- **Nunito Sans** — Heading 1, Heading 2, Heading 3
- **Lato** — Body, Caption
- **SFMono-Regular** — Code

### Font Sources

```css
@font-face {
  font-family: "GoFundMe Sans";
  src: url("fonts/GoFundMeSans-30.woff2") format("woff2");
  font-weight: 30;
}
@font-face {
  font-family: "paralucent-condensed";
  src: url("fonts/paralucent-condensed-700.ttf") format("woff2");
  font-weight: 700;
}
@font-face {
  font-family: "termina";
  src: url("fonts/termina-900.ttf") format("woff2");
  font-weight: 900;
}
@font-face {
  font-family: "Lato";
  src: url("fonts/Lato-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Lato";
  src: url("fonts/Lato-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Nunito Sans";
  src: url("fonts/NunitoSans-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Nunito Sans";
  src: url("fonts/NunitoSans-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "dashicons";
  src: url("https://www.gofundme.com/c/wp-includes/fonts/dashicons.eot?99ac726223c749443b642ce33df8b800");
  font-weight: 400;
}
@font-face {
  font-family: "circular";
  src: url("https://www.gofundme.com/c/wp-content/themes/sage-8.5.4/dist/fonts/circular/b61735c99b616c457a09eda3f7b196e8.woff2") format("woff2");
  font-weight: 400;
}
@font-face {
  font-family: "circular";
  src: url("https://www.gofundme.com/c/wp-content/themes/sage-8.5.4/dist/fonts/circular/14d7ec3126b6d93d804552f69df7b959.woff2") format("woff2");
  font-weight: 700;
}
@font-face {
  font-family: "Druk Wide";
  src: url("https://www.gofundme.com/c/wp-content/themes/sage-8.5.4/dist/fonts/druk/DrukWide-Bold.woff2") format("woff2");
  font-weight: 700;
}
@font-face {
  font-family: "Druk Wide Super";
  src: url("https://www.gofundme.com/c/wp-content/themes/sage-8.5.4/dist/fonts/druk/DrukWide-Super.woff2") format("woff2");
  font-weight: 400;
}
@font-face {
  font-family: "slick";
  src: url("https://www.gofundme.com/c/wp-content/themes/sage-8.5.4/dist/styles/fonts/slick.eot") format("embedded-opentype");
  font-weight: 400;
}
```

### Type Scale

| Role | Family | Size | Weight |
|------|--------|------|--------|
| Heading 1 | Nunito Sans | 11.25rem | 700 |
| Heading 2 | Nunito Sans | 8rem | 700 |
| Heading 3 | Nunito Sans | 6.25rem | 700 |
| Body | Lato | .875rem | 400 |
| Caption | Lato | 1rem | 400 |
| Code | SFMono-Regular | 14px | 400 |

### Typography Rules

- Body/UI: **Nunito Sans**, Headings: **Lato** — these are the only display fonts
- Max 3-4 font sizes per screen
- Headings: weight 600-700, body: weight 400
- Use color and opacity for text hierarchy, not additional font sizes
- Line height: 1.5 for body, 1.2 for headings

## Spacing & Layout

### Base Grid: 4px

Every dimension (margin, padding, gap, width, height) must be a multiple of **4px**.

### Spacing Scale

`2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24` px

### Spacing as Meaning

| Spacing | Use |
|---------|-----|
| 4-8px | Tight: related items (icon + label, avatar + name) |
| 12-16px | Medium: between groups within a section |
| 24-32px | Wide: between distinct sections |
| 48px+ | Vast: major page section breaks |

### Border Radius

Scale: `inherit, .0625rem, .1em, .125rem, .13393rem, .1875rem, .2rem, .25rem, .25em, .3rem, .3125rem, .375rem, .5rem, .5625rem, .625rem, .6875rem, .75rem, .8125rem, .9375rem, 1rem, 1.0625rem, 1.25rem, 1.375rem, 1.5rem, 1.5625rem, 2em, 2px, 2rem, 2.1875rem, 2.5rem, 3px, 3.125rem, 3.5px, 3.625rem, 3.75rem, 4px, 5%, 6px, 6.25rem, 7rem, 8px, 10%, 10px, 10.375rem, 12px, 12.5rem, 13px, 15px, 16px, 16.81px, 17px, 17.4px, 18.4px, 20px, 24px, 24.69px, 25px, 27px, 30px, 33px, 33.41px, 34.17px, 34.18px, 44.76px, 50rem, 51.6564px, 57.69px, 60px, 85px, 99px, 100px, 100%, 154px, 200px, 624.9375rem, 999px`
Default: `6.25rem`

### Container

Max-width: `1120px`, centered with auto margins.

### Breakpoints

| Name | Value |
|------|-------|
| xs | 0em |
| sm | 40em |
| md | 41.68625em |
| md | 41.6875em |
| md | 41.6875rem |
| md | 47.9375em |
| md | 47.99875em |
| md | 48em |
| md | 48rem |
| lg | 59.9375em |
| lg | 59.99875em |
| lg | 60em |
| lg | 60rem |
| lg | 63.99875em |
| lg | 64em |
| xl | 71.9375em |
| xl | 71.99875em |
| xl | 72em |
| xl | 72rem |
| xl | 74.9375em |
| xl | 75em |
| 2xl | 83rem |
| 2xl | 89.99875em |
| 2xl | 90em |
| 2xl | 93.6875em |
| 2xl | 93.75em |
| 2xl | 112.5em |
| 2xl | 119.99875em |
| 2xl | 120em |
| xs | 360px |
| xs | 374px |
| xs | 375px |
| xs | 390px |
| xs | 413px |
| sm | 500px |
| sm | 528px |
| sm | 575.98px |
| sm | 576px |
| sm | 595px |
| sm | 600px |
| md | 660px |
| md | 665px |
| md | 700px |
| md | 767px |
| md | 767.98px |
| md | 768px |
| lg | 830px |
| lg | 865px |
| lg | 880px |
| lg | 959px |
| lg | 960px |
| lg | 991px |
| lg | 991.98px |
| lg | 992px |
| lg | 999px |
| lg | 1000px |
| lg | 1023px |
| lg | 1024px |
| xl | 1025px |
| xl | 1100px |
| xl | 1119px |
| xl | 1151px |
| xl | 1152px |
| xl | 1159px |
| xl | 1170px |
| xl | 1199px |
| xl | 1199.98px |
| xl | 1200px |
| xl | 1278px |
| xl | 1279px |
| 2xl | 1350px |
| 2xl | 1370px |
| 2xl | 1399.98px |
| 2xl | 1400px |
| 2xl | 1439px |
| 2xl | 1441px |

Mobile-first: design for small screens, layer on responsive overrides.

## Component Patterns

### Card

```css
.card {
  background: #ffffff;
  border-radius: 6.25rem;
  padding: 16px;
  box-shadow: var(--hrt-shadow-soft);
}
```

```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</div>
```

### Button

```css
/* Primary */
.btn-primary {
  background: #444444;
  color: #ccf88e;
  border-radius: 6.25rem;
  padding: 8px 16px;
  font-weight: 500;
  transition: opacity 150ms ease;
}
.btn-primary:hover { opacity: 0.9; }

/* Ghost */
.btn-ghost {
  background: transparent;
  border: 1px solid #444444;
  color: #ccf88e;
  border-radius: 6.25rem;
  padding: 8px 16px;
}
```

```html
<button class="btn-primary">Get Started</button>
<button class="btn-ghost">Learn More</button>
```

### Input

```css
.input {
  background: #343a40;
  border: 1px solid #444444;
  border-radius: 6.25rem;
  padding: 8px 12px;
  color: #ccf88e;
  font-size: 14px;
}
.input:focus { border-color: var(--accent); outline: none; }
```

```html
<input class="input" type="text" placeholder="Search..." />
```

### Badge / Chip

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  background: #ffffff;
  color: #d8d8d8;
}
```

```html
<span class="badge">New</span>
<span class="badge">Beta</span>
```

### Modal / Dialog

```css
.modal-backdrop { background: rgba(0, 0, 0, 0.6); }
.modal {
  background: #ffffff;
  border-radius: 999px;
  padding: 24px;
  max-width: 480px;
  width: 90vw;
  box-shadow: 0 6px 14px rgba(35,35,35,.1);
}
```

```html
<div class="modal-backdrop">
  <div class="modal">
    <h2>Dialog Title</h2>
    <p>Dialog content.</p>
    <button class="btn-primary">Confirm</button>
    <button class="btn-ghost">Cancel</button>
  </div>
</div>
```

### Table

```css
.table { width: 100%; border-collapse: collapse; }
.table th {
  text-align: left;
  padding: 8px 12px;
  font-weight: 500;
  font-size: 12px;
  color: #d8d8d8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #444444;
}
.table td {
  padding: 12px;
  border-bottom: 1px solid #444444;
}
```

```html
<table class="table">
  <thead><tr><th>Name</th><th>Status</th><th>Date</th></tr></thead>
  <tbody>
    <tr><td>Item One</td><td>Active</td><td>Jan 1</td></tr>
    <tr><td>Item Two</td><td>Pending</td><td>Jan 2</td></tr>
  </tbody>
</table>
```

### Navigation

```css
.nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
}
.nav-link {
  color: #d8d8d8;
  padding: 8px 12px;
  border-radius: 6.25rem;
  transition: color 150ms;
}
.nav-link:hover { color: #ccf88e; }
```

```html
<nav class="nav">
  <a href="/" class="nav-link active">Home</a>
  <a href="/about" class="nav-link">About</a>
  <a href="/pricing" class="nav-link">Pricing</a>
  <button class="btn-primary" style="margin-left: auto">Get Started</button>
</nav>
```

### Extracted Components

These components were found in the codebase:

**Button** (`html`)

**Card** (`html`)
- Variants: `inner`, `meta`, `title`, `excerpt`

**Navigation** (`html`)

**Badge** (`html`)

**Modal** (`html`)

**List** (`html`)

## Page Structure

The following page sections were detected:

- **Navigation** — Top navigation bar (27 items)
- **Hero** — Hero/banner section with headline and CTAs
- **Faq** — FAQ/accordion section
- **Footer** — Page footer with links and info (47 items)
- **Features** — Feature/benefit cards grid (14 items)
- **Cta** — Call-to-action section

When building pages, follow this section order and structure.

## Animation & Motion

This project uses **expressive motion**. Animations are part of the design language.

### CSS Animations

- `hrt-motion-fade-in`
- `hrt-motion-fade-out`
- `hrt-motion-scale-down`
- `hrt-motion-spin`
- `hrt-motion-shift-up-4`

### Motion Tokens

- **Duration scale:** `0ms`, `.01ms`, `.2s`, `.25s`, `.3s`, `.5s`, `.65s`, `.75s`, `1ms`, `1.1s`, `1.5s`, `8s`, `9s`, `100ms`, `150ms`, `200ms`, `250ms`, `300ms`, `350ms`, `400ms`, `500ms`, `600ms`, `660ms`, `750ms`, `1000ms`, `1500ms`, `2000ms`, `4000ms`
- **Easing functions:** `ease`, `ease-in-out`, `ease-out`, `ease-in`, `cubic-bezier(.3,.01,0,1)`, `linear`, `cubic-bezier(.485,.155,.24,1.245)`, `cubic-bezier(.485,.155,.515,.845)`, `cubic-bezier(.76,-.245,.24,1.245)`, `cubic-bezier(.17,.66,.34,.98)`, `cubic-bezier(.76,0,.24,1)`, `cubic-bezier(.38,.41,.27,1)`, `cubic-bezier(0.3,0.01,0,1)`, `cubic-bezier(0.17,0.66,0.34,0.98)`, `cubic-bezier(0.25,0.1,0.25,1)`
- **Animated properties:** `height`

### Motion Guidelines

- **Duration:** Use values from the duration scale above. Short (0ms) for micro-interactions, long (4000ms) for page transitions
- **Easing:** Use `ease` as the default easing curve
- **Direction:** Elements enter from bottom/right, exit to top/left
- **Reduced motion:** Always respect `prefers-reduced-motion` — disable animations when set

## Depth & Elevation

### Shadow Tokens

- Subtle: `inset 0 0 0 1px var(--hrt-color-button-secondary-border)`
- Subtle: `inset 0 0 0 1px var(--hrt-color-button-secondary-border-hover)`
- Subtle: `inset 0 0 0 1px var(--hrt-color-border-on-strong)`
- Subtle: `inset 0 0 0 1px var(--hrt-color-border-negative)`
- Subtle: `inset 0 0 0 1px var(--hrt-color-border-brand-strong)`
- Subtle: `inset 0 0 0 1px var(--hrt-color-border-accent-blue-strong-on-medium)`

### Z-Index Scale

`0, 1, 2, 3, 5, 9, 10, 20, 29, 30, 31, 40, 50, 90, 99, 100, 110, 120, 200, 300, 400, 500, 600, 700, 800, 900, 999, 1000, 1005, 1006, 1009, 1020, 1030, 1040, 1050, 1060, 1070, 1080, 1100, 1200, 1300, 9990, 9991, 9992, 9993, 9994, 9999, 10000, 100000, 9999999`

Use these exact values — never invent z-index values.

## Anti-Patterns (Never Do)

- **No blur effects** — no backdrop-blur, no filter: blur()
- **No zebra striping** — tables and lists use borders for separation
- **No invented colors** — every hex value must come from the palette above
- **No arbitrary spacing** — every dimension is a multiple of 4px
- **No extra fonts** — only Nunito Sans and Lato and SFMono-Regular are allowed
- **No arbitrary border-radius** — use the scale: .0625rem, .1em, .125rem, .13393rem, .1875rem, .2rem, .25rem, .25em, .3rem, .3125rem
- **No opacity for disabled states** — use muted colors instead

## Workflow

1. **Read** `references/DESIGN.md` before writing any UI code
2. **Pick colors** from the Color System section — never invent new ones
3. **Set typography** — Nunito Sans, Lato, SFMono-Regular only, using the type scale
4. **Build layout** on the 4px grid — check every margin, padding, gap
5. **Match components** to patterns above before creating new ones
6. **Apply elevation** — use shadow tokens
7. **Validate** — every value traces back to a design token. No magic numbers.

## Brand Spec

- **Favicon:** `/nextassets/shared/favicon.ico`
- **Site URL:** `https://www.gofundme.com`
- **Brand typeface:** Nunito Sans

## Quick Reference

```
Background:     #343a40
Surface:        #ffffff
Text:           #ccf88e / #d8d8d8
Accent:         (not extracted)
Border:         (not extracted)
Font:           Nunito Sans
Spacing:        4px grid
Radius:         6.25rem
Components:     10 detected
```

## When to Trigger

Activate this skill when:
- Creating new components, pages, or visual elements for gofundme
- Writing CSS, Tailwind classes, styled-components, or inline styles
- Building page layouts, templates, or responsive designs
- Reviewing UI code for design consistency
- The user mentions "gofundme" design, style, UI, or theme
- Generating mockups, wireframes, or visual prototypes

---

# Full Reference Files

> Every output file is embedded below. Claude has full design system context from /skills alone.

## Design System Tokens (DESIGN.md)

# gofundme DESIGN.md

> Auto-generated design system — reverse-engineered via static analysis by skillui.
> Frameworks: None detected
> Colors: 20 · Fonts: 3 · Components: 10
> Icon library: not detected · State: not detected
> Primary theme: dark · Dark mode toggle: no · Motion: expressive

## Visual Reference

**Match this design exactly** — study colors, fonts, spacing, and component shapes before writing any UI code.

![gofundme Homepage](../screenshots/homepage.png)

---

## 1. Visual Theme & Atmosphere

This is a **dark-themed** interface with a neutral tone. Depth is expressed through layered shadows and subtle surface color variation. Typography pairs **Lato** for display/headings with **Nunito Sans** for body text, creating clear visual hierarchy through type contrast. Spacing follows a **4px base grid** (compact density), with scale: 2, 4, 6, 8, 10, 12, 14, 16px. Motion is expressive — spring physics, layout animations, and staggered reveals are part of the visual language.

---

## 2. Color Palette & Roles

| Token | Hex | Role | Use |
|---|---|---|---|
| hrt-link-color | `#343a40` | background | Page background, darkest surface |
| hrt-color-button-primary-surface-strong-pressed | `#ffffff` | surface | Card and panel backgrounds |
| hrt-color-surface-implied-selected-subtle-hover | `#000000` | surface | Card and panel backgrounds |
| hrt-color-surface-neutral-strong-pressed | `#6f6f6f` | surface | Card and panel backgrounds |
| hrt-color-button-secondary-surface-hover | `#232323` | surface | Card and panel backgrounds |
| hrt-color-surface-negative-subtle | `#fef0ea` | surface | Card and panel backgrounds |
| hrt-color-surface-accent-blue-subtle | `#e1f6f6` | surface | Card and panel backgrounds |
| hrt-color-surface-feature-subtle | `#f8effc` | surface | Card and panel backgrounds |
| hrt-color-surface-neutral-medium | `#e9e9e9` | surface | Card and panel backgrounds |
| hrt-color-button-primary-surface | `#274a34` | surface | Card and panel backgrounds |
| hrt-color-button-primary-text | `#ccf88e` | text-primary | Headings and body text |
| hrt-color-button-secondary-border-disabled | `#d8d8d8` | text-muted | Captions, placeholders, secondary info |
| text-muted | `#5c636a` | text-muted | Captions, placeholders, secondary info |
| bs-danger | `#dc3545` | danger | Error states, destructive actions |
| success | `#02a95c` | success | Success states, positive indicators |
| warning | `#f7b231` | warning | Warning states, caution indicators |
| unknown | `#02904e` | unknown | Palette color |
| unknown | `#cbccce` | unknown | Palette color |
| unknown | `#5d8000` | unknown | Palette color |
| unknown | `#bb2d3b` | unknown | Palette color |

### CSS Variable Tokens

```css
--hrt-color-button-primary-surface: #274A34;
--hrt-color-button-primary-surface-hover: #2D6339;
--hrt-color-button-primary-surface-pressed: rgba(53,125,58,0.25);
--hrt-color-button-primary-text: #CCF88E;
--hrt-color-button-primary-surface-strong: #CCF88E;
--hrt-color-button-primary-surface-strong-hover: #E9FCCE;
--hrt-color-button-primary-surface-strong-pressed: rgba(255,255,255,0.4);
--hrt-color-button-primary-text-on-strong: #274A34;
--hrt-color-button-secondary-surface: rgba(255,255,255,0);
--hrt-color-button-secondary-surface-hover: rgba(35,35,35,0.05);
--hrt-color-button-secondary-border: #B7B7B6;
--hrt-color-button-secondary-text: #232323;
--hrt-color-button-secondary-text-disabled: #B7B7B6;
--hrt-color-button-secondary-border-hover: #585858;
--hrt-color-button-secondary-border-disabled: #D8D8D8;
--hrt-color-surface-button-primary-strong-pressed: rgba(53,125,58,0.25);
--hrt-color-surface-button-secondary-pressed: rgba(35,35,35,0.1);
--hrt-color-surface-accent-blue-subtle: #E1F6F6;
--hrt-color-surface-accent-blue-medium: #A7E3E3;
--hrt-color-surface-accent-blue-medium-hover: #E1F6F6;
```


---

## 3. Typography Rules

**Font Stack:**
- **Nunito Sans** — Heading 1, Heading 2, Heading 3
- **Lato** — Body, Caption
- **SFMono-Regular** — Code

**Font Sources:**

```css
@font-face {
  font-family: "GoFundMe Sans";
  src: url("fonts/GoFundMeSans-30.woff2") format("woff2");
  font-weight: 30;
}
@font-face {
  font-family: "paralucent-condensed";
  src: url("fonts/paralucent-condensed-700.ttf") format("woff2");
  font-weight: 700;
}
@font-face {
  font-family: "termina";
  src: url("fonts/termina-900.ttf") format("woff2");
  font-weight: 900;
}
@font-face {
  font-family: "Lato";
  src: url("fonts/Lato-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Lato";
  src: url("fonts/Lato-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Nunito Sans";
  src: url("fonts/NunitoSans-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Nunito Sans";
  src: url("fonts/NunitoSans-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "dashicons";
  src: url("https://www.gofundme.com/c/wp-includes/fonts/dashicons.eot?99ac726223c749443b642ce33df8b800");
  font-weight: 400;
}
@font-face {
  font-family: "circular";
  src: url("https://www.gofundme.com/c/wp-content/themes/sage-8.5.4/dist/fonts/circular/b61735c99b616c457a09eda3f7b196e8.woff2") format("woff2");
  font-weight: 400;
}
@font-face {
  font-family: "circular";
  src: url("https://www.gofundme.com/c/wp-content/themes/sage-8.5.4/dist/fonts/circular/14d7ec3126b6d93d804552f69df7b959.woff2") format("woff2");
  font-weight: 700;
}
@font-face {
  font-family: "Druk Wide";
  src: url("https://www.gofundme.com/c/wp-content/themes/sage-8.5.4/dist/fonts/druk/DrukWide-Bold.woff2") format("woff2");
  font-weight: 700;
}
@font-face {
  font-family: "Druk Wide Super";
  src: url("https://www.gofundme.com/c/wp-content/themes/sage-8.5.4/dist/fonts/druk/DrukWide-Super.woff2") format("woff2");
  font-weight: 400;
}
@font-face {
  font-family: "slick";
  src: url("https://www.gofundme.com/c/wp-content/themes/sage-8.5.4/dist/styles/fonts/slick.eot") format("embedded-opentype");
  font-weight: 400;
}
```

| Role | Font | Size | Weight |
|---|---|---|---|
| Heading 1 | Nunito Sans | 11.25rem | 700 |
| Heading 2 | Nunito Sans | 8rem | 700 |
| Heading 3 | Nunito Sans | 6.25rem | 700 |
| Body | Lato | .875rem | 400 |
| Caption | Lato | 1rem | 400 |
| Code | SFMono-Regular | 14px | 400 |

**Typographic Rules:**
- Limit to 3 font families max per screen
- Use **Nunito Sans** for body/UI text, **Lato** for display/headings
- Maintain consistent hierarchy: no more than 3-4 font sizes per screen
- Headings use bold (600-700), body uses regular (400)
- Line height: 1.5 for body text, 1.2 for headings
- Use color and opacity for secondary hierarchy, not additional font sizes


---

## 4. Component Stylings

### Layout (1)

**Footer** — `html`

### Navigation (1)

**Navigation** — `html`

### Data Display (3)

**Card** — `html`
- Variants: `inner`, `meta`, `title`, `excerpt`

**Badge** — `html`

**List** — `html`

### Data Input (2)

**Button** — `html`
- Animation: 

**Input** — `html`
- State: :focus, :placeholder

### Overlay (1)

**Modal** — `html`

### Media (2)

**Image** — `html`

**Icon** — `html`



---

## 5. Layout Principles

- **Base spacing unit:** 4px
- **Spacing scale:** 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24
- **Border radius:** inherit, .0625rem, .1em, .125rem, .13393rem, .1875rem, .2rem, .25rem, .25em, .3rem, .3125rem, .375rem, .5rem, .5625rem, .625rem, .6875rem, .75rem, .8125rem, .9375rem, 1rem, 1.0625rem, 1.25rem, 1.375rem, 1.5rem, 1.5625rem, 2em, 2px, 2rem, 2.1875rem, 2.5rem, 3px, 3.125rem, 3.5px, 3.625rem, 3.75rem, 4px, 5%, 6px, 6.25rem, 7rem, 8px, 10%, 10px, 10.375rem, 12px, 12.5rem, 13px, 15px, 16px, 16.81px, 17px, 17.4px, 18.4px, 20px, 24px, 24.69px, 25px, 27px, 30px, 33px, 33.41px, 34.17px, 34.18px, 44.76px, 50rem, 51.6564px, 57.69px, 60px, 85px, 99px, 100px, 100%, 154px, 200px, 624.9375rem, 999px
- **Max content width:** 1120px

**Spacing as Meaning:**
| Spacing | Use |
|---|---|
| 4-8px | Tight: related items within a group |
| 12-16px | Medium: between groups |
| 24-32px | Wide: between sections |
| 48px+ | Vast: major section breaks |


---

## 6. Depth & Elevation

### Flat — subtle depth hints

- `inset 0 0 0 1px var(--hrt-color-button-secondary-border)`
- `inset 0 0 0 1px var(--hrt-color-button-secondary-border-hover)`
- `inset 0 0 0 1px var(--hrt-color-border-on-strong)`

### Raised — cards, buttons, interactive elements

- `var(--hrt-shadow-soft)`
- `var(--hrt-shadow-medium)`
- `var(--hrt-shadow-medium-strong)`

### Floating — dropdowns, popovers, modals

- `0 6px 14px rgba(35,35,35,.1)`
- `4px 5px 13px 3px rgba(0,0,0,.1)`
- `4px 5px 13px 3px rgba(0,0,0,.2)`

### Overlay — full-screen overlays, top-level dialogs

- `inset 0 0 0 9999px var(--bs-table-accent-bg)`
- `0 8px 32px 0 rgba(0,0,0,.1)`
- `0 8px 52px 0 rgba(0,0,0,.3)`

### Z-Index Scale

`0, 1, 2, 3, 5, 9, 10, 20, 29, 30, 31, 40, 50, 90, 99, 100, 110, 120, 200, 300, 400, 500, 600, 700, 800, 900, 999, 1000, 1005, 1006, 1009, 1020, 1030, 1040, 1050, 1060, 1070, 1080, 1100, 1200, 1300, 9990, 9991, 9992, 9993, 9994, 9999, 10000, 100000, 9999999`



---

## 7. Animation & Motion

This project uses **expressive motion**. Animations are an integral part of the experience.

### CSS Animations

- `@keyframes hrt-motion-fade-in`
- `@keyframes hrt-motion-fade-out`
- `@keyframes hrt-motion-scale-down`
- `@keyframes hrt-motion-spin`
- `@keyframes hrt-motion-shift-up-4`
- `@keyframes hrt-motion-shift-up-8`
- `@keyframes hrt-motion-skeleton-pulse`
- `@keyframes hrt-dot-loader-pulse`

### Animated Components

- **Button**: 

### Motion Guidelines

- Duration: 150-300ms for micro-interactions, 300-500ms for page transitions
- Easing: `ease-out` for enters, `ease-in` for exits
- Always respect `prefers-reduced-motion`


---

## 8. Do's and Don'ts

### Do's

- Use `#343a40` as the primary page background
- Pair **Nunito Sans** (body) with **Lato** (display) — these are the only allowed fonts
- Follow the **4px** spacing grid for all margins, padding, and gaps
- Use the defined shadow tokens for elevation — see Section 6
- Use border-radius from the scale: inherit, .0625rem, .1em, .125rem, .13393rem
- Reuse existing components from Section 4 before creating new ones

### Don'ts

- Don't introduce colors outside this palette — extend the design tokens first
- Don't introduce additional font families beyond Nunito Sans and Lato and SFMono-Regular
- Don't use arbitrary spacing values — stick to multiples of 4px
- Don't create custom box-shadow values outside the system tokens
- Don't use arbitrary border-radius values — pick from the defined scale
- Don't duplicate component patterns — check Section 4 first
- Don't use backdrop-blur or blur effects

### Anti-Patterns (detected from codebase)

- No blur or backdrop-blur effects
- No zebra striping on tables/lists


---

## 9. Responsive Behavior

| Name | Value | Source |
|---|---|---|
| xs | 0em | css |
| sm | 40em | css |
| md | 41.68625em | css |
| md | 41.6875em | css |
| md | 41.6875rem | css |
| md | 47.9375em | css |
| md | 47.99875em | css |
| md | 48em | css |
| md | 48rem | css |
| lg | 59.9375em | css |
| lg | 59.99875em | css |
| lg | 60em | css |
| lg | 60rem | css |
| lg | 63.99875em | css |
| lg | 64em | css |
| xl | 71.9375em | css |
| xl | 71.99875em | css |
| xl | 72em | css |
| xl | 72rem | css |
| xl | 74.9375em | css |
| xl | 75em | css |
| 2xl | 83rem | css |
| 2xl | 89.99875em | css |
| 2xl | 90em | css |
| 2xl | 93.6875em | css |
| 2xl | 93.75em | css |
| 2xl | 112.5em | css |
| 2xl | 119.99875em | css |
| 2xl | 120em | css |
| xs | 360px | css |
| xs | 374px | css |
| xs | 375px | css |
| xs | 390px | css |
| xs | 413px | css |
| sm | 500px | css |
| sm | 528px | css |
| sm | 575.98px | css |
| sm | 576px | css |
| sm | 595px | css |
| sm | 600px | css |
| md | 660px | css |
| md | 665px | css |
| md | 700px | css |
| md | 767px | css |
| md | 767.98px | css |
| md | 768px | css |
| lg | 830px | css |
| lg | 865px | css |
| lg | 880px | css |
| lg | 959px | css |
| lg | 960px | css |
| lg | 991px | css |
| lg | 991.98px | css |
| lg | 992px | css |
| lg | 999px | css |
| lg | 1000px | css |
| lg | 1023px | css |
| lg | 1024px | css |
| xl | 1025px | css |
| xl | 1100px | css |
| xl | 1119px | css |
| xl | 1151px | css |
| xl | 1152px | css |
| xl | 1159px | css |
| xl | 1170px | css |
| xl | 1199px | css |
| xl | 1199.98px | css |
| xl | 1200px | css |
| xl | 1278px | css |
| xl | 1279px | css |
| 2xl | 1350px | css |
| 2xl | 1370px | css |
| 2xl | 1399.98px | css |
| 2xl | 1400px | css |
| 2xl | 1439px | css |
| 2xl | 1441px | css |

**Approach:** Use `@media (min-width: ...)` queries matching the breakpoints above.


---

## 10. Agent Prompt Guide

Use these as starting points when building new UI:

### Build a Card

```
Background: #ffffff
Border: 1px solid var(--border)
Radius: 6.25rem
Padding: 16px
Font: Nunito Sans
Use shadow tokens from Section 6.
```

### Build a Button

```
Primary: bg var(--accent), text white
Ghost: bg transparent, border var(--border)
Padding: 8px 16px
Radius: 6.25rem
Hover: opacity 0.9 or lighter shade
Focus: ring with var(--accent)
```

### Build a Page Layout

```
Background: #343a40
Max-width: 1120px, centered
Grid: 4px base
Responsive: mobile-first, breakpoints from Section 9
```

### Build a Stats Card

```
Surface: #ffffff
Label: #d8d8d8 (muted, 12px, uppercase)
Value: #ccf88e (primary, 24-32px, bold)
Status: use success/warning/danger from Section 2
```

### Build a Form

```
Input bg: #343a40
Input border: 1px solid var(--border)
Focus: border-color var(--accent)
Label: #d8d8d8 12px
Spacing: 16px between fields
Radius: 6.25rem
```

### General Component

```
1. Read DESIGN.md Sections 2-6 for tokens
2. Colors: only from palette
3. Font: Nunito Sans, type scale from Section 3
4. Spacing: 4px grid
5. Components: match patterns from Section 4
6. Elevation: shadow tokens
```

## Bundled Fonts (fonts/)

The following font files are bundled in the `fonts/` directory:

- `fonts/GoFundMeSans-30.woff2`
- `fonts/Lato-Black.ttf`
- `fonts/Lato-Bold.ttf`
- `fonts/Lato-Light.ttf`
- `fonts/Lato-Regular.ttf`
- `fonts/Lato-Thin.ttf`
- `fonts/NunitoSans-Black.ttf`
- `fonts/NunitoSans-Bold.ttf`
- `fonts/NunitoSans-ExtraBold.ttf`
- `fonts/NunitoSans-ExtraLight.ttf`
- `fonts/NunitoSans-Light.ttf`
- `fonts/NunitoSans-Medium.ttf`
- `fonts/NunitoSans-Regular.ttf`
- `fonts/NunitoSans-SemiBold.ttf`
- `fonts/paralucent-condensed-600.ttf`
- `fonts/paralucent-condensed-700.ttf`
- `fonts/termina-900.ttf`

Use these local font files in `@font-face` declarations instead of fetching from Google Fonts.

## Homepage Screenshots (screenshots/)

![homepage.png](screenshots/homepage.png)

