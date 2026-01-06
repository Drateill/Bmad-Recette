# User Interface Design Goals

## Overall UX Vision

BMad Recette's UX embodies **effortless efficiency**—a clean, intuitive interface that eliminates friction at every interaction. The design philosophy prioritizes speed and clarity: users should be able to create a recipe in under 2 minutes, generate a weekly menu in 3 clicks, and navigate their entire collection with zero cognitive load. We embrace a "progressive disclosure" approach where power features remain accessible but don't overwhelm novice users. Visual hierarchy guides users naturally from recipe discovery → selection → action (cook, shop, share), with contextual actions surfacing exactly when needed.

## Key Interaction Paradigms

- **Gesture-first on mobile**: Swipe to mark shopping items complete, long-press for quick actions, pull-to-refresh recipe feed
- **Keyboard shortcuts on web**: Quick recipe creation (Cmd+N), global search (Cmd+K), instant tag filtering
- **Smart defaults with easy overrides**: Menu generator pre-fills sensible options but allows full customization in one tap
- **Real-time feedback**: Live search results as you type, instant tag filters, immediate portion recalculation
- **Contextual intelligence**: When viewing a recipe, surface related actions (add to menu, generate shopping list, find similar)
- **Forgiving UX**: Undo/redo for major actions, auto-save drafts, graceful offline degradation with clear sync status

## Core Screens and Views

From a product perspective, these are the critical screens necessary to deliver the PRD's value:

- **Onboarding Flow** (3 screens max: Welcome → Auth → Quick Setup)
- **Recipe Library** (Grid/list view with filtering, sorting, search)
- **Recipe Detail View** (Full recipe display with photo, ingredients, steps, tags)
- **Recipe Create/Edit** (Structured form or OCR scan flow)
- **Tag Management** (Browse/filter by tag categories)
- **Shopping List Generator** (Recipe selection → portion adjustment → list output)
- **Shopping List View** (Organized list with check-off capability and share options)
- **Available Ingredients Input** (Checklist or search-based ingredient selector)
- **Recipe Suggestions by Ingredients** (Match results with percentage, missing items)
- **Menu Generator** (Configuration screen → generated menu display → edit/regenerate)
- **Saved Menus** (Library of favorite menus for reuse)
- **Settings/Profile** (Account management, preferences, data export/import)

## Accessibility: WCAG AA

The application will target **WCAG 2.1 Level AA compliance** to ensure usability for users with disabilities. This includes:

- Proper color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Keyboard navigation for all interactive elements
- Screen reader compatibility with semantic HTML and ARIA labels
- Focus indicators for keyboard users
- Resizable text up to 200% without loss of functionality
- Alternative text for all images (recipe photos)

**Rationale**: AA is the standard for most commercial applications and legally required in many jurisdictions. AAA would be excessive for MVP given resource constraints, but AA demonstrates commitment to inclusivity without over-engineering.

## Branding

**Visual Style**: Modern, clean, and appetizing. The design should feel professional yet warm—inspiring confidence in organization while maintaining the joy of cooking.

**Color Palette**:
- Primary: Warm, inviting tones that evoke food (terracotta, warm greens, natural browns)
- Accent: Fresh, energetic colors for CTAs (vibrant orange or green for "Generate Menu," "Create Recipe")
- Neutral: Clean whites and light grays for backgrounds, ensuring recipe photos pop

**Typography**: Sans-serif for clarity and modern feel. Readable at small sizes for ingredient lists, elegant at large sizes for recipe titles.

**Imagery**: High-quality food photography is central—users' uploaded photos should be showcased prominently. Empty states should use appetizing illustrations (not generic stock photos).

**Tone**: Friendly, encouraging, practical. Copy should be concise and action-oriented ("Let's cook!" not "Please proceed to recipe preparation").

**Assumption**: No existing brand guidelines provided, so I've proposed a warm, food-centric aesthetic that differentiates from clinical competitor apps (like meal-tracking apps) while maintaining professionalism.

## Target Device and Platforms: Web Responsive + All Mobile Platforms

- **Web**: Fully responsive design supporting desktop (1920px+), tablet (768px-1024px), and mobile web (320px-767px)
- **Mobile Native**: iOS app (iPhone and iPad) + Android app (phones and tablets)
- **Progressive Web App (PWA)**: Web version installable as PWA for offline capability and home screen access
- **Cross-platform parity**: Feature parity across all platforms—users should have identical capabilities whether on web or native mobile
- **Offline-first architecture**: All platforms must support offline viewing of saved recipes and sync when reconnected

**Design Implications**:
- Mobile-first design approach (design for smallest screen, scale up)
- Touch targets minimum 44x44px for mobile usability
- Simplified navigation for mobile (bottom tab bar), expanded for desktop (sidebar)
- Responsive layouts that reflow gracefully across breakpoints
