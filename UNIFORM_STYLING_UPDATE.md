# Uniform Styling Update - In Progress

## 🎯 Goal
Apply consistent background and card styling across all dashboard pages in the TMS Passenger app.

## ✅ Completed

### 1. Created PageWrapper Component
**File**: `components/page-wrapper.tsx`

- Reusable component with decorative background elements
- 3 blur circles for depth (green, yellow, blue gradients)
- Responsive sizing for mobile/desktop
- Pointer-events-none for non-interactive decorations

### 2. Updated Card Component
**File**: `components/ui/card.tsx`

**Changes**:
- Card: `bg-white/80 backdrop-blur-sm` with rounded-xl
- Hover: green border + enhanced shadow
- CardTitle: Bold with gradient text (gray-800 to gray-600)
- CardDescription: Simple gray-600 text
- All transitions: 300ms smooth

### 3. Updated Pages with PageWrapper

#### ✅ Dashboard (main)
- File: `app/dashboard/page.tsx`
- Background removed (handled by layout)
- Spacing optimized

#### ✅ Routes
- File: `app/dashboard/routes/page.tsx`
- Wrapped with PageWrapper
- Consistent spacing

#### ✅ Payments
- File: `app/dashboard/payments/page.tsx`
- Wrapped with PageWrapper
- Header styled with modern gradient
- Tab navigation with backdrop blur

#### ✅ Schedules
- File: `app/dashboard/schedules/page.tsx`
- Wrapped with PageWrapper
- Large complex page - all returns wrapped

## 🔄 In Progress

### Remaining Pages to Update:
- [ ] Profile (`app/dashboard/profile/page.tsx`)
- [ ] Notifications (`app/dashboard/notifications/page.tsx`)
- [ ] Grievances (`app/dashboard/grievances/page.tsx`)
- [ ] Bug Reports (`app/dashboard/bug-reports/page.tsx`)
- [ ] Settings (`app/dashboard/settings/page.tsx`)
- [ ] Live Track (`app/dashboard/live-track/page.tsx`)
- [ ] Location (`app/dashboard/location/page.tsx`)

## 📊 Progress: 50%

**Completed**: 4/11 pages  
**Remaining**: 7 pages

---

## Design System

### Background Pattern
```tsx
<PageWrapper>
  {/* Decorative circles (non-interactive) */}
  - Top right: green/yellow gradient
  - Bottom left: blue/green gradient
  - Center: yellow/green accent
  
  {/* Content (relative z-10) */}
</PageWrapper>
```

### Card Styling
```tsx
<Card className="...">
  {/* Base styles */}
  - bg-white/80 backdrop-blur-sm
  - rounded-xl border-gray-200/50
  - hover:border-green-200/70
  - shadow-lg hover:shadow-xl
  
  <CardTitle>Gradient text</CardTitle>
  <CardDescription>Gray text</CardDescription>
</Card>
```

---

**Status**: In Progress  
**Next**: Update remaining 7 pages


