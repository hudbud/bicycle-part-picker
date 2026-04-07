# Pedal Parts Picker — Product Requirements Document

**Version:** 2.0  
**Type:** New Build (Greenfield)  
**Status:** Ready for Implementation

---

## 1. Vision

Pedal Parts Picker is the definitive tool for planning a custom bicycle build. It works like PCPartPicker.com but for bikes — a structured, component-by-component builder that helps cyclists research parts, track compatibility, visualize total cost, and share their builds with the world.

The product is for:
- Enthusiast cyclists planning a custom build from scratch
- Riders upgrading specific components on an existing bike
- Mechanics and shop staff helping customers plan builds
- Collectors maintaining a wishlist or parts inventory

The core loop is simple: pick a category → search/browse parts → add to build → see your full spec with live pricing.

---

## 2. Design Philosophy

### Look & Feel
The app should feel premium, focused, and technical — like a tool built by cyclists, for cyclists. Think dark navy sidebars, crisp white content areas, and subtle orange or green accents. Not flashy. Not bloated. Clean like a well-maintained drivetrain.

Reference aesthetics:
- PCPartPicker: structured, table-driven, functional
- Canyon Bikes product pages: high contrast, generous whitespace
- Linear.app: fast, keyboard-friendly, obsessive about details

### Core Design Principles
- **Density with breathing room.** The builder is a table, not a card grid. Users are comparing specs and prices — they need to see everything at a glance. But the table should feel spacious, not cramped.
- **Progressive disclosure.** Only show what's needed at each step. The compatibility warnings, the part detail drawer, the export options — these surface when relevant, not all at once.
- **Dark mode first.** Most enthusiast tools are dark. Build dark mode as the default experience, light mode as the toggle.
- **Zero friction sharing.** A build URL should be shareable with one click, no account required to view.

---

## 3. Information Architecture

```
/                       → Landing page (hero + example builds)
/build                  → The Builder (main product experience)
/build/:buildId         → Shared/public view of a saved build
/garage                 → Saved builds (auth required)
/parts                  → Parts Bin / inventory
/explore                → Browse community builds (future)
/about                  → About the product
```

### Navigation Structure
- **Top bar (always visible):** Logo, nav links, dark mode toggle, user avatar/auth CTA
- **Mobile:** Hamburger → full-screen drawer with same nav
- **Active state:** Underline + accent color on current page link

---

## 4. Pages & Features

---

### 4.1 Landing Page (`/`)

**Purpose:** Explain the product and drive users to start a build.

**Above the fold:**
- Headline: "Build your perfect bike." (large, confident)
- Subhead: "Plan your dream build component by component. Compare prices, check specs, and share your build with one link."
- Single CTA: "Start Building" → routes to `/build`
- Background: a subtle, high-contrast image or illustration of a bike frame silhouette (SVG, not a photo)

**Below the fold:**
- 3-column "How it works" section:
  1. Pick your components
  2. Track price and compatibility
  3. Share with one link
- "Example Builds" section — 3 featured build cards (hardcoded for MVP, community-generated later)
  - Each card shows: build name, bike type badge (Road / MTB / Gravel / Track), total price, component count, thumbnail icon

**Footer:**
- App name + tagline
- Links: Builder, Garage, About, GitHub
- "Built for cyclists, by cyclists"

---

### 4.2 The Builder (`/build`)

This is the core product. It is a structured, category-by-category component selector. Every design and UX decision should serve the goal of making it fast and pleasant to assemble a complete bike spec.

#### 4.2.1 Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Build name (editable) + bike type selector         │
│  Progress bar: 4 / 11 components selected                   │
├─────────────────────────────────────────────────────────────┤
│  COMPONENT TABLE                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Category     Part          Price   Status   Actions │  │
│  │  ─────────────────────────────────────────────────── │  │
│  │  Frame        Trek Emonda   $1,899  Owned    [×]     │  │
│  │  Fork         (Choose)      —       —        [+]     │  │
│  │  Wheels       (Choose)      —       —        [+]     │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  STICKY FOOTER: Total: $4,299  [Save Build]  [Share]       │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2.2 Build Header

