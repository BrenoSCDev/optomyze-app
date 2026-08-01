# Optomyze CRM — Interaction Design System

Single source of truth for buttons and interactive components. The tokens live
in `src/index.css` (`:root` / `.dark`) and are exposed through
`tailwind.config.ts`; the button contract lives in `components/ui/button.tsx`.

Benchmark: Respond.io / Linear / Stripe Dashboard. Subtle, predictable,
anchored. Nothing bounces, floats, or grows.

---

## 1. Buttons

Always use `<Button>`. Never hand-roll a `<button className="h-8 px-3 …">`, and
never override `h-*` / `px-*` / `text-*` at the call site — pick a size.

### Sizes

| size      | height | padding | text | glyph  | use for                                    |
|-----------|--------|---------|------|--------|--------------------------------------------|
| `sm`      | 32px   | px-3    | 12px | 14px   | dense toolbars, table rows, card actions    |
| `default` | 36px   | px-4    | 14px | 16px   | the everyday button                         |
| `lg`      | 40px   | px-6    | 14px | 16px   | page-level primary actions, empty states    |
| `icon-sm` | 32×32  | —       | —    | 14px   | icon-only in dense rows                     |
| `icon`    | 36×36  | —       | —    | 16px   | icon-only, default                          |
| `icon-lg` | 40×40  | —       | —    | 16px   | icon-only beside an `lg` button             |

### Variants

| variant             | use for                                                |
|---------------------|--------------------------------------------------------|
| `default`           | the one primary action per view                        |
| `secondary`         | a second action of comparable weight                   |
| `outline`           | neutral actions — the workhorse                        |
| `ghost`             | low-emphasis / icon-only / toolbar actions             |
| `destructive`       | confirming a destructive action (modal footers)        |
| `ghost-destructive` | quiet destructive in a row of icons (delete on a card) |
| `link`              | inline navigation inside prose                         |
| `black`             | the always-dark auth screens only                      |

**One `default` per view.** If two buttons compete, the weaker one is `outline`.

### Icon-only buttons

Icon-only means no visible label, so it **must** carry both an `aria-label` and
a `<Tooltip>`. See `WidgetsHub` card actions or the `ChatList` header for the
reference pattern.

---

## 2. Hover, active, focus, disabled

The rule: **colour and elevation only. Nothing moves.**

No `hover:scale-*`, no `hover:-translate-y-*`, no shadow "lift" that implies
motion. A dense CRM with cards that jump on hover feels unstable, and it reads
as a landing-page effect.

| state    | behaviour                                                            |
|----------|----------------------------------------------------------------------|
| hover    | solid variants → `--*-hover`; quiet variants → surface tint          |
| active   | solid variants → `--*-active`; quiet variants → one surface step up  |
| focus    | `focus-visible:ring-2 ring-ring ring-offset-2` — identical everywhere |
| disabled | `opacity-50` + `pointer-events-none`                                 |
| loading  | `<Button loading>` — spinner + auto-disable                          |

Solid hover uses a **solid** colour token, never an alpha of the base. An alpha
lets the page bleed through; because the dark-theme primary is near-white, an
alpha made it go *darker* on hover and read as disabled.

### Cards

```
resting  bg-card      border-border         shadow-elevation-sm
hover    bg-surface-2 border-border-strong  shadow-elevation-md   ← same position
```

`.glass-card`, `.kpi-card` and `.deal-glass-card` already implement this.

---

## 3. Radius

Driven by `--radius` (8px). Nothing may introduce a value outside this scale.

| token          | value | use for                        |
|----------------|-------|---------------------------------|
| `rounded-sm`   | 4px   | chips, checkboxes, menu items   |
| `rounded-md`   | 6px   | **buttons, inputs, selects**    |
| `rounded-lg`   | 8px   | cards, panels, list rows        |
| `rounded-xl`   | 12px  | modals, sheets, large surfaces  |
| `rounded-full` | —     | avatars, pills, status dots     |

Known exception: `ChatWidgetPreview` / `FormWidgetPreview` use arbitrary values
because they must mirror the shipped embed CSS in `crm-api/public/widgets/`.

---

## 4. Motion

Three durations, one easing (`--ease-standard`). Use the Tailwind aliases
`duration-fast|base|slow` and `ease-standard` — never a raw `duration-300`.

| token           | value | use for                                       |
|-----------------|-------|-----------------------------------------------|
| `duration-fast` | 120ms | hover, active, focus — must feel instant      |
| `duration-base` | 160ms | surface/elevation changes, expand/collapse    |
| `duration-slow` | 200ms | things that travel: dropdowns, modals, drawers|

Prefer `transition-colors` over `transition-all` — `all` animates layout
properties too, which is what made panels feel loose.

There is no spring/overshoot easing. It reads as playful; this is a work tool.

---

## 5. Icons

- Size is owned by the **button**, via `[&_svg]:size-*`. Do not put `h-4 w-4`
  on an icon inside a `Button`, `DropdownMenuItem` or `SelectItem`.
- Spacing is owned by the container's `gap-2`. **Never** add `mr-2` to an icon
  in those components — it double-spaces to 16px.
- Leading icon on a primary action when it aids recognition (Save, Add, Send).
- Secondary/outline actions are text-only unless the icon adds real meaning.
- No decorative icons.
