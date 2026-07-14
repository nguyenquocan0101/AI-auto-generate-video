# Design System Inspired by Chuyên Tin

## 1. Visual Theme & Atmosphere

Chuyên Tin's design system embodies a vibrant, educational tech platform targeting high-achieving students preparing for computer science entrance exams. The visual identity combines deep, sophisticated purples with warm golden accents, creating an atmosphere of aspiration, competence, and forward momentum. The palette evokes both the technical precision of programming and the human warmth of mentorship. Generous use of whitespace balances the rich color palette, while dynamic interactions and progressive disclosure maintain visual interest without overwhelming. The overall mood is professional yet approachable, ambitious yet supportive—reflecting the platform's mission to guide students through rigorous exam preparation with engaging, modern design.

**Key Characteristics**
- Rich purple gradient backgrounds establishing visual hierarchy and depth
- Golden accents highlighting calls-to-action and progress states
- Clean typography with strong weight contrasts for scanability
- Rounded, button-forward component design with subtle elevation effects
- Human-centered imagery paired with technical symbolism
- High contrast between dark content areas and light surfaces for accessibility

## 2. Color Palette & Roles

### Primary
- **Deep Navy Purple** (`#191127`): Primary background for hero sections, headers, and dark surfaces; establishes brand presence and trust
- **Brand Purple** (`#7726B6`): Core brand identifier used across interactive elements, key headlines, and primary CTAs
- **Medium Purple** (`#9B4DE8`): Secondary brand color for supporting UI elements, hover states, and visual accents

### Accent Colors
- **Golden Yellow** (`#F5BE2B`): Primary accent for action buttons, highlights, and success indicators
- **Secondary Gold** (`#F2C230`): Warm highlight variant used in badges and supporting accent elements

### Interactive
- **Dark Purple** (`#2A1045`): Interactive element backgrounds; ensures sufficient contrast for button and link states
- **Rich Purple** (`#361058`): Secondary interactive state; used for pressed, active, and focused component variants
- **Action Purple** (`#8341BE`): Tertiary interactive color for supplementary buttons and secondary CTAs

### Neutral Scale
- **Off-White** (`#FFFFFF`): Primary background for content areas, cards, and light surfaces
- **Light Lavender** (`#F1ECFB`): Subtle background tint for secondary surfaces and low-emphasis zones
- **Very Light Lavender** (`#F2EBFC`): Tertiary light surface for nested or grouped elements
- **Light Gray Purple** (`#E0DBE9`): Border and divider color; provides subtle separation without harsh lines
- **Black** (`#000000`): Text and icon color for maximum contrast and readability

### Surface & Borders
- **Deep Navy Background** (`#1A0A2E`): Deepest dark surface for footer and low-contrast dark regions
- **Dark Purple Surface** (`#3D2060`): Secondary dark background for alternate sections or overlays
- **Barely White** (`#FEFDFF`): Off-white variant for fine contrast adjustments in light surfaces

### Semantic / Status
- **Error Red** (`#DF2225`): Critical error states and destructive actions
- **Error Dark Red** (`#C8393C`): Secondary error state for emphasis on critical feedback

## 3. Typography Rules

### Font Family
**Primary:** Quicksand — geometric, friendly sans-serif; used for headlines and high-impact text
Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

**Secondary:** Be Vietnam Pro — modern, balanced sans-serif; used for body, buttons, and UI text
Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display / H2 | Quicksand | 69.6px | 900 | 71.688px | 0px | Hero section, largest headlines |
| Heading 1 | Quicksand | 29.6px | 900 | 32.56px | 0px | Page title, section breaks |
| Heading 3 | Quicksand | 24px | 900 | 30px | 0px | Subsection titles, card headers |
| Heading Accent | Quicksand | 18px | 900 | 28px | 0px | Feature highlights, emphasis text |
| Body | Be Vietnam Pro | 20px | 600 | 36px | 0px | Primary body text, descriptions |
| Link | Be Vietnam Pro | 16px | 400 | 24px | 0px | Hyperlinks, secondary actions |
| Button | Be Vietnam Pro | 14px | 900 | 20px | 0px | Button text, labels |
| List Item | Be Vietnam Pro | 14px | 600 | 24px | 0px | Bullet points, list entries |
| Caption | Be Vietnam Pro | 11px | 600 | 13.75px | 0px | Small text, metadata |

