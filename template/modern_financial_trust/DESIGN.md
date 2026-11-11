---
name: Modern Financial Trust
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002113'
  on-tertiary-container: '#009668'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  numeric-metric:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is tailored for an institutional-grade, modern internet banking platform. It projects high-security authority, absolute financial clarity, and effortless efficiency. The target audience spans high-net-worth individuals, tech-forward retail banking customers, and corporate treasurers who demand instant legibility and unflinching dependability.

The design movement combines **Contemporary Fintech Minimalism** with **Tactile Surface Tiers**:
- Ultra-clean canvas architecture with pure white interactive cards.
- Highly structural layouts with generous breathing room, prioritizing legibility and visual calm over ornamental noise.
- Confident, disciplined restraint: vibrant accents are applied purposefully to critical metrics, actionable triggers, and transaction trends, avoiding visual fatigue.
- Professional precision: micro-interactions, hairline strokes, and structural data grids signal technological rigor and cryptographic security.

## Colors

The color architecture communicates unwavering institutional stability with high-precision accents.

- **Primary (`#0F172A` - Slate Trust 900)**: Serves as the bedrock brand color, anchor headers, primary CTAs, active states, and navigation bars.
- **Secondary (`#0284C7` - Electric Sky 600)**: Used for active tab underlines, interactive links, primary data visualizers, focused input rings, and promotional milestones.
- **Tertiary / Success (`#10B981` - Emerald Vault 500)**: Reserved strictly for credits, positive yield percentages, verified badges, and incoming cash flow.
- **Critical / Negative (`#F43F5E` - Rose Outflow 500)**: Applied strictly to debt obligations, spending spikes, expenses, and security alerts.
- **Background & Canvas (`#F8FAFC` - Slate 50)**: Cool, crisp neutral base that allows card surfaces to detach cleanly.
- **Card & Sheet Surfaces (`#FFFFFF` - Pure White)**: Dedicated high-contrast resting ground for data grids, balance sheets, and interactive elements.
- **Structural Outlines (`#E2E8F0` - Slate 200)**: Fine lines defining spatial bounds without competing with content.

## Typography

The typographic system relies on **Plus Jakarta Sans**, offering a clean, contemporary geometric architecture with humanized proportions and balanced curves.

- **Tabular Figures (`tnum`)**: All financial figures, account numbers, balances, timestamps, and currency markers must enforce `font-feature-settings: "tnum" 1`. This prevents column jitter during real-time data streaming and ensures vertical alignment across ledgers.
- **Hierarchy Rules**: Metric headers pair heavy weights (`700`) with tighter negative letter-spacing to command authority. Metadata labels leverage uppercase transformation with positive tracking (`0.04em`) to establish crisp visual distinction against nearby balance figures.
- **Readability Rules**: Body copy maintains strict line-height discipline (minimum 1.45x) to maintain clear readability across transaction descriptions, terms, and audit trails.

## Layout & Spacing

The layout model enforces a balanced 12-column responsive fluid grid paired with predictable density constraints.

- **Desktop (>= 1280px)**: 12-column layout with a fixed persistent lateral navigation rail (260px wide). The primary dashboard content zone occupies the remainder with a maximum reading width of 1440px, centered, flanked by `margin` (2rem) and `gutter` (1.5rem).
- **Tablet (768px - 1279px)**: 8-column layout with a collapsed icon-only navigation rail (72px). Inner card gutters compress to `1rem`.
- **Mobile (< 768px)**: 4-column layout with dynamic stacking. Navigation transitions into an anchored bottom bar or slide-over drawer. Outer canvas padding tightens to `margin-mobile` (1rem).
- **Spatial Rhythm**: All vertical stacking within cards, modules, and lists strictly adheres to standard multiples (4px/8px). Padding inside content cards scales from `space-md` (mobile) to `space-lg` (desktop) to ensure an open, uncluttered presentation.

## Elevation & Depth

Visual hierarchy uses a refined combination of **low-contrast micro-borders** and **multi-layered, diffuse ambient shadows**. This prevents muddy overlays and establishes a crisp, daylight-clean dashboard look.