- **Build name:** Inline-editable text field. Placeholder: "My Build". Click to edit, blur/enter to save.
- **Bike type selector:** Pill tabs — Road | Mountain | Gravel | Track | BMX | Other. Selecting a type adjusts which component categories are shown (e.g. Track doesn't show suspension fork, MTB doesn't show aero bars).
- **Progress bar:** "X of Y components selected." Uses a linear progress bar with color transitioning from gray → amber → green as fill increases.

#### 4.2.3 Component Table

The table has the following columns:

| Column | Description |
|---|---|
| Category | Component type (Frame, Fork, Wheels, etc.) — fixed, not editable |
| Part | Selected part name + brand, or "(Choose a part)" in muted text |
| Price | Selected part's price, or "—" if none selected |
| Status | Status badge (see 4.2.5) or empty |
| Actions | Remove button (×) if part selected, or Add button (+) if empty |

**Table behavior:**
- Clicking any row (the Part cell, or the Add button) opens the Part Selection Modal
- Clicking × removes the part from that slot (with a brief undo toast)
- Rows alternate between `bg-card` and `bg-muted/40` for scannability
- Hover state on each row: `bg-accent/60`
- The table header is sticky within the scroll container

#### 4.2.4 Component Categories

Categories shown depend on the selected bike type. Default (Road) categories:

1. Frame
2. Fork
3. Wheels / Wheelset
4. Tires
5. Drivetrain (Groupset / Drivetrain — one slot with sub-parts OR one "groupset" slot)
6. Crankset
7. Bottom Bracket
8. Chain
9. Cassette
10. Handlebars
11. Stem
12. Saddle
13. Seatpost
14. Pedals
15. Brakes

Category sets by bike type:
- **Mountain:** swap Aero Bars → Suspension Fork, add Rear Shock, remove Aero bars, add Dropper Post
- **Track/Fixed:** remove Brakes, Cassette, remove rear derailleur, simplify drivetrain
- **Gravel:** similar to Road with wider tire clearance noted
- **BMX:** completely different simplified list (Frame, Fork, Bars, Stem, Cranks, Chain, Sprocket, Wheels, Pedals)

#### 4.2.5 Status Badges

Each selected component can be assigned a status. Displayed as colored pill badges.

| Status | Color | Meaning |
|---|---|---|
| Owned | Green | You already own this part |
| Purchased | Blue | Ordered/bought, not yet installed |
| In Parts Bin | Amber | In your inventory |
| Wanted | Purple | On your wishlist |
| (none) | — | No status assigned |

Clicking the badge opens a small dropdown/popover to change status.

#### 4.2.6 Sticky Footer Bar

Always visible at the bottom of the builder:
- **Total price:** Sum of all selected parts with prices. Formatted as "$4,299" or "~$4,299" when some prices are missing.
- **Save Build button:** Opens save dialog (requires auth; prompts login if not authenticated)
- **Share button:** Copies shareable link to clipboard, shows toast "Link copied!"
- **Export dropdown:** Text / CSV / JSON options

On mobile, the sticky footer collapses to show just the total and a primary "Save" button. Other actions accessible via a "..." menu.

#### 4.2.7 Save Build Dialog

Modal overlay triggered by "Save Build":
- Build name field (pre-filled from header)
- Bike type (read-only, shows current selection)
- Description textarea (optional, placeholder: "Add notes about your build...")
- Visibility toggle: Public / Private
- Save button

---

### 4.3 Part Selection Modal

Triggered by clicking any row in the builder. A slide-up panel (mobile) or centered modal (desktop).

#### Header
- Category name (e.g. "Select a Frame")
- Search input: "Search parts..." — filters the list in real time
- Close (×) button

#### Part List
- Each part is a card row containing:
  - Part name (bold)
  - Brand name (muted, smaller)
  - Price (right-aligned)
  - Spec tags (e.g. "Carbon", "Road", "Rim Brake") — small pill chips
  - A "Select" button or the row itself is clickable
- Clicking a part selects it and closes the modal
- Selected part is highlighted with a check icon

#### Filters (collapsible sidebar or top filter row)
- Price range slider
- Material (Carbon, Aluminum, Steel, Titanium)
- Compatibility tags (varies by category)
- Brand filter (multi-select)