### Principles
- Use Quicksand exclusively for headlines to establish brand voice and hierarchy
- Maintain minimum 1.4x line-height multiplier for body text to support readability
- Weight 900 reserved for headlines and CTAs; ensures visual dominance
- Weight 600 used for body and list items to balance legibility with moderate emphasis
- Weight 400 for links and secondary text to reduce visual weight
- All typography scales maintain clear size distinctions for cognitive hierarchy
- Support Vietnamese text rendering by ensuring font stack includes system fonts

## 4. Component Stylings

### Buttons

**Primary Button (Purple Filled)**
- Background: `#7726B6`
- Text Color: `#FFFFFF`
- Font: Be Vietnam Pro, 14px, weight 900
- Padding: `12px 16px`
- Border Radius: `12px`
- Border: `1px solid transparent`
- Box Shadow: `0px 4px 0px 0px rgba(119, 38, 182, 0.3)`
- Height: `44px`
- Line Height: `20px`
- Hover State: Background `#8341BE`, Shadow `0px 6px 0px 0px rgba(119, 38, 182, 0.4)`
- Active State: Background `#6B1FA0`, Shadow `0px 2px 0px 0px rgba(119, 38, 182, 0.2)`

**Secondary Button (White Bordered)**
- Background: `#FFFFFF`
- Text Color: `#7726B6`
- Font: Be Vietnam Pro, 14px, weight 900
- Padding: `12px 16px`
- Border Radius: `12px`
- Border: `1px solid #7726B6`
- Box Shadow: `none`
- Height: `44px`
- Line Height: `20px`
- Hover State: Background `#F1ECFB`, Border `#8341BE`
- Active State: Background `#F2EBFC`, Border `#6B1FA0`

**Ghost Button (No Fill)**
- Background: `transparent`
- Text Color: `#7726B6`
- Font: Be Vietnam Pro, 14px, weight 900
- Padding: `8px 12px`
- Border Radius: `8px`
- Border: `1px solid #E0DBE9`
- Box Shadow: `none`
- Height: `36px`
- Line Height: `20px`
- Hover State: Background `#F1ECFB`, Text Color `#8341BE`
- Active State: Background `#F2EBFC`, Border `#7726B6`

**Icon Button (Circular)**
- Background: `rgba(255, 255, 255, 0.1)`
- Text Color: `#FFFFFF`
- Font: Be Vietnam Pro, 16px, weight 400
- Padding: `8px`
- Border Radius: `50%` (pill/circular)
- Border: `1px solid rgba(255, 255, 255, 0.25)`
- Box Shadow: `none`
- Width: `32px`
- Height: `32px`
- Hover State: Background `rgba(255, 255, 255, 0.2)`, Border `rgba(255, 255, 255, 0.4)`
- Active State: Background `rgba(255, 255, 255, 0.15)`

**Small Tag Button (Golden)**
- Background: `#F5BE2B`
- Text Color: `#191127`
- Font: Be Vietnam Pro, 11px, weight 900
- Padding: `6px 10px`
- Border Radius: `10px`
- Border: `none`
- Box Shadow: `0px 3px 0px 0px rgba(245, 190, 43, 0.3)`
- Height: `32px`
- Line Height: `13.75px`
- Hover State: Background `#F2C230`, Shadow `0px 4px 0px 0px rgba(245, 190, 43, 0.4)`

### Cards & Containers

**Feature Card**
- Background: `#FFFFFF`
- Text Color: `#191127`
- Font: Be Vietnam Pro, 16px, weight 400
- Padding: `24px`
- Border Radius: `16px`
- Border: `1px solid #E0DBE9`
- Box Shadow: `0px 2px 8px rgba(0, 0, 0, 0.08)`
- Line Height: `24px`
- Hover State: Border `#7726B6`, Shadow `0px 4px 16px rgba(119, 38, 182, 0.12)`

