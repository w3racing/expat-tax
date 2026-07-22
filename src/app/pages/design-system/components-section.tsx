import { Camera, FileStack, HardDrive, Home, Image, Plane, Wallet } from 'lucide-react'
import { useState } from 'react'
import { StyleguideSection } from '@/app/pages/design-system/styleguide-section'
import {
  AppCard,
  Badge,
  BarChart,
  Button,
  CardSkeleton,
  Checkbox,
  DashboardCard,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DonutChart,
  EmptyState,
  ErrorBanner,
  ErrorState,
  EvidenceListItem,
  EvidenceStatusPill,
  FilterChip,
  FyChip,
  Input,
  Label,
  ListSkeleton,
  NavItem,
  Progress,
  QuickActionBar,
  ReadinessRing,
  SearchField,
  SectionHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SoftBanner,
  Sparkline,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TimelineEvent,
  TimelineRail,
  CaptureEmptyIllustration,
  EvidenceEmptyIllustration,
  PlanePathIllustration,
} from '@/shared/components'
import type { EvidenceStatus, NavItemConfig } from '@/shared/components'

const statuses: EvidenceStatus[] = [
  'uploaded',
  'processing',
  'ready',
  'needs_review',
  'failed',
]

const demoNav: NavItemConfig[] = [
  { to: '/design-system', label: 'Home', icon: Home, end: true },
  { to: '/design-system#components', label: 'Position', icon: Wallet },
  { to: '/design-system#colour', label: 'Evidence', icon: FileStack },
]

