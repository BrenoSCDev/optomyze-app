

## Make Funnel Page Toolbar Responsive

On mobile screens, the action buttons in the top-right area of the Kanban board currently show both icons and text labels, which takes up too much horizontal space. This plan will make them icon-only on small screens.

### What will change

The toolbar buttons (Settings, Export, Create Tag, Filters, Create Lead, and Refresh if present) will show **only icons** on mobile (below 768px) and **icons + text labels** on larger screens.

### Technical Details

**File: `src/components/leads/KanbanBoard.tsx`** (lines 586-652)

- Wrap each button's text label in a `<span className="hidden sm:inline">` so labels are hidden on mobile
- Remove `mr-1` from icons and use `sm:mr-1` instead so icon spacing is only applied when text is visible
- Add `gap-1` to the button container for tighter spacing on mobile
- The "Create Lead" gradient button will also become icon-only on mobile
- The filter count badge will remain visible on all sizes

**File: `src/components/leads/FunnelSettingsDropdown.tsx`**

- Same treatment for the Settings button: hide text on mobile, show only the gear icon

**File: `src/components/leads/KanbanBoard.tsx`** (header section, line 543-572)

- Make the funnel title (`text-3xl`) responsive: `text-xl sm:text-3xl`
- Stack the title/badge vertically on very small screens if needed

