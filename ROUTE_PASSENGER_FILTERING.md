# Route Passenger Filtering - Implementation Details

**Date**: 2025-10-25
**Status**: ✅ CORRECTLY IMPLEMENTED

---

## 🎯 Requirement

**Display only students who are assigned to that specific route** when viewing route details.

---

## ✅ Current Implementation

The system is **already correctly filtering** passengers by route. Here's how:

### 1. API Level Filtering (`/api/staff/assigned-routes/route.ts`)

**Step 1: Get Staff's Assigned Routes**
```typescript
// Line 23-54: Fetch only routes assigned to this staff member
const { data: assignments } = await supabase
  .from('staff_route_assignments')
  .select('...')
  .eq('staff_email', staffEmail.toLowerCase().trim())  // Filter by staff
  .eq('is_active', true);
```

**Step 2: Get Route IDs**
```typescript
// Line 74: Extract only the route IDs
const routeIds = assignments.map(a => a.route_id);
// Example: ['route-uuid-1', 'route-uuid-2', 'route-uuid-3']
```

**Step 3: Fetch Passengers ONLY for These Routes**
```typescript
// Line 77-117: Fetch students with route filter
const { data: routeAllocations } = await supabase
  .from('student_route_allocations')
  .select(`
    id,
    student_id,
    route_id,
    students (...),
    route_stops (...)
  `)
  .in('route_id', routeIds)        // ← FILTERS BY ROUTE IDs
  .eq('is_active', true)
  .order('route_id', { ascending: true });
```

**Step 4: Group Passengers by Route**
```typescript
// Line 164-178: Group passengers by their route_id
const passengersByRoute: Record<string, any[]> = {};

routeAllocations.forEach(allocation => {
  if (!passengersByRoute[allocation.route_id]) {
    passengersByRoute[allocation.route_id] = [];
  }
  passengersByRoute[allocation.route_id].push({
    allocationId: allocation.id,
    student: allocation.students,
    boardingStop: allocation.route_stops,
    allocatedAt: allocation.allocated_at
  });
});
```

**Step 5: Return Data Grouped by Route**
```typescript
// Line 181-192: Each route has ONLY its passengers
const routesWithPassengers = assignments.map(assignment => ({
  assignmentId: assignment.id,
  route: { ...assignment.routes },
  passengers: passengersByRoute[assignment.route_id] || [],  // ← Route-specific
  passengerCount: (passengersByRoute[assignment.route_id] || []).length
}));
```

---

### 2. Frontend Level Filtering (`/staff/routes/[id]/page.tsx`)

**Step 1: Fetch All Assigned Routes**
```typescript
// Line 114: Get all assigned routes with passengers
const response = await fetch(`/api/staff/assigned-routes?email=${user.email}`);
const data = await response.json();
```

**API Response Structure**:
```json
{
  "success": true,
  "routesWithPassengers": [
    {
      "route": { "id": "route-1", "route_name": "Route A" },
      "passengers": [ /* ONLY passengers for route-1 */ ]
    },
    {
      "route": { "id": "route-2", "route_name": "Route B" },
      "passengers": [ /* ONLY passengers for route-2 */ ]
    }
  ]
}
```

**Step 2: Filter to Get ONLY the Specific Route**
```typescript
// Line 118: Find the specific route by ID from URL params
const route = data.routesWithPassengers.find(
  (r: any) => r.route.id === params.id  // ← Matches URL route ID
);

if (route) {
  setRouteData(route);  // Contains ONLY passengers for this route
}
```

**Step 3: Display Route-Specific Passengers**
```typescript
// Line 136-149: Filter passengers (for stop/department, NOT route)
const getFilteredPassengers = () => {
  if (!routeData) return [];

  let filtered = routeData.passengers;  // Already route-specific!

  // These filters are for boarding stop and department within the route
  if (filterStop !== 'all') {
    filtered = filtered.filter(p => p.boardingStop?.stop_name === filterStop);
  }

  if (filterDepartment !== 'all') {
    filtered = filtered.filter(p => p.student.departments?.department_name === filterDepartment);
  }

  return filtered;
};
```

---

## 🔍 Verification Flow

### Example Scenario:

**Staff Member**: john@example.com
**Assigned Routes**: Route A (ID: route-a-123), Route B (ID: route-b-456)

**Route A has**:
- Student 1 (Roll: 101, Dept: CSE, Stop: Stop 1)
- Student 2 (Roll: 102, Dept: ECE, Stop: Stop 2)
- Student 3 (Roll: 103, Dept: CSE, Stop: Stop 1)

**Route B has**:
- Student 4 (Roll: 201, Dept: MECH, Stop: Stop 3)
- Student 5 (Roll: 202, Dept: CIVIL, Stop: Stop 4)

### When Viewing Route A Details (`/staff/routes/route-a-123`):

**1. API Call:**
```
GET /api/staff/assigned-routes?email=john@example.com
```