#### Manual Entry
At the bottom of the modal, a "Can't find your part?" row opens an inline form:
- Part name
- Brand
- Price
- Link (optional — e.g. product URL)

Submitting adds a custom part to that slot and to the user's personal part database.

---

### 4.4 Garage (`/garage`)

Where authenticated users manage their saved builds.

#### Layout
- Page title: "My Garage"
- Grid of build cards (2 columns desktop, 1 column mobile)
- Empty state: illustration + "You haven't saved any builds yet. Start Building →"

#### Build Card
Each card displays:
- Build name (large, bold)
- Bike type badge
- Component count: "9 of 15 components selected"
- Total price
- Last updated: "Updated 3 days ago"
- Status summary: mini row of colored dots representing each component's status
- Actions: Load Build | Share | Duplicate | Delete

**Load Build:** Navigates to `/build` with that build's components pre-populated. This must actually work — loading a build populates the builder.

**Duplicate:** Creates a copy of the build with name "Copy of [name]", opens in builder.

**Delete:** Confirmation popover ("Delete this build? This can't be undone.") → deletes.

---

### 4.5 Parts Bin (`/parts`)

A standalone inventory of parts the user owns, has purchased, or wants to track independently of any specific build.

#### Layout
- Page title: "Parts Bin"
- Total inventory value shown at top: "Total value: $2,340"
- Filter bar: All | Owned | Purchased | Wanted | by Category dropdown | sort (Name, Price, Date Added)
- Parts list (table on desktop, cards on mobile)

#### Parts Table Columns
| Column | Description |
|---|---|
| Part | Name + Brand |
| Category | What kind of part it is |
| Price | User-entered price |
| Status | Owned / Purchased / Wanted badge |
| Notes | Optional user notes (truncated, expand on click) |
| Actions | Edit | Remove |

#### Add Part to Bin
Persistent "+ Add Part" button opens a simple form:
- Part name
- Brand
- Category (dropdown)
- Price
- Status
- Notes

#### Inline Editing
Clicking "Edit" on a row makes that row editable in-place (fields become inputs). Save with Enter or a checkmark button.

---

### 4.6 Shared Build Page (`/build/:buildId`)

The public, read-only view of a saved build. No auth required to view.

#### Layout
- "Shared Build" badge at top
- Build name (large heading)
- Bike type badge
- Created by: "by [username]" (display name, never a raw user ID)
- Build date
- Description (if provided)
- Component table — same visual style as the builder, but read-only
  - Status badges visible
  - No edit controls, no remove buttons, no status change
- Total price displayed prominently
- CTA: "Build something like this →" routes to `/build` (does not auto-import the build, just prompts them to start their own)
- Share button: copy URL to clipboard

---

### 4.7 About Page (`/about`)

Real content, not a placeholder.

**Sections:**
1. **What is Pedal Parts Picker?** — 2-3 paragraphs explaining the product. Origin story: cyclists struggle to plan custom builds across spreadsheets, forum posts, and browser tabs. PPP solves this.
2. **How it works** — numbered steps with icons
3. **Bike types supported** — brief list with examples
4. **Roadmap (teaser)** — mention community builds, compatibility checking, price tracking
5. **Open source / contribute** — GitHub link (placeholder)
6. **Contact** — email or feedback link

---

## 5. Component & UI System

### 5.1 Color Tokens

All colors must use semantic CSS variables — no hardcoded hex in component code. Design tokens:

**Backgrounds:**
- `--bg-page`: outermost page background
- `--bg-surface`: card/panel backgrounds
- `--bg-subtle`: alternating table rows, muted areas

**Text:**
- `--text-primary`: body text
- `--text-secondary`: labels, captions
- `--text-muted`: placeholders, disabled

**Accents:**
- `--accent-primary`: CTA buttons, active nav links (brand color — e.g. a warm orange or electric blue)
- `--accent-secondary`: hover states

**Status colors:**
- `--status-owned`: green family
- `--status-purchased`: blue family
- `--status-wanted`: purple family
- `--status-partsbin`: amber family

**Borders:**
- `--border-default`: standard borders
- `--border-strong`: table headers, dividers

### 5.2 Typography