**Dark Hero Card**
- Background: `linear-gradient(135deg, #2A1045 0%, #361058 50%, #3D2060 100%)`
- Text Color: `#FFFFFF`
- Font: Be Vietnam Pro, 18px, weight 600
- Padding: `40px 48px`
- Border Radius: `20px`
- Border: `none`
- Box Shadow: `0px 8px 24px rgba(0, 0, 0, 0.24)`
- Line Height: `28px`

**Info Box (Light Background)**
- Background: `#F1ECFB`
- Text Color: `#191127`
- Font: Be Vietnam Pro, 14px, weight 600
- Padding: `16px 20px`
- Border Radius: `12px`
- Border: `1px solid #E0DBE9`
- Box Shadow: `none`
- Line Height: `24px`

### Inputs & Forms

**Text Input (Default)**
- Background: `#FFFFFF`
- Text Color: `#191127`
- Border: `1px solid #E0DBE9`
- Border Radius: `8px`
- Padding: `12px 16px`
- Font: Be Vietnam Pro, 14px, weight 400
- Height: `44px`
- Box Shadow: `none`
- Focus State: Border `#7726B6`, Box Shadow `0px 0px 0px 3px rgba(119, 38, 182, 0.1)`

**Textarea**
- Background: `#FFFFFF`
- Text Color: `#191127`
- Border: `1px solid #E0DBE9`
- Border Radius: `8px`
- Padding: `12px 16px`
- Font: Be Vietnam Pro, 14px, weight 400
- Min Height: `120px`
- Line Height: `24px`
- Focus State: Border `#7726B6`, Box Shadow `0px 0px 0px 3px rgba(119, 38, 182, 0.1)`

**Select / Dropdown**
- Background: `#FFFFFF`
- Text Color: `#191127`
- Border: `1px solid #E0DBE9`
- Border Radius: `8px`
- Padding: `12px 16px`
- Font: Be Vietnam Pro, 14px, weight 400
- Height: `44px`
- Appearance: `none` (remove browser default)
- Background Image: Chevron icon, `12px` from right edge
- Focus State: Border `#7726B6`, Box Shadow `0px 0px 0px 3px rgba(119, 38, 182, 0.1)`

### Navigation

**Header Navigation (Horizontal)**
- Background: `#FFFFFF`
- Text Color: `#191127`
- Font: Be Vietnam Pro, 14px, weight 900
- Padding: `16px 0px`
- Height: `64px`
- Box Shadow: `0px 2px 4px rgba(0, 0, 0, 0.06)`
- Link Padding: `8px 16px`
- Active Link: Color `#7726B6`, Border Bottom `2px solid #7726B6`
- Hover Link: Color `#8341BE`, Background `#F1ECFB`

**Breadcrumb Navigation**
- Font: Be Vietnam Pro, 12px, weight 400
- Text Color: `#7726B6`
- Separator: `/` in `#E0DBE9`
- Padding: `12px 0px`
- Line Height: `20px`

**Sidebar Navigation (Vertical)**
- Background: `#FFFFFF`
- Text Color: `#191127`
- Font: Be Vietnam Pro, 14px, weight 600
- Padding: `0px 16px`
- Item Height: `44px`
- Item Padding: `12px 16px`
- Border Left: `3px solid transparent`
- Active Item: Background `#F1ECFB`, Border Left `#7726B6`, Text Color `#7726B6`
- Hover Item: Background `#F2EBFC`

### Badges

**Status Badge (Purple)**
- Background: `#7726B6`
- Text Color: `#FFFFFF`
- Font: Be Vietnam Pro, 11px, weight 900
- Padding: `4px 8px`
- Border Radius: `12px`
- Border: `none`
- Line Height: `16px`