- **Base Layer (Level 0 - Canvas)**: Flat `#F8FAFC`, no shadow, zero elevation.
- **Card Layer (Level 1 - Resting Cards)**: Surface `#FFFFFF`, bounded by a hairline stroke (`1px solid #E2E8F0`). Shadow: `0px 1px 3px 0px rgba(15, 23, 42, 0.04), 0px 4px 12px 0px rgba(15, 23, 42, 0.03)`.
- **Interactive Hover Layer (Level 2 - Actionable Panels/Hovered Cards)**: Bounded by `#CBD5E1`. Shadow: `0px 4px 6px -1px rgba(15, 23, 42, 0.06), 0px 10px 20px -3px rgba(15, 23, 42, 0.05)`.
- **Floating Overlays (Level 3 - Menus, Popovers, Dropdowns)**: Surface `#FFFFFF`, hairline stroke `#E2E8F0`. Shadow: `0px 10px 25px -5px rgba(15, 23, 42, 0.08), 0px 8px 10px -6px rgba(15, 23, 42, 0.04)`.
- **Modal / Critical Verification (Level 4)**: Centered over backdrop overlay (`rgba(15, 23, 42, 0.5)` with `backdrop-filter: blur(4px)`). Shadow: `0px 25px 50px -12px rgba(15, 23, 42, 0.25)`.

## Shapes

The design system incorporates a balanced, modern geometric shape language (level 2 - Rounded) reflecting modern fintech platforms.

- **Primary Interactive Elements (Buttons, Inputs, Selects)**: Defined at standard `0.5rem` (8px). This creates crisp alignment when inputs and buttons sit inline.
- **Containers and Cards (`rounded-lg`)**: Set to `1rem` (16px), delivering comfortable visual containment for balance summaries and transaction streams.
- **Modals and Dialogue Sheets (`rounded-xl`)**: Set to `1.5rem` (24px) for distinct structural separation against the background canvas.
- **Status Pills, Avatar Rings, and Numerical Badges**: Rendered strictly with full pill radius (`9999px`) to immediately separate metadata tags from rectangular cards and form fields.

## Components

### Buttons
- **Primary**: Background `#0F172A`, text `#FFFFFF`, font weight `600`, height `44px`, padding `0 1.25rem`, border radius `0.5rem`. Hover: `#1E293B` with Level 1 shadow. Active: `#0B1320`.
- **Secondary / Accent**: Background `#0284C7`, text `#FFFFFF`, font weight `600`, height `44px`. Hover: `#0369A1`.
- **Outline / Neutral**: Background transparent, border `1px solid #E2E8F0`, text `#0F172A`. Hover: `#F8FAFC` surface with border `#CBD5E1`.

### Data Cards & Balance Overview
- Card container uses pure white (`#FFFFFF`) with `1px solid #E2E8F0` border and `1rem` border radius.
- Padding is fixed at `1.5rem` (`space-lg`).
- The primary account balance is rendered using the `numeric-metric` token (`28px` bold, tabular figures).
- Header micro-label uses uppercase tracking (`label-sm`) in `#64748B`.

### Transaction Lists
- Row items use a horizontal layout with `space-md` (1rem) vertical padding and a subtle bottom border (`1px solid #F1F5F9`).
- Transaction category icon rests inside a `40px` circular container with an ultra-soft tinted background (e.g., `#F0FDF4` for incoming credits, `#FFF1F2` for debits).
- Outgoing amounts prefix with `-` and display in `#0F172A`; incoming amounts prefix with `+` and display in `#10B981` (`tertiary`).

### Form Fields & Inputs
- Height `44px`, background `#FFFFFF`, border `1px solid #CBD5E1`, border radius `0.5rem`, padding `0 0.875rem`, text `#0F172A`.
- Placeholder text in `#94A3B8`.
- Focus state: border color switches to `#0284C7` with a matching focus ring `0 0 0 3px rgba(2, 132, 199, 0.15)`.

### Chips & Status Badges
- Height `24px`, padding `0 0.625rem`, border-radius `9999px`, font size `11px`, weight `700`.
- **Success (Settled/Approved)**: Background `rgba(16, 185, 129, 0.12)`, text `#047857`.
- **Pending / Processing**: Background `rgba(2, 132, 199, 0.10)`, text `#0369A1`.
- **Failed / Flagged**: Background `rgba(244, 63, 94, 0.12)`, text `#BE123C`.

### Checkboxes & Radio Controls
- Dimensions `18px x 18px`. Border `1.5px solid #CBD5E1`.
- Checked state: background `#0F172A`, border `#0F172A` with an internal white checkmark or center pip. Focus ring identical to inputs.

### Security / MFA Verification Cards
- Dedicated highlighted components with a subtle left accent border (`3px solid #0284C7`), pale blue background tint (`#F0F9FF`), and integrated key/lock glyphs to emphasize security and cryptographic authentication.