- **Font:** System font stack or a clean sans-serif (Inter, DM Sans, or similar from Google Fonts)
- **Scale:**
  - Page heading: 28px / 500
  - Section heading: 20px / 500
  - Table header: 13px / 500 / uppercase / letter-spacing: 0.05em
  - Body: 15px / 400
  - Caption / label: 13px / 400
  - Price (featured): 18px / 600
- **Never use font-weight above 600**

### 5.3 Spacing

Use a base-8 spacing system: 4, 8, 12, 16, 24, 32, 48, 64, 96px.

### 5.4 Dark Mode

Dark mode is the default. Light mode available via toggle stored in localStorage. The `<html>` element receives a `dark` class; all CSS variables resolve differently in dark mode.

Dark defaults:
- `--bg-page`: deep navy or near-black (e.g. `#0d1117`)
- `--bg-surface`: slightly lighter (e.g. `#161b22`)
- `--text-primary`: near-white (e.g. `#e6edf3`)
- `--accent-primary`: a bright, readable accent (orange, electric blue, or neon green — pick one)

### 5.5 Reusable Components

Every UI element should be a standalone component with clear props and no hardcoded styles.

**`<StatusBadge status="owned|purchased|wanted|partsbin" />`**
- Pill badge with color-coded background
- Text label matching status

**`<BuildProgress filled={4} total={15} />`**
- Label: "4 of 15 components selected"
- Linear progress bar (gray → amber → green)
- Memoized

**`<PriceDisplay price={1899} missing={false} />`**
- Formatted: "$1,899"
- When price missing: "—" in muted text
- When partial total: "~$4,299"

**`<BikeTypePill type="road|mtb|gravel|track|bmx" />`**
- Color-coded by bike type
- Used on build cards and shared build page

**`<ThemeToggle />`**
- Sun/moon icon toggle
- Syncs to localStorage + html.dark class

**`<MobileNav />`**
- Hamburger → full-screen drawer
- Contains nav links, ThemeToggle, user auth area

**`<Toast message="" type="success|error|info" />`**
- Appears top-right, auto-dismisses after 3s
- Used for: "Link copied!", "Build saved!", "Part removed (Undo)"

---

## 6. State Management

The app maintains a single "current build" in memory (React state or Zustand store). The build state shape:

```typescript
interface Build {
  id?: string;                    // set when saved
  name: string;                   // "My Build"
  bikeType: BikeType;             // 'road' | 'mtb' | 'gravel' | 'track' | 'bmx'
  description?: string;
  isPublic: boolean;
  components: ComponentSlot[];    // one per category
  createdAt?: string;
  updatedAt?: string;
}

interface ComponentSlot {
  category: ComponentCategory;    // 'frame' | 'fork' | 'wheels' | ...
  part?: Part;                    // null if slot is empty
  status?: PartStatus;            // 'owned' | 'purchased' | 'wanted' | 'partsbin'
}

interface Part {
  id: string;
  name: string;
  brand: string;
  price?: number;
  specs?: Record<string, string>; // e.g. { material: 'carbon', weight: '850g' }
  url?: string;
  isCustom?: boolean;             // true if user entered it manually
}
```

The build persists to localStorage so the user's work survives a page refresh before saving.

---

## 7. Data: Parts Database

For MVP, the parts database can be a curated static JSON file bundled with the app. It should contain at minimum:

- 10–15 parts per major category
- Covering Road and MTB bike types
- Each part has: id, name, brand, category, price, specs tags

This powers the Part Selection Modal's search and filtering. No external API required for MVP.

Later iterations can integrate real product APIs (e.g. competitive cycling retailers).

---

## 8. Routing & URL Design

| Route | Component | Auth Required |
|---|---|---|
| `/` | LandingPage | No |
| `/build` | BuilderPage | No (save requires auth) |
| `/build/:buildId` | SharedBuildPage | No |
| `/garage` | GaragePage | Yes → redirect to login |
| `/parts` | PartsPage | Yes → redirect to login |
| `/about` | AboutPage | No |

---

## 9. Authentication

- Email/password auth via Supabase Auth
- Auth state persists via localStorage (Supabase handles this)
- Unauthenticated users can use the builder fully — they just can't save or access Garage
- When an unauthed user clicks "Save Build," show an auth modal (login/signup) — don't navigate away from the builder
- After login, auto-save the build they were working on

---