**Status Badge (Gold)**
- Background: `#F5BE2B`
- Text Color: `#191127`
- Font: Be Vietnam Pro, 11px, weight 900
- Padding: `4px 8px`
- Border Radius: `12px`
- Border: `none`
- Line Height: `16px`

**Status Badge (Error)**
- Background: `#DF2225`
- Text Color: `#FFFFFF`
- Font: Be Vietnam Pro, 11px, weight 900
- Padding: `4px 8px`
- Border Radius: `12px`
- Border: `none`
- Line Height: `16px`

### Progress Indicators

**Step Circle (Active)**
- Background: `#7726B6`
- Text Color: `#FFFFFF`
- Width: `40px`
- Height: `40px`
- Border Radius: `50%`
- Font: Quicksand, 18px, weight 900
- Line Height: `40px`
- Text Align: `center`

**Step Circle (Inactive)**
- Background: `#F1ECFB`
- Text Color: `#7726B6`
- Width: `40px`
- Height: `40px`
- Border Radius: `50%`
- Font: Quicksand, 18px, weight 900
- Line Height: `40px`
- Border: `2px solid #E0DBE9`

**Step Connector (Active)**
- Background: `#7726B6`
- Height: `4px`
- Margin: `0px 12px`

**Step Connector (Inactive)**
- Background: `#E0DBE9`
- Height: `4px`
- Margin: `0px 12px`

## 5. Layout Principles

### Spacing System

**Base Unit:** 4px

**Scale:**
- 4px: Micro-spacing for inline elements, tight grouping
- 8px: Tight spacing for related components
- 12px: Standard small gap between elements
- 16px: Standard padding for components; small section margins
- 20px: Medium gap for grouped content
- 24px: Standard padding for cards and containers
- 28px: Medium section spacing
- 32px: Larger component padding
- 40px: Section margin, vertical rhythm
- 48px: Large section spacing
- 56px: Extra-large spacing for major content sections
- 72px: Maximum padding for hero and full-bleed sections

**Usage Context:**
- 4px–8px: Icon padding, badge spacing, tight button groups
- 12px–16px: Component internal padding, adjacent element gaps
- 20px–24px: Card padding, section internal spacing
- 28px–40px: Vertical rhythm between content blocks
- 48px–72px: Section separation, hero regions

### Grid & Container

**Max Width:** 1280px (content container)
**Sidebar Width:** 280px (when present)
**Column Strategy:** 12-column grid at desktop; 6-column at tablet; 1-column at mobile
**Gutter:** 16px on desktop, 12px on tablet, 8px on mobile
**Container Padding:** 40px desktop, 24px tablet, 16px mobile
**Section Pattern:** Full-width backgrounds with contained content inside; alternating light/dark backgrounds for visual separation

### Whitespace Philosophy

Generous whitespace creates breathing room for students absorbing complex technical content. Dark purple hero sections are balanced with light lavender and off-white content areas. Vertical rhythm is maintained through consistent spacing multiples (4px base). Margins between sections (40px–72px) ensure content blocks feel grouped yet distinct. Padding inside cards (24px–32px) prevents text crowding and supports scannability. Whitespace around CTAs increases visual prominence without visual clutter.

### Border Radius Scale

- 4px: Minimal rounding for subtle UI elements, tags
- 8px: Standard inputs, small buttons, containers
- 10px: Small badge and tag buttons
- 12px: Cards, standard buttons, form inputs
- 16px: Large cards, featured containers
- 20px: Hero sections, full-bleed containers
- 50%: Circular elements, icon buttons, avatars

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | No shadow, `box-shadow: none` | Inactive states, disabled elements, background fills |
| Base | `0px 2px 4px rgba(0, 0, 0, 0.06)` | Navigation bars, subtle containers |
| Raised | `0px 4px 8px rgba(0, 0, 0, 0.12)` | Cards, modals, floating elements |
| Elevated | `0px 8px 16px rgba(0, 0, 0, 0.16)` | Dropdown menus, popovers, overlays |
| High | `0px 12px 24px rgba(0, 0, 0, 0.24)` | Modals, hero sections, primary focus areas |
| Button Hover | `0px 4px 0px 0px rgba(119, 38, 182, 0.3)` | Button push effect on hover |
| Button Active | `0px 2px 0px 0px rgba(119, 38, 182, 0.2)` | Button pressed state effect |

