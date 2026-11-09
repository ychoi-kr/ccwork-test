# Design System Strategy: The Digital Atelier

> Stitch가 제공한 원문 그대로 보존한 파일입니다. 정리본과 프로젝트 적용 규칙은 [README.md](./README.md)를 보세요.

## 1. Overview & Creative North Star

**Creative North Star: The Curated Archive**

This design system transcends the typical "knowledge base" template by adopting the philosophy of a high-end digital atelier. While inspired by Notion’s utility, our execution moves into the realm of **Soft Minimalism**. We treat every "Today I Learned" (TIL) entry not just as data, but as a prized specimen in a personal museum.

The system breaks the "generic SaaS" look through **Intentional Asymmetry** and **Tonal Depth**. Instead of boxing content into rigid, bordered containers, we use the "The Curated Archive" approach: content floats on sophisticated layers of neutral tones, allowing the typography to breathe and the information to take center stage. We prioritize the "quiet" moment of learning, ensuring the UI never competes with the insight.

---

## 2. Colors & Surface Philosophy

### The "No-Line" Rule

To achieve a premium, editorial feel, **1px solid borders are prohibited for sectioning.** Boundaries must be defined exclusively through background color shifts.

- **Implementation:** A sidebar using `surface_container_low` (#f1f4f6) sits directly against the `background` (#f8f9fa). The transition is felt, not seen.

### Surface Hierarchy & Nesting

We treat the UI as a series of stacked, physical materials. Depth is achieved by nesting the `surface-container` tiers:

- **Base Layer:** `surface` (#f8f9fa) – The primary canvas.
- **Secondary Zones:** `surface_container_low` (#f1f4f6) – For sidebars and navigation backgrounds.
- **Interactive Elements:** `surface_container_lowest` (#ffffff) – Used for the highest-priority cards or active work areas to create a "lifted" paper effect.

### The "Glass & Gradient" Rule

Floating elements (modals, dropdowns, or hovering breadcrumbs) should utilize **Glassmorphism**.

- **Token Usage:** Use `surface` (#f8f9fa) at 80% opacity with a `backdrop-filter: blur(12px)`.
- **Signature Textures:** For primary actions (CTAs), apply a subtle linear gradient from `tertiary` (#0053dc) to `tertiary_container` (#3e76fe). This adds a "jewel-like" depth to our single accent color, preventing the UI from feeling flat.

---

## 3. Typography: Editorial Authority

We use **Inter** exclusively, but we manipulate scale and weight to create an authoritative hierarchy.

- **Display (The Statement):** `display-lg` (3.5rem) is reserved for landing moments. Use `-0.02em` letter spacing to give it a tight, bespoke feel.
- **Headlines (The Insight):** `headline-md` (1.75rem) serves as the title for TIL entries. It should have a generous `line-height` (1.4) to invite reading.
- **Body (The Knowledge):** `body-lg` (1rem) is our workhorse. We use `on_surface_variant` (#586064) for long-form reading to reduce eye strain, switching to `on_surface` (#2b3437) for critical emphasis.
- **Labels (The Metadata):** `label-md` (0.75rem) should always be in `uppercase` with `+0.05em` letter spacing to distinguish functional metadata from narrative content.

---

## 4. Elevation & Depth

### The Layering Principle

Forget shadows for standard cards. Achieve "soft lift" by placing a `surface_container_lowest` (#ffffff) card on top of a `surface_container` (#eaeff1) section. This "Tonal Layering" mimics natural paper overlap.

### Ambient Shadows

Where a floating effect is required (e.g., a "New Post" popover):

- **Blur:** 24px - 40px.
- **Opacity:** 6% of `on_surface` (#2b3437).
- **Color:** Tint the shadow with a hint of the accent color to keep the palette cohesive.

### The "Ghost Border" Fallback

If a container must be defined against a similar background (for accessibility), use a **Ghost Border**:

- **Token:** `outline_variant` (#abb3b7) at **15% opacity**. It should be a suggestion of a line, not a boundary.

---

## 5. Components

### Buttons

- **Primary:** Gradient from `tertiary` to `tertiary_container`. Text is `on_tertiary` (#faf8ff). Use `md` (0.375rem) roundedness.
- **Secondary:** `surface_container_high` (#e2e9ec) background with `on_surface` text. No border.
- **Tertiary (Ghost):** No background. Use `tertiary` (#0053dc) for text. On hover, apply a `2%` opacity of the accent color.

### Cards & Lists

- **The Divider Prohibition:** Do not use lines to separate list items. Use the **Spacing Scale**. A gap of `spacing.4` (1.4rem) between items is the standard.
- **Hover State:** Shift background from `surface` to `surface_container_low` (#f1f4f6).

### Input Fields

- **Minimalist Entry:** Text inputs are `surface_container_lowest` (#ffffff) with a 1px "Ghost Border" that transitions to a 1px `tertiary` (#0053dc) border only on focus.
- **Labels:** Always use `label-md` positioned above the input with a `spacing.1` gap.

### The "Knowledge Token" (Custom Chip)

Used for tagging topics (e.g., #javascript, #design).

- **Style:** `surface_container_highest` (#dbe4e7) background, `on_surface_variant` (#586064) text, and `full` roundedness. No borders.

---

## 6. Do’s and Don’ts

### Do

- **DO** use white space as a structural element. If in doubt, increase the margin.
- **DO** use `surface_container_highest` for "Selected" states in the sidebar.
- **DO** ensure the accent color (`tertiary`) is used sparingly—only for intent-driven actions.

### Don’t

- **DON’T** use pure black (#000000) for text. Use `on_surface` (#2b3437) to maintain a soft, high-end feel.
- **DON’T** use default shadows. They feel "engineered" rather than "designed."
- **DON’T** use icons unless they provide immediate functional clarity. This system is typographically driven.
- **DON’T** use a border to separate the sidebar. Use the color shift from `surface_container_low` to `surface`.

---

## 7. Spacing Logic

Our grid follows a strict **1.4rem (spacing.4)** rhythm.

- **Vertical Rhythm:** Headlines to body text use `spacing.2` (0.7rem).
- **Section Gaps:** Large layout blocks should use `spacing.10` (3.5rem) to ensure the "Atmospheric" quality of the design is maintained.
