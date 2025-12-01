# Design Guidelines: Weather-Based Work BGM Application

## Design Approach

**Reference-Based Approach** drawing from:
- **Spotify**: Clean music player interface, focused playback controls
- **Apple Weather**: Atmospheric backgrounds that reflect conditions
- **Calm/Headspace**: Minimalist, distraction-free ambient design
- **Notion**: Subtle, elegant UI components

**Core Principle**: Create a serene, atmospheric interface that adapts to weather and time, supporting focus rather than demanding attention.

---

## Typography

**Font Families** (via Google Fonts):
- Primary: `Inter` (UI elements, controls, labels) - 400, 500, 600
- Display: `Space Grotesk` (BGM titles, mood descriptions) - 500, 600, 700

**Hierarchy**:
- App Title: Space Grotesk 600, 32px (2xl)
- BGM Title/Mood: Space Grotesk 600, 24px (xl)
- Current Conditions: Inter 500, 18px (lg)
- UI Labels: Inter 500, 14px (sm)
- Metadata: Inter 400, 12px (xs)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **4, 6, 8, 12, 16**
- Component spacing: p-6, p-8
- Element gaps: gap-4, gap-6
- Section margins: mb-8, mb-12

**Viewport Strategy**:
- Single-page app with centered player interface
- Main player: max-w-4xl, centered vertically and horizontally
- Weather background: full viewport with gradient overlay

---

## Component Architecture

### 1. **Full-Screen Weather Background**
- Dynamic background that changes based on weather conditions
- Subtle animated gradients (gentle transitions, no jarring movements)
- Time-of-day overlay (morning warmth, evening cool tones, night darkness)
- Semi-transparent overlay (opacity-40 to opacity-60) for readability

### 2. **Central Player Card**
- Frosted glass effect container (backdrop-blur-lg, bg-white/10)
- Rounded corners: rounded-3xl
- Padding: p-8 md:p-12
- Drop shadow: shadow-2xl for depth

**Card Contents** (vertical stack, gap-8):

**Weather & Time Display**
- Top section showing current conditions
- Icon + temperature + location
- Time of day indicator
- Layout: Horizontal flex, items-center, justify-between

**BGM Information Panel**
- Large mood title (Space Grotesk, centered)
- Generated description (2-3 lines, Inter, text-center, opacity-80)
- Current track status indicator

**Playback Controls**
- Large circular play/pause button (w-20 h-20)
- Flanking skip buttons (w-12 h-12)
- Layout: Horizontal centered, gap-6
- Buttons: backdrop-blur-md, rounded-full, hover:scale-105 transition

**Volume Control**
- Horizontal slider with speaker icons
- Width: w-full max-w-xs
- Minimalist track with smooth handle

**Track Progress**
- Thin progress bar below controls
- Height: h-1, rounded-full
- Shows current playback position

### 3. **Settings Panel** (Collapsible)
- Compact icon button (top-right of player card)
- Expands to show:
  - Location input field (manual override)
  - Generated BGM history (last 5-8 tracks)
  - Refresh/regenerate button

### 4. **Status Indicators**
- Small badges showing:
  - "Generating..." when creating new BGM
  - "Playing" / "Paused" state
  - Weather update timestamp
- Positioned: Bottom of player card, text-xs

---

## Animations & Transitions

**Minimal, purposeful animations only**:
- Weather background: Slow gradient shifts (30s transitions)
- Button interactions: scale-105 on hover (duration-200)
- Card appearance: Gentle fade-in on load (duration-500)
- Progress bar: Smooth animation (duration-300)
- No distracting particle effects or constant motion

---

## Weather-Responsive Design

**Background Treatments** by Condition:
- **Sunny**: Warm gradient (yellow-orange), soft glow
- **Cloudy**: Cool gray gradient, muted tones
- **Rainy**: Deep blue-gray, subtle rain texture overlay
- **Snowy**: White-blue gradient, ethereal feel
- **Night**: Dark gradient with subtle stars

**Time-of-Day Overlays**:
- Morning (6-11): Soft warm glow
- Afternoon (12-17): Bright, clear
- Evening (18-21): Golden hour warmth
- Night (22-5): Cool, dark atmosphere

---

## Interactive States

**Buttons**: All use backdrop-blur-md backgrounds
- Default: opacity-80
- Hover: opacity-100, scale-105
- Active: scale-95
- Disabled: opacity-40

**Input Fields**:
- Frosted glass effect matching card
- Focused: ring-2, subtle glow
- Height: h-12

**Sliders**:
- Track: h-2, rounded-full, backdrop-blur-sm
- Thumb: w-5 h-5, rounded-full, shadow-lg

---

## Images

**Hero/Background Image**: 
Full-viewport weather-responsive background image that changes based on conditions and time. Images should be atmospheric, slightly blurred for text readability.

**Image Placement**:
- Sunny Day: Bright sky, sunlight through trees
- Rainy: Rain on window, city streets
- Night: Night sky, city lights
- Cloudy: Overcast landscape

Images serve as full-screen backdrop with gradient overlay for depth and readability.

---

## Accessibility

- High contrast text against frosted backgrounds
- Keyboard navigation for all controls
- Focus indicators: ring-2 ring-offset-2
- ARIA labels for icon-only buttons
- Screen reader announcements for BGM changes

---

## Key Design Principles

1. **Calm First**: Every element supports focus, nothing distracts
2. **Atmospheric**: Weather creates emotional context, not decoration
3. **Intuitive**: Controls need no explanation
4. **Adaptive**: Visual treatment responds to environment
5. **Minimal**: Show only what matters, hide complexity