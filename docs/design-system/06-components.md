# Components

## Layers

1. **Primitives** (`shared/components/ui`) — shadcn/Radix-based, themed  
2. **AJX products** (`shared/components/ajx`) — domain-agnostic product UI  
3. **Feature components** — live under features; not part of the core DS

Every interactive primitive meets **44px** min height on touch (`h-11` / `size-11` where icon-only).

---

## Primitives

| Component | Notes |
|-----------|--------|
| `Button` | `default` `secondary` `ghost` `outline` `destructive` `soft`; sizes `sm` `md` `lg` `icon` |
| `IconButton` | Square touch target; requires `aria-label` |
| `Input` | Soft fill; height 44px; focus ring |
| `Textarea` | Min ~3 rows; spacious |
| `Label` | Body-sm medium |
| `Checkbox` | Radix; 20px control inside 44px hit area via padding on label row |
| `Select` | Radix select, calm menu |
| `Badge` | Soft status fills |
| `Card` | radius-lg + shadow-sm + border |
| `Separator` | Line soft |
| `Skeleton` | Mist pulse; layout-matched variants required per screen |
| `Progress` | Thin, cerulean; use for uploads and long jobs |
| `Tabs` | Underline or soft pill (segmented) |
| `Dialog` | Desktop / general modal |
| `Sheet` | Phone bottom sheet / tablet side drawer |
| `Table` | Calm financial table (prefer cards on phone) |
| `ConfirmDialog` | Destructive confirm; optional typing gate |
| `JobProgress` | Phased / determinate long-running task UI |
| `UploadStatus` | Upload + processing states with Retry |
| `ErrorBanner` | Inline non-technical error + action |
| `DraftStatus` | Saving… / Saved affordance |
| `UndoToast` | Reversible action toast |

---

## AJX product components

| Component | Responsibility |
|-----------|----------------|
| `NavItem` / `SideNav` / `BottomNav` | Responsive navigation system (phone bottom, md+ side) |
| `AppCard` | Standard content card with optional header/action |
| `DashboardCard` | Premium metric card — optional chart, hero emphasis |
| `StatCard` | Compact single metric |
| `Sparkline` / `BarChart` / `DonutChart` | Calm SVG charts (no chart-library chrome) |
| `EvidenceStatusPill` | Status + soft colour |
| `EvidenceListItem` | Leading preview, title, meta, status |
| `ReadinessRing` | Circular calm score |
| `SectionHeader` | Title + optional action |
| `EmptyState` | Illustration slot + title + body + CTA |
| `ErrorState` | Full-region error surface |
| `CardSkeleton` / `PageSkeleton` / `ListSkeleton` / `TableSkeleton` | Layout-matched loading |
| `QuickActionBar` | Horizontal quick actions |
| `FloatingActionButton` | Phone capture FAB |
| `FyChip` | Financial year pill |
| `SearchField` | Large touch search |
| `FilterChip` | Toggleable filter |
| `TimelineRail` | Vertical timeline spine |
| `TimelineEvent` | Node on rail |
| `PageHeader` | Title (Sora) + subtitle + actions |
| `SoftBanner` | Quiet info/warning strip |
| `IllustrationFrame` | Consistent empty/hero illustration crop |
| `AiSuggestionMeta` | Confidence + why rationale (when AI ships) |
| `FigureSourceLink` | Drill-in to calculation provenance |
| `AuditTrailPanel` | Financial figure trail (source, FX, actor, time) |

---

## Button hierarchy

1. **One** `default` (primary) per view  
2. Secondary actions: `secondary` or `outline`  
3. Tertiary: `ghost`  
4. Destructive: isolated, never adjacent-primary without confirm  

## Form density

- One concern per sheet/step  
- Prefer progressive disclosure over long scrolls of fields  
- Group related fields in a **card**, not a spreadsheet grid  