**Shadow Philosophy:** Shadows are minimal and purposeful, adding depth without visual heaviness. Purple-tinted shadows reinforce brand identity on interactive elements. Button shadows use a 4px vertical offset to convey a tactile "press" interaction, reducing to 2px on active state. Container shadows (2px–12px) create clear layering hierarchy. Shadows fade slightly at the edges to ensure soft, natural appearance that doesn't distract from content.

## 7. Do's and Don'ts

### Do

- Use Quicksand for all headlines and accent text; it establishes immediate brand recognition
- Maintain minimum 1.4x line-height for body text to support reading comfort across all devices
- Pair purple buttons with golden accents for CTAs that need extra emphasis
- Group related spacing using 4px multiples to maintain visual rhythm
- Apply border radius consistently: 8px for inputs/buttons, 12px for cards, 16px for featured containers
- Use the neutral scale (`#E0DBE9` for borders, `#F1ECFB` for backgrounds) to reduce visual noise
- Implement 40px–72px vertical spacing between major content sections
- Add purple-tinted shadows to interactive elements for depth feedback
- Validate form inputs with error red (`#DF2225`) paired with descriptive messaging
- Stack color contrast: dark purples on light backgrounds, white on dark purples

### Don't

- Mix Be Vietnam Pro and Quicksand in headline text; choose one font family per hierarchy level
- Use borders thicker than 1px; borders should be subtle guides, not visual walls
- Apply box shadows larger than 24px blur radius; keeps the design lightweight
- Stretch text beyond 75 characters per line; maintain readability at 60–70 characters
- Combine more than one accent color (purple + gold) in a single component; use one per CTA
- Override the 4px spacing scale without documentation; consistency maintains cognitive load reduction
- Use low-contrast color pairs; maintain WCAG AA minimum (4.5:1 for body, 3:1 for large text)
- Place text directly on images without a dark overlay; ensure text legibility
- Apply rounded corners below 4px; results in anti-aliasing artifacts
- Animate elements with durations faster than 150ms or slower than 500ms; impacts perceived responsiveness

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | 320px–639px | Single column, full-width containers, 16px padding, 12px gaps, 18px body text, stacked navigation, touch targets 44px minimum |
| Tablet | 640px–1023px | 2 columns, 24px padding, 16px gaps, stacked hero text, collapsible navigation, 44px–48px touch targets |
| Desktop | 1024px–1279px | 3–4 columns, full layout, 40px padding, 24px gaps, side-by-side content, horizontal nav, optimized line lengths |
| Wide | 1280px+ | Max-width containers (1280px), centered layout, 40px padding, 28px gaps, full feature layout, sidebar support |

### Touch Targets

**Minimum:** 44px × 44px for all interactive elements
**Recommended:** 48px × 48px for primary actions
**Spacing:** Minimum 8px between adjacent touch targets
**Icon Buttons:** 40px × 40px at minimum; 48px × 48px for primary actions
**Small UI:** Minimum 32px × 32px for secondary or tertiary buttons (tag buttons, helpers)
**Links:** Minimum 44px height; padding adjustment for text-only links
**Form Controls:** Input height 44px, select dropdowns 44px, checkboxes 20px × 20px with 20px padding zone

### Collapsing Strategy

**Hero Section:**
- Desktop: Full-width with image on right, text left-aligned, 72px top padding
- Tablet: Image below text, reduced padding (48px), headlines scaled down 15%
- Mobile: Single column, image full-width, text below, 24px padding, headlines scaled down 25%

**Navigation:**
- Desktop: Horizontal menu visible
- Tablet: Horizontal menu with hamburger fallback at 768px
- Mobile: Full-screen hamburger menu, stacked navigation items