## 10. Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640–1024px
- Desktop: > 1024px

### Mobile-specific behaviors
- Navigation: hamburger → drawer
- Builder table: stacked cards instead of table rows (Category + Part on one line, price + status below)
- Part Selection Modal: slides up from bottom (sheet)
- Sticky footer: compressed — just total + primary CTA
- Garage: single-column card grid

---

## 11. Interactions & Micro-animations

Keep animations functional, not decorative. All animations respect `prefers-reduced-motion`.

| Interaction | Animation |
|---|---|
| Row hover in builder | Background transition: 150ms ease |
| Modal open | Fade + scale from 95% → 100%: 200ms |
| Mobile drawer open | Slide from left: 250ms ease |
| Toast appear | Slide down from top + fade: 200ms |
| Progress bar fill | Width transition: 400ms ease |
| Part added to slot | Row background flash (accent color → transparent): 300ms |
| Part removed | Row fade to 50% → removed: 200ms |
| Link copied toast | Appears immediately, fades after 3s |

---

## 12. Empty States

Every list and table needs a well-designed empty state. Not just "No results." Something that tells the user what to do next.

| Location | Empty State |
|---|---|
| Builder (no parts selected) | "Start by choosing a frame →" with a gentle arrow pointing to the Frame row |
| Garage (no saved builds) | Illustration + "You haven't saved any builds. Start Building →" |
| Parts Bin (empty) | "Your parts bin is empty. Add parts you own or want to track." + Add Part button |
| Part Selection Modal (no search results) | "No parts found. Try a different search or add a custom part." |
| Shared Build (build not found) | "This build doesn't exist or has been made private." |

---

## 13. Accessibility

- All interactive elements reachable by keyboard
- Focus rings visible in keyboard navigation mode
- Color is never the sole differentiator (badges also have text labels)
- Status badges have `aria-label` attributes
- Modal dialogs trap focus and restore on close
- Images and icons have `alt` text or `aria-label`
- The part table uses proper `<table>` semantics with `<th scope="col">`

---

## 14. Key User Journeys

### Journey 1: First-time visitor builds and shares
1. Lands on `/`
2. Clicks "Start Building"
3. Selects bike type: Road
4. Clicks Frame row → Part Selection Modal opens
5. Searches "Trek Emonda", selects it
6. Continues adding parts across categories
7. Sees progress bar fill up, total price update
8. Clicks "Share" → link copied toast
9. Pastes link to a friend → friend sees `/build/:id` with full spec

### Journey 2: Returning user manages garage
1. Signs in → lands on Garage
2. Sees saved builds with metadata
3. Clicks "Load Build" on an existing build → routes to Builder with build pre-populated
4. Makes changes, saves
5. Shares updated build

### Journey 3: Parts Bin user
1. Signs in → goes to Parts Bin
2. Sees list of parts they own
3. Adds a new part they just bought
4. Views total inventory value
5. Filters by "Owned" to see what's ready to install

---

## 15. Out of Scope (MVP)

These features are explicitly deferred:

- Compatibility checking (e.g. "this derailleur won't fit this cassette range")
- Price tracking / price history
- Community / Explore page
- Comments on builds
- Image uploads (frame photos, build photos)
- Gear calculator (cadence, gear ratios)
- Import from existing spreadsheet
- Mobile apps (iOS/Android)
- OAuth / social login (GitHub, Google)

---

## 16. MVP Success Criteria

| # | Criterion |
|---|---|
| 1 | User can build a complete bike spec across all categories without creating an account |
| 2 | User can save a build (requires login) and reload it exactly from Garage |
| 3 | A shared build URL is viewable by anyone without auth |
| 4 | Dark mode works fully across all pages with no hardcoded colors anywhere |
| 5 | Mobile experience is fully usable at 375px width (no horizontal scroll, no overflow) |
| 6 | Part status badges display correctly and are changeable inline |
| 7 | Progress bar accurately reflects component fill count |
| 8 | Total price updates in real time as parts are added or removed |
| 9 | Build state survives a page refresh (localStorage persistence) |
| 10 | All empty states are implemented with helpful prompts |
| 11 | All animations respect prefers-reduced-motion |
| 12 | No raw UUIDs or technical identifiers ever shown in the UI |