export function ComponentsSection() {
  const [filter, setFilter] = useState('receipts')
  const [statusIndex, setStatusIndex] = useState(2)

  return (
    <StyleguideSection
      description="Reusable primitives and AJX product components. Phone · iPad · Mac. Touch ≥ 44px. Keyboard focus visible."
      id="components"
      title="Components"
    >
      <div className="space-y-6">
        <AppCard header={<SectionHeader description="Side + bottom patterns" title="Navigation" />}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="w-full max-w-[14rem] rounded-xl border border-border bg-card/60 p-3">
              <nav aria-label="Demo side navigation" className="flex flex-col gap-1">
                {demoNav.map((item) => (
                  <NavItem key={item.label} item={item} variant="side" />
                ))}
              </nav>
            </div>
            <div className="flex w-full max-w-sm overflow-hidden rounded-xl border border-border">
              {demoNav.map((item) => (
                <NavItem key={item.label} className="py-3" item={item} variant="bottom" />
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Compose with <code className="font-mono text-[0.7rem]">SideNav</code> (md+) and{' '}
            <code className="font-mono text-[0.7rem]">BottomNav</code> (phone).
          </p>
        </AppCard>

        <AppCard header={<SectionHeader description="Primary hierarchy" title="Buttons" />}>
          <div className="flex flex-wrap gap-2">
            <Button>Capture</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="soft">Soft</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Delete</Button>
          </div>
        </AppCard>

        <AppCard header={<SectionHeader title="Inputs" />}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant</Label>
              <Input id="merchant" placeholder="Qantas Club" />
            </div>
            <SearchField aria-label="Search evidence" placeholder="Search evidence" />
            <div className="space-y-2">
              <Label>Category</Label>
              <Select defaultValue="receipt">
                <SelectTrigger aria-label="Category">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receipt">Receipt</SelectItem>
                  <SelectItem value="payslip">Payslip</SelectItem>
                  <SelectItem value="flight">Flight</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-7">
              <Checkbox defaultChecked id="medicare" />
              <Label htmlFor="medicare">Include Medicare levy</Label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Optional context for your accountant" />
            </div>
          </div>
        </AppCard>

        <AppCard header={<SectionHeader title="Dashboard cards" />}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DashboardCard
              chart={<Sparkline label="Monthly estimate trend" values={[18, 22, 19, 24, 28, 26, 31]} />}
              emphasis="hero"
              hint="Indicative · not lodgement advice"
              label="Estimated tax payable"
              value="A$34,979"
            />
            <DashboardCard
              chart={
                <BarChart
                  data={[
                    { label: 'Jul', value: 12 },
                    { label: 'Aug', value: 18 },
                    { label: 'Sep', value: 9 },
                    { label: 'Oct', value: 22 },
                  ]}
                  label="Income by month"
                />
              }
              label="Income"
              value="A$153,846"
            />
            <DashboardCard
              chart={<DonutChart label="Evidence completeness" value={72} />}
              hint="Linked claims vs evidence"
              label="Evidence completeness"
              value="72%"
            />
            <StatCard hint="Awaiting a quick look" label="Needs review" value="3" />
            <StatCard hint="Captured this month" label="Evidence" value="128" />
          </div>
        </AppCard>

        <AppCard header={<SectionHeader title="Tables" />}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim</TableHead>
                <TableHead>FY</TableHead>
                <TableHead className="text-right">AUD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Uniform laundry</TableCell>
                <TableCell>2025–26</TableCell>
                <TableCell className="text-right text-amount">154.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Airport transport</TableCell>
                <TableCell>2025–26</TableCell>
                <TableCell className="text-right text-amount">51.28</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="mt-2 text-xs text-muted-foreground">
            Prefer card lists on phone; use tables from tablet up.
          </p>
        </AppCard>

        <AppCard header={<SectionHeader title="Dialogs & sheets" />}>
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm export</DialogTitle>
                  <DialogDescription>
                    Build an accountant package for FY 2025–26. Nothing is lodged with the ATO.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="soft">Continue</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open sheet</Button>
              </SheetTrigger>
              <SheetContent side="bottom">
                <SheetHeader>
                  <SheetTitle>Quick capture</SheetTitle>
                  <SheetDescription>Phone-first drawer for upload and review.</SheetDescription>
                </SheetHeader>
                <Button className="mt-2 w-full">Upload document</Button>
              </SheetContent>
            </Sheet>
          </div>
        </AppCard>

        <AppCard header={<SectionHeader title="Loading states" />}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <div className="sm:col-span-2 lg:col-span-1">
              <ListSkeleton rows={2} />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Upload progress</p>
            <Progress label="Upload progress" value={64} />
          </div>
        </AppCard>

        <AppCard header={<SectionHeader title="Error states" />}>
          <div className="space-y-4">
            <ErrorBanner code="NETWORK" />
            <ErrorState code="UPLOAD_FAILED" onAction={() => undefined} />
          </div>
        </AppCard>

        <AppCard header={<SectionHeader title="Badges & status" />}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <FyChip financialYear="2025-26" />
            {statuses.map((status) => (
              <EvidenceStatusPill key={status} status={status} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatusIndex((i) => (i + 1) % statuses.length)}
            >
              Cycle status animation
            </Button>
            <EvidenceStatusPill status={statuses[statusIndex]} />
          </div>
        </AppCard>

        <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
          <AppCard>
            <div className="flex flex-col items-center gap-3 py-2">
              <ReadinessRing score={72} />
              <p className="text-sm text-muted-foreground">Readiness ring</p>
            </div>
          </AppCard>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard hint="Awaiting a quick look" label="Needs review" value="3" />
            <StatCard hint="Captured this month" label="Evidence" value="128" />
          </div>
        </div>

        <AppCard header={<SectionHeader title="Evidence list" />}>
          <div className="space-y-2">
            <EvidenceListItem
              amount="A$42.50"
              leading={<Camera className="size-5" />}
              meta="12 Mar 2026 · Sydney"
              status="ready"
              title="Airport coffee"
            />
            <EvidenceListItem
              amount="A$1,240.00"
              leading={<Plane className="size-5" />}
              meta="Processing · Flight itinerary"
              status="processing"
              title="SYD → LAX"
            />
          </div>
        </AppCard>

        <AppCard header={<SectionHeader title="Filters & quick actions" />}>
          <div className="mb-4 flex flex-wrap gap-2">
            {['receipts', 'payslips', 'flights'].map((id) => (
              <FilterChip
                key={id}
                label={id[0]!.toUpperCase() + id.slice(1)}
                selected={filter === id}
                onToggle={() => setFilter(id)}
              />
            ))}
          </div>
          <QuickActionBar
            actions={[
              {
                id: 'camera',
                label: 'Camera',
                icon: <Camera className="size-4" />,
                onSelect: () => undefined,
              },
              {
                id: 'upload',
                label: 'Upload',
                icon: <Image className="size-4" />,
                onSelect: () => undefined,
              },
              {
                id: 'drive',
                label: 'Google Drive',
                icon: <HardDrive className="size-4" />,
                onSelect: () => undefined,
              },
            ]}
          />
        </AppCard>

        <AppCard header={<SectionHeader title="Timeline" />}>
          <TimelineRail>
            <TimelineEvent meta="14 Mar 2026 · Work" title="Melbourne layover">
              <SoftBanner>Two receipts linked · uniform laundry</SoftBanner>
            </TimelineEvent>
            <TimelineEvent meta="16 Mar 2026 · Work" title="SYD base return" />
          </TimelineRail>
        </AppCard>

        <Tabs defaultValue="empty">
          <TabsList>
            <TabsTrigger value="empty">Empty states</TabsTrigger>
            <TabsTrigger value="banner">Banners</TabsTrigger>
          </TabsList>
          <TabsContent value="empty">
            <div className="grid gap-4 lg:grid-cols-3">
              <EmptyState
                actionLabel="Capture first item"
                description="Snap a receipt or upload a PDF. We’ll keep it organised for the year."
                illustration={<CaptureEmptyIllustration />}
                title="Nothing captured yet"
                onAction={() => undefined}
              />
              <EmptyState
                description="When evidence lands, it will appear here — sorted for FY 2025-26."
                illustration={<EvidenceEmptyIllustration />}
                title="Your library is clear"
              />
              <EmptyState
                description="Trips and pairings will form a calm timeline as you capture flights."
                illustration={<PlanePathIllustration />}
                title="No trips yet"
              />
            </div>
          </TabsContent>
          <TabsContent value="banner">
            <div className="space-y-3">
              <SoftBanner tone="info">
                AJX Tax organises evidence and maintains an indicative tax position. It does not lodge
                or provide advice.
              </SoftBanner>
              <SoftBanner tone="warning">3 items need a quick look before EOFY.</SoftBanner>
              <SoftBanner tone="success">Payslip coverage looks complete for March.</SoftBanner>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </StyleguideSection>
  )
}