**2. API Returns:**
```json
{
  "routesWithPassengers": [
    {
      "route": { "id": "route-a-123", "route_name": "Route A" },
      "passengers": [
        { "student": { "roll_number": "101" } },
        { "student": { "roll_number": "102" } },
        { "student": { "roll_number": "103" } }
      ]
    },
    {
      "route": { "id": "route-b-456", "route_name": "Route B" },
      "passengers": [
        { "student": { "roll_number": "201" } },
        { "student": { "roll_number": "202" } }
      ]
    }
  ]
}
```

**3. Frontend Filters:**
```javascript
const route = data.routesWithPassengers.find(
  r => r.route.id === 'route-a-123'  // From URL
);

// route.passengers now contains ONLY:
// [Student 101, Student 102, Student 103]
// NOT Students 201, 202 from Route B
```

**4. Display Shows:**
- ✅ Student 1 (Roll: 101)
- ✅ Student 2 (Roll: 102)
- ✅ Student 3 (Roll: 103)
- ❌ Student 4 (Roll: 201) - NOT shown
- ❌ Student 5 (Roll: 202) - NOT shown

---

## 📊 Database Query Flow

```sql
-- Step 1: Get staff assignments
SELECT route_id
FROM staff_route_assignments
WHERE staff_email = 'john@example.com'
  AND is_active = true;

-- Result: ['route-a-123', 'route-b-456']

-- Step 2: Get passengers ONLY for these routes
SELECT *
FROM student_route_allocations
WHERE route_id IN ('route-a-123', 'route-b-456')  ← ROUTE FILTER
  AND is_active = true;

-- Result: Only students assigned to Route A or Route B
```

---

## 🎯 Filter Hierarchy

The filtering happens at **3 levels**:

### Level 1: Staff Assignment Filter (API)
```
All Routes → Staff's Assigned Routes
```
**Example**: 50 total routes → 5 assigned to this staff

### Level 2: Route-Specific Filter (API + Frontend)
```
Staff's Routes → Specific Route
```
**Example**: 5 staff routes → 1 specific route being viewed

### Level 3: User Filters (Frontend)
```
Route Passengers → Filtered by Stop/Department
```
**Example**: 30 passengers on route → 5 at specific stop

---

## ✅ Confirmation

**Question**: "Are we only fetching students who board on that specific route?"

**Answer**: **YES! Absolutely correct.**

### Evidence:

1. ✅ **API filters by route_id**: `.in('route_id', routeIds)` (Line 115)
2. ✅ **Passengers grouped by route**: Each route object has only its passengers (Line 164-178)
3. ✅ **Frontend filters by route ID**: `.find((r: any) => r.route.id === params.id)` (Line 118)
4. ✅ **No cross-contamination**: Route A passengers never show on Route B page

### What Gets Filtered OUT:

❌ Students not assigned to any route
❌ Students assigned to other routes (not staff's assigned routes)
❌ Students from different routes than the one being viewed
❌ Inactive student route allocations

### What Shows UP:

✅ Only students with active allocations
✅ Only for the specific route being viewed
✅ Only routes assigned to the logged-in staff member
✅ Complete student details with boarding stops

---

## 🧪 Testing Verification

### Test Case 1: Route A has 10 students, Route B has 15 students

**Expected Behavior**:
- View Route A: Shows exactly 10 students
- View Route B: Shows exactly 15 students
- No overlap between routes

### Test Case 2: Student moves from Route A to Route B

**Expected Behavior**:
- Old allocation marked as `is_active = false`
- New allocation created with `is_active = true`
- Student appears ONLY on Route B (not Route A)

### Test Case 3: Filter by boarding stop

**Expected Behavior**:
- Still only shows students from THAT route
- Further filters them by selected stop
- Doesn't accidentally show students from other routes at same stop

---

## 📝 Code Comments Added

To make this clearer in the code, here are the key filtering points:

**API (`/api/staff/assigned-routes/route.ts`)**:
```typescript
// Line 74: Extract route IDs - ONLY staff's assigned routes
const routeIds = assignments.map(a => a.route_id);

// Line 115: Fetch passengers - FILTERED by these route IDs only
.in('route_id', routeIds)  // ← Ensures route-specific passengers

// Line 190: Map passengers - Each route gets ONLY its passengers
passengers: passengersByRoute[assignment.route_id] || []
```

**Frontend (`/staff/routes/[id]/page.tsx`)**:
```typescript
// Line 118: Find specific route - Filters to ONE route by ID
const route = data.routesWithPassengers.find(
  (r: any) => r.route.id === params.id
);

// Line 139: Passenger list - Already filtered to this route
let filtered = routeData.passengers;  // Contains ONLY this route's passengers
```

---

## 🎉 Summary

**Current Implementation**: ✅ **CORRECT**

The system **already correctly filters** passengers to show only those assigned to the specific route being viewed.

**Filtering Flow**:
1. Staff login → Get assigned routes
2. Route detail page → Get specific route
3. Display → Show only passengers for that route
4. User filters → Further filter by stop/department (optional)

**Result**: Each route detail page shows **ONLY** students who board on that specific route.

**No changes needed** - the implementation is working as required!