**Cards & Grid:**
- Desktop: 3–4 columns, 24px gaps
- Tablet: 2 columns, 20px gaps
- Mobile: Single column, 16px gaps, full-width cards

**Typography:**
- Desktop: Full hierarchy, 14px–69.6px range
- Tablet: Headlines scaled 85%, body 18px
- Mobile: Headlines scaled 70%, body 16px, minimum 14px for captions

**Buttons:**
- Desktop: Inline buttons (44px height), multiple per row
- Tablet: Full-width or 2-up grid at 640px+
- Mobile: Full-width buttons, stacked vertically with 12px gaps

**Spacing:**
- Desktop: 40px–72px section margins
- Tablet: 32px–48px section margins
- Mobile: 24px–32px section margins

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA:** Brand Purple (`#7726B6`) with white text, 12px border radius, 4px purple shadow
- **Secondary CTA:** White background (`#FFFFFF`) with purple text (`#7726B6`), 12px border radius, 1px border
- **Background (Dark):** Deep Navy Purple (`#191127`) or gradient variants for hero sections
- **Background (Light):** Off-White (`#FFFFFF`) with Light Lavender (`#F1ECFB`) accents
- **Heading Text:** Deep Navy (`#191127`) on light backgrounds; White on dark backgrounds
- **Body Text:** Deep Navy (`#191127`) with 20px size, 36px line-height, Be Vietnam Pro, 600 weight
- **Accent/Tags:** Golden Yellow (`#F5BE2B`) for badges and progress indicators
- **Error State:** Error Red (`#DF2225`) with white text
- **Borders:** Light Gray Purple (`#E0DBE9`) at 1px weight
- **Shadows:** Purple-tinted (use `rgba(119, 38, 182, opacity)`) for elevated elements

### Iteration Guide

1. **Font Hierarchy:** Quicksand for headlines (18px–69.6px, weight 900); Be Vietnam Pro for body/UI (11px–20px, weights 400–900). Maintain size jumps of 1.2x–1.5x between levels.

2. **Spacing:** Use 4px base unit. Apply 24px padding inside cards, 16px padding for inputs, 40px–72px between sections. Maintain consistent vertical rhythm across all breakpoints.

3. **Color Application:** Primary Purple (`#7726B6`) for main CTAs and brand identity; Golden Yellow (`#F5BE2B`) for secondary highlights; neutrals (`#E0DBE9`, `#F1ECFB`) for borders and low-emphasis surfaces.

4. **Button Styling:** All buttons use 44px height minimum, 12px border radius, Be Vietnam Pro 14px weight 900. Primary = purple fill + 4px shadow on hover; Secondary = white fill + 1px purple border; Ghost = transparent + border only.

5. **Elevation & Shadows:** Use minimal shadows (2px–24px blur). Button interactions: 4px offset on hover, 2px on active. Cards: 8px blur for standard, 16px for elevated. Shadow color: always use purple-tinted `rgba(119, 38, 182, opacity)` or neutral `rgba(0, 0, 0, opacity)`.

6. **Responsive:** Mobile-first approach. Breakpoints: 640px (tablet), 1024px (desktop), 1280px (wide). Stack buttons vertically on mobile, reduce font sizes 70%–85%, use full-width cards, 16px padding.

7. **Form & Input:** Height 44px, 8px border radius, 1px border (`#E0DBE9`), 12px padding. Focus: border `#7726B6` + 3px purple shadow. Validation: Error Red text + error icon.

8. **Navigation:** Horizontal at desktop (64px height), hamburger menu below 640px. Active items: purple text + bottom border. Hover: Light Lavender background.

9. **Validation & Accessibility:** Minimum 4.5:1 contrast (body text), 3:1 (large text). Touch targets 44px minimum. Label all form fields explicitly. Use semantic HTML. Test with screen readers.

10. **States & Interaction:** Every interactive element needs hover (color shift + shadow), active (color intensify + shadow reduce), focus (outline or ring + shadow), disabled (opacity 0.5 + gray). Transitions: 200ms–300ms for smooth interactions without lag.