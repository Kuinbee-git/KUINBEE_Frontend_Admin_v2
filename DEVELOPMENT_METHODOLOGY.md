# Admin Frontend Development Methodology

> A comprehensive guide documenting the processes, patterns, and principles followed in building the Kuinbee Marketplace Admin Frontend from initial UI files to production-ready implementation.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Initial State & Analysis](#initial-state--analysis)
3. [Component Extraction Strategy](#component-extraction-strategy)
4. [Reusability Patterns](#reusability-patterns)
5. [Optimization Techniques](#optimization-techniques)
6. [API Integration Approach](#api-integration-approach)
7. [File Organization](#file-organization)
8. [Code Quality Standards](#code-quality-standards)
9. [Build & Verification Process](#build--verification-process)
10. [Lessons Learned](#lessons-learned)

---

## 1. Project Overview

### Starting Point
- **Initial State**: Large, monolithic UI component files provided by user
- **Technology Stack**: Next.js 16.1.1, TypeScript, React Query, Radix UI, Tailwind CSS
- **Goal**: Build a production-ready admin dashboard with proper component architecture

### Key Objectives
- ✅ Extract reusable components from monolithic files
- ✅ Implement proper separation of concerns
- ✅ Connect UI to real backend APIs
- ✅ Ensure type safety throughout
- ✅ Optimize for performance and maintainability
- ✅ Maintain consistent patterns across all features

---

## 2. Initial State & Analysis

### Phase 1: Understanding Existing Code

#### Step 1: File Inventory
```bash
# First action: List all existing files to understand structure
- Examined /src/app/dashboard/ structure
- Identified /src/components/ organization
- Reviewed existing services and hooks
```

#### Step 2: Code Audit
**Key Analysis Points:**
1. **Identify API Routes**: Read `api-routes.ts` to understand backend contract
2. **Check Existing Services**: Inventory what API integrations exist
3. **Review Type Definitions**: Understand data models in `/types`
4. **Analyze Existing Hooks**: See what React Query hooks are available
5. **Examine UI Components**: Identify component patterns and Radix UI usage

**Example: Initial Audit Findings**
```typescript
// Found: Large monolithic component
DatasetDetailReview.tsx (290 lines)
- Mixed concerns: UI, business logic, API calls
- Inline mock data
- No component extraction
- Tight coupling

// Identified: Available but unused APIs
- invites.service.ts existed but no UI
- roles.service.ts existed but no UI
- API routes defined but not connected
```

#### Step 3: Gap Analysis
**Process:**
```markdown
1. List all API routes from api-routes.ts
2. Check which have corresponding services
3. Verify which services have hooks
4. Identify which hooks have UI components
5. Document gaps: "Has API but no UI" vs "Has UI but mock data"
```

**Output Example:**
| Feature | API | Service | Hook | UI | Status |
|---------|-----|---------|------|----|----|
| Invites | ✅ | ✅ | ✅ | ❌ | Missing UI |
| Roles   | ✅ | ✅ | ✅ | ❌ | Missing UI |

---

## 3. Component Extraction Strategy

### Principle: Single Responsibility
**Rule**: Each component should do ONE thing well.

### Extraction Process

#### Step 1: Identify Component Boundaries
**Criteria for Extraction:**
1. **Visual Separation**: If it's visually a distinct section → Extract
2. **Reusability**: If it could be used elsewhere → Extract
3. **Complexity**: If it has 50+ lines → Consider extraction
4. **State Management**: If it manages its own state → Extract
5. **Business Logic**: If it contains complex logic → Extract

**Example: DatasetDetailReview.tsx**
```typescript
// BEFORE: Monolithic component (290 lines)
DatasetDetailReview.tsx
  - Header section
  - Metadata section
  - Files & Schema section
  - Supplier context
  - Review actions
  - Conversation timeline
  - Audit log

// AFTER: Extracted components
DatasetDetailReview.tsx (main orchestrator)
  ├── DatasetHeader.tsx
  ├── DatasetMetadata.tsx
  ├── DatasetFilesSchema.tsx
  ├── SupplierContext.tsx
  ├── ReviewActions.tsx
  ├── ConversationTimeline.tsx
  └── DatasetAuditLog.tsx
```

#### Step 2: Extract from Top to Bottom
**Process Order:**
1. **Start with largest sections** (Header, Footer)
2. **Move to mid-level sections** (Cards, Panels)
3. **Extract smallest units last** (Buttons, Badges)
4. **Create barrel exports** (index.ts files)

**Example: Invites Feature Extraction**
```typescript
// Phase 1: Main container
InvitesView.tsx (orchestrator)
  ├── State management
  ├── API calls via hooks
  └── Layout structure

// Phase 2: Major sections
InviteFilters.tsx (filter controls)
InviteTable.tsx (data display)

// Phase 3: Dialogs (could be reused)
InviteDialogs.tsx
  ├── CreateInviteDialog
  ├── ResendInviteDialog
  └── CancelInviteDialog

// Phase 4: Barrel export
index.ts (clean imports)
```

#### Step 3: Define Component Interfaces
**Rule**: Props should be explicit, typed, and minimal.

```typescript
// ✅ GOOD: Clear, typed, focused
interface InviteTableProps {
  invites: InviteListItem[];
  onResend: (inviteId: string) => void;
  onCancel: (inviteId: string) => void;
}

// ❌ BAD: Vague, untyped, kitchen sink
interface InviteTableProps {
  data: any;
  actions: any;
  config?: Record<string, unknown>;
}
```

---

## 4. Reusability Patterns

### Pattern 1: Shared UI Components

#### Identifying Shared Components
**Process:**
1. Notice repeated patterns across features
2. Extract common elements to `/components/shared/`
3. Make them generic and configurable

**Example: StatusBadge**
```typescript
// Used across: Invites, Roles, Datasets, Proposals, Users
// Pattern: Different statuses, same visual treatment

// Before: Inline in each component
<Badge variant={invite.status === 'ACTIVE' ? 'default' : 'secondary'}>
  {invite.status}
</Badge>

// After: Shared component
<StatusBadge 
  status={invite.status} 
  variant={getStatusVariant(invite.status)} 
/>
```

**Shared Components Created:**
- `StatusBadge.tsx` - Consistent status display
- `TableSkeleton.tsx` - Loading states
- `DetailSkeleton.tsx` - Detail page loading
- `ErrorBoundary.tsx` - Error handling

### Pattern 2: Layout Components

**Principle**: Consistent layouts reduce cognitive load.

```typescript
// Standard List View Pattern
export function EntityListView() {
  return (
    <div className="p-8 space-y-6">
      {/* Header - always at top */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Title</h1>
          <p>Description</p>
        </div>
        <Button>Primary Action</Button>
      </div>

      {/* Filters - consistent position */}
      <EntityFilters {...filterProps} />

      {/* Loading/Error/Empty/Data states */}
      {isLoading ? <Skeleton /> : <EntityTable />}

      {/* Pagination - consistent bottom */}
      <Pagination {...paginationProps} />
    </div>
  );
}
```

**Applied to:**
- InvitesView
- RolesView
- UsersView
- SuppliersView (with mock data)
- All list views follow this pattern

### Pattern 3: Dialog/Modal Components

**Principle**: Dialogs should be self-contained with clear contracts.

```typescript
// Standard Dialog Pattern
interface EntityDialogProps {
  open: boolean;                    // Controlled state
  onOpenChange: (open: boolean) => void;  // State control
  onSave: (data: T) => Promise<void>;     // Async action
  initialData?: T;                  // Optional for edit
}

export function EntityDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
}: EntityDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onOpenChange(false);  // Close on success
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          {/* Form fields */}
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Applied to:**
- CreateInviteDialog
- CreateRoleDialog / EditRoleDialog
- ManagePermissionsDialog
- EditMetadataDialog

### Pattern 4: Filter Components

**Standard Filter Component Structure:**
```typescript
interface EntityFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  activeFilters: Array<{ key: string; label: string; onRemove: () => void }>;
  onClearAll: () => void;
}

export function EntityFilters({ ... }: EntityFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-4">
        <Input 
          placeholder="Search..." 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={onStatusChange}>
          {/* Status options */}
        </Select>
      </div>

      {/* Active filters chips */}
      {activeFilters.length > 0 && (
        <div className="flex gap-2">
          {activeFilters.map((filter) => (
            <Badge key={filter.key} onClick={filter.onRemove}>
              {filter.label} ✕
            </Badge>
          ))}
          <Button variant="ghost" onClick={onClearAll}>
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

## 5. Optimization Techniques

### Technique 1: Debounced Search

**Problem**: Search queries firing on every keystroke → excessive API calls

**Solution**: Debounce search input
```typescript
// Custom hook implementation
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage in list views
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearchQuery = useDebounce(searchQuery, 500);

// Only refetch when debounced value changes
const { data } = useEntities({ search: debouncedSearchQuery });
```

### Technique 2: React Query Optimizations

**Pattern**: Proper cache management and optimistic updates

```typescript
// Query key factory pattern
export const entityKeys = {
  all: ['entities'] as const,
  lists: () => [...entityKeys.all, 'list'] as const,
  list: (params: ListParams) => [...entityKeys.lists(), params] as const,
  details: () => [...entityKeys.all, 'detail'] as const,
  detail: (id: string) => [...entityKeys.details(), id] as const,
};

// Usage ensures proper invalidation
export function useUpdateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateEntity(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate list (to refresh count, etc.)
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
      // Invalidate specific detail (to show updated data)
      queryClient.invalidateQueries({ queryKey: entityKeys.detail(id) });
    },
  });
}
```

**Key Optimizations:**
1. **Placeholder Data**: Keep previous data while fetching new
   ```typescript
   useQuery({
     queryKey: entityKeys.list(params),
     queryFn: () => getEntities(params),
     placeholderData: (previousData) => previousData,
   });
   ```

2. **Selective Invalidation**: Only invalidate what changed
3. **Automatic Refetch**: On window focus for lists
4. **Error Retry**: Built-in retry logic with backoff

### Technique 3: Controlled Filter State

**Pattern**: Reset page when filters change
```typescript
const [page, setPage] = useState(1);
const [filters, setFilters] = useState({...});

// Reset to page 1 when any filter changes
useEffect(() => {
  setPage(1);
}, [filters.search, filters.status, filters.category]);
```

### Technique 4: Lazy Loading & Code Splitting

**Pattern**: Lazy load heavy components
```typescript
// Page level
const EntityDetailView = lazy(() => 
  import('@/components/entity/EntityDetail')
    .then(mod => ({ default: mod.EntityDetailView }))
);

export default function EntityDetailPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <EntityDetailView />
    </Suspense>
  );
}
```

### Technique 5: Memoization for Expensive Operations

```typescript
// Memoize filter computation
const filteredItems = useMemo(() => {
  return items.filter(item => {
    // Complex filtering logic
  });
}, [items, filters]);

// Memoize event handlers to prevent re-renders
const handleRowClick = useCallback((id: string) => {
  router.push(`/dashboard/entity/${id}`);
}, [router]);
```

---

## 6. API Integration Approach

### Layer Architecture

```
┌─────────────────────────────────────┐
│         UI Components               │ ← React components
├─────────────────────────────────────┤
│         React Query Hooks           │ ← useEntity, useUpdateEntity
├─────────────────────────────────────┤
│         Service Layer               │ ← entity.service.ts
├─────────────────────────────────────┤
│         HTTP Client (axios)         │ ← Configured with baseURL, auth
├─────────────────────────────────────┤
│         Backend API                 │ ← /api/v1/admin/entities
└─────────────────────────────────────┘
```

### Step-by-Step Integration Process

#### Step 1: Define Types
```typescript
// types/entity.types.ts
export interface Entity {
  id: string;
  name: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EntityListItem {
  id: string;
  name: string;
  status: EntityStatus;
}

export interface CreateEntityRequest {
  name: string;
  // ... required fields
}

export interface UpdateEntityRequest {
  name?: string;
  // ... optional fields
}

export interface EntityListResponse {
  items: EntityListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

#### Step 2: Create Service Layer
```typescript
// services/entity.service.ts
import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants/api-routes';
import type { 
  EntityListResponse, 
  Entity, 
  CreateEntityRequest,
  UpdateEntityRequest 
} from '@/types';

export interface EntityListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export async function getEntities(
  params: EntityListParams = {}
): Promise<EntityListResponse> {
  const { data } = await apiClient.get(API_ROUTES.ADMIN.ENTITIES.LIST, {
    params,
  });
  return data;
}

export async function getEntityById(id: string): Promise<{ entity: Entity }> {
  const { data } = await apiClient.get(API_ROUTES.ADMIN.ENTITIES.DETAIL(id));
  return data;
}

export async function createEntity(
  request: CreateEntityRequest
): Promise<{ entity: Entity }> {
  const { data } = await apiClient.post(
    API_ROUTES.ADMIN.ENTITIES.CREATE,
    request
  );
  return data;
}

export async function updateEntity(
  id: string,
  request: UpdateEntityRequest
): Promise<{ entity: Entity }> {
  const { data } = await apiClient.put(
    API_ROUTES.ADMIN.ENTITIES.UPDATE(id),
    request
  );
  return data;
}

export async function deleteEntity(id: string): Promise<void> {
  await apiClient.delete(API_ROUTES.ADMIN.ENTITIES.DELETE(id));
}
```

#### Step 3: Create React Query Hooks
```typescript
// hooks/api/useEntities.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as entityService from '@/services/entity.service';
import type { EntityListParams } from '@/services/entity.service';
import type { CreateEntityRequest, UpdateEntityRequest } from '@/types';

// Query Keys
export const entityKeys = {
  all: ['entities'] as const,
  lists: () => [...entityKeys.all, 'list'] as const,
  list: (params: EntityListParams) => [...entityKeys.lists(), params] as const,
  details: () => [...entityKeys.all, 'detail'] as const,
  detail: (id: string) => [...entityKeys.details(), id] as const,
};

// Queries
export function useEntities(params: EntityListParams = {}) {
  return useQuery({
    queryKey: entityKeys.list(params),
    queryFn: () => entityService.getEntities(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useEntity(entityId: string) {
  return useQuery({
    queryKey: entityKeys.detail(entityId),
    queryFn: () => entityService.getEntityById(entityId),
    enabled: !!entityId,
  });
}

// Mutations
export function useCreateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEntityRequest) => 
      entityService.createEntity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
      toast.success('Entity created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create entity');
    },
  });
}

export function useUpdateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEntityRequest }) =>
      entityService.updateEntity(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: entityKeys.detail(id) });
      toast.success('Entity updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update entity');
    },
  });
}

export function useDeleteEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => entityService.deleteEntity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
      toast.success('Entity deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete entity');
    },
  });
}
```

#### Step 4: Create UI Components
```typescript
// components/entities/EntitiesView.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEntities } from '@/hooks/api/useEntities';
import { EntityFilters } from './EntityFilters';
import { EntityTable } from './EntityTable';
import { Button } from '@/components/ui/button';

export function EntitiesView() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  // Fetch data with React Query
  const { data, isLoading, isError } = useEntities({
    page,
    pageSize: 10,
    search: searchQuery,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const handleRowClick = (id: string) => {
    router.push(`/dashboard/entities/${id}`);
  };

  if (isError) {
    return <div>Error loading entities</div>;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1>Entities</h1>
        <Button onClick={() => router.push('/dashboard/entities/new')}>
          Create Entity
        </Button>
      </div>

      {/* Filters */}
      <EntityFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <EntityTable 
          entities={data?.items || []} 
          onRowClick={handleRowClick} 
        />
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
```

### Error Handling Strategy

```typescript
// Service layer - Let errors bubble up
export async function getEntity(id: string) {
  try {
    const { data } = await apiClient.get(`/entities/${id}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to fetch entity');
    }
    throw error;
  }
}

// Hook layer - Handle with toast notifications
export function useEntity(id: string) {
  return useQuery({
    queryKey: ['entity', id],
    queryFn: () => getEntity(id),
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Component layer - Handle loading/error states
export function EntityDetail({ id }: Props) {
  const { data, isLoading, isError } = useEntity(id);

  if (isLoading) return <Skeleton />;
  if (isError) return <ErrorState />;
  if (!data) return <NotFound />;

  return <div>{/* Render entity */}</div>;
}
```

---

## 7. File Organization

### Directory Structure

```
frontend/admin/src/
├── app/
│   ├── dashboard/
│   │   ├── entities/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Dynamic route
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Create page
│   │   │   └── page.tsx              # List page
│   │   ├── layout.tsx                # Dashboard layout with sidebar
│   │   └── page.tsx                  # Dashboard home
│   └── login/
│       └── page.tsx
│
├── components/
│   ├── entities/                     # Feature-specific components
│   │   ├── EntitiesView.tsx          # Main container
│   │   ├── EntityFilters.tsx         # Filter controls
│   │   ├── EntityTable.tsx           # Data table
│   │   ├── EntityDetail.tsx          # Detail view
│   │   ├── EntityDialogs.tsx         # Create/Edit dialogs
│   │   └── index.ts                  # Barrel export
│   │
│   ├── shared/                       # Shared across features
│   │   ├── StatusBadge.tsx
│   │   ├── TableSkeleton.tsx
│   │   ├── Pagination.tsx
│   │   └── index.ts
│   │
│   └── ui/                           # Base UI primitives (Radix)
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── ...
│
├── hooks/
│   ├── api/
│   │   ├── useEntities.ts            # Entity-specific hooks
│   │   ├── useAuth.ts
│   │   └── index.ts
│   └── useDebounce.ts                # Utility hooks
│
├── services/
│   ├── entity.service.ts             # API calls
│   ├── auth.service.ts
│   └── index.ts
│
├── types/
│   ├── entity.types.ts               # Entity types
│   ├── api.types.ts                  # Common API types
│   └── index.ts
│
├── lib/
│   ├── api-client.ts                 # Axios instance
│   ├── constants/
│   │   └── api-routes.ts             # API route constants
│   └── utils/
│       └── formatters.ts
│
└── styles/
    └── globals.css
```

### Naming Conventions

#### Files
- **Components**: PascalCase - `EntityTable.tsx`
- **Hooks**: camelCase with 'use' prefix - `useEntities.ts`
- **Services**: camelCase with '.service' suffix - `entity.service.ts`
- **Types**: camelCase with '.types' suffix - `entity.types.ts`
- **Utils**: camelCase - `formatters.ts`

#### Variables/Functions
```typescript
// Components: PascalCase
export function EntityTable() {}

// Hooks: camelCase starting with 'use'
export function useEntities() {}

// Regular functions: camelCase
export function formatDate() {}

// Constants: SCREAMING_SNAKE_CASE
export const API_BASE_URL = '...';

// Types/Interfaces: PascalCase
export interface Entity {}
export type EntityStatus = '...';
```

### Barrel Exports Pattern

**Purpose**: Clean imports, single source of truth

```typescript
// components/entities/index.ts
export { EntitiesView } from './EntitiesView';
export { EntityFilters } from './EntityFilters';
export { EntityTable } from './EntityTable';
export { EntityDetail } from './EntityDetail';
export * from './EntityDialogs';

// Usage in other files
import { EntitiesView, EntityFilters } from '@/components/entities';
// Instead of:
// import { EntitiesView } from '@/components/entities/EntitiesView';
// import { EntityFilters } from '@/components/entities/EntityFilters';
```

---

## 8. Code Quality Standards

### TypeScript Strictness

**Rule**: No `any` types, full type safety

```typescript
// ❌ BAD
function processData(data: any) {
  return data.items.map((item: any) => item.name);
}

// ✅ GOOD
function processData(data: EntityListResponse) {
  return data.items.map((item) => item.name);
}
```

### Props Validation

**Rule**: Always define explicit prop interfaces

```typescript
// ✅ GOOD
interface EntityTableProps {
  entities: EntityListItem[];
  onRowClick: (id: string) => void;
  isLoading?: boolean;
}

export function EntityTable({ 
  entities, 
  onRowClick, 
  isLoading = false 
}: EntityTableProps) {
  // ...
}
```

### Component Structure

**Standard Order:**
```typescript
'use client'; // If client component

// 1. Imports
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEntities } from '@/hooks';
import type { Entity } from '@/types';

// 2. Types/Interfaces
interface ComponentProps {
  // ...
}

// 3. Component
export function Component({ ...props }: ComponentProps) {
  // 3a. Hooks (in order: router, state, queries, mutations)
  const router = useRouter();
  const [state, setState] = useState();
  const { data } = useEntities();
  const updateMutation = useUpdateEntity();

  // 3b. Derived state/memoization
  const filteredData = useMemo(() => ..., [data]);

  // 3c. Event handlers
  const handleClick = useCallback(() => {
    // ...
  }, [dependencies]);

  // 3d. Effects
  useEffect(() => {
    // ...
  }, [dependencies]);

  // 3e. Early returns (loading, error states)
  if (isLoading) return <Skeleton />;
  if (isError) return <Error />;

  // 3f. Main render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Error Handling

**Pattern**: Consistent error messages and user feedback

```typescript
// In mutations
export function useUpdateEntity() {
  return useMutation({
    mutationFn: updateEntity,
    onSuccess: () => {
      toast.success('Entity updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update entity');
    },
  });
}

// In components
try {
  await mutation.mutateAsync(data);
  // Success handled by mutation
} catch (error) {
  // Error already toasted by mutation, just handle UI state
  setIsSubmitting(false);
}
```

### Comments

**Rule**: Comments explain WHY, not WHAT

```typescript
// ❌ BAD: Comment explains what code does
// Set page to 1
setPage(1);

// ✅ GOOD: Comment explains why
// Reset to first page when filters change to avoid empty results
useEffect(() => {
  setPage(1);
}, [filters]);
```

---

## 9. Build & Verification Process

### Pre-Implementation Checklist

Before writing any code:
- [ ] Read API routes documentation
- [ ] Check if service layer exists
- [ ] Verify types are defined
- [ ] Look for existing similar components
- [ ] Identify reusable patterns

### Implementation Workflow

**Step-by-Step Process:**

```bash
# 1. Create service (if needed)
touch src/services/entity.service.ts
# - Define API functions
# - Add proper types
# - Handle errors

# 2. Create hooks (if needed)
touch src/hooks/api/useEntities.ts
# - Define query keys
# - Create queries and mutations
# - Add cache invalidation

# 3. Create components
touch src/components/entities/EntitiesView.tsx
touch src/components/entities/EntityFilters.tsx
touch src/components/entities/EntityTable.tsx
# - Follow component structure standard
# - Extract reusable pieces
# - Add proper types

# 4. Create barrel export
touch src/components/entities/index.ts

# 5. Create page route
touch src/app/dashboard/entities/page.tsx

# 6. Update navigation (if needed)
# Edit src/app/dashboard/layout.tsx
```

### Continuous Verification

**Rule**: Verify build after EACH phase

```bash
# After creating components
npm run build

# If build fails:
# 1. Read error message carefully
# 2. Fix type errors (most common)
# 3. Check imports
# 4. Verify component exports
# 5. Re-run build

# After build passes:
# 1. Test in browser (npm run dev)
# 2. Verify API calls work
# 3. Check error states
# 4. Test filters/pagination
```

### Build Error Resolution

**Common Issues & Solutions:**

1. **Type Errors**
   ```typescript
   // Error: Property 'foo' does not exist on type 'Bar'
   // Solution: Check type definitions match backend contract
   
   // Error: Type 'null' is not assignable to type 'Foo'
   // Solution: Handle null cases explicitly
   const data = response.data || undefined;
   ```

2. **Import Errors**
   ```typescript
   // Error: Cannot find module '@/components/foo'
   // Solution: Check barrel export exists
   // Check index.ts has: export { Foo } from './Foo';
   ```

3. **Missing Dependencies**
   ```typescript
   // Error: Module not found: Can't resolve 'some-package'
   // Solution: Install package
   npm install some-package
   ```

### Testing Checklist

After build passes, manually verify:
- [ ] List view loads
- [ ] Filters work
- [ ] Search works (with debounce)
- [ ] Pagination works
- [ ] Click row navigates to detail
- [ ] Detail view loads
- [ ] Create dialog opens and works
- [ ] Edit dialog opens and works
- [ ] Delete confirmation works
- [ ] Loading states show
- [ ] Error states show
- [ ] Success toasts appear
- [ ] Error toasts appear

---

## 10. Lessons Learned

### What Worked Well

1. **Incremental Approach**
   - Build feature by feature, verify each
   - Easier to debug when issues arise
   - Builds confidence progressively

2. **Component Extraction Early**
   - Identified patterns early
   - Created reusable components
   - Reduced duplicate code significantly

3. **Type-First Development**
   - Define types before implementation
   - Catches errors at compile time
   - Makes refactoring safer

4. **React Query for State Management**
   - Simplified data fetching
   - Automatic cache management
   - Reduced boilerplate significantly

5. **Consistent Patterns**
   - Same structure for all features
   - Easier to navigate codebase
   - Faster development of new features

### Challenges Overcome

1. **Missing UI Primitives**
   - **Issue**: ScrollArea component missing, caused build failure
   - **Solution**: Install @radix-ui/react-scroll-area, create wrapper
   - **Lesson**: Check dependencies before using components

2. **Type Mismatches**
   - **Issue**: Backend types didn't match frontend expectations
   - **Solution**: Adjusted types to match backend contract exactly
   - **Lesson**: Always verify API responses match type definitions

3. **Null Handling**
   - **Issue**: TypeScript complained about null values
   - **Solution**: Use `|| undefined` pattern consistently
   - **Lesson**: Plan for null states explicitly

4. **Over-Engineering Risk**
   - **Issue**: Temptation to create too many abstractions
   - **Solution**: Extract only when pattern repeats 3+ times
   - **Lesson**: Balance between DRY and KISS principles

### Best Practices Established

1. **Always verify build after changes**
   - Catch issues early
   - Don't accumulate technical debt

2. **Use barrel exports consistently**
   - Cleaner imports
   - Single source of truth

3. **Debounce search inputs**
   - Better UX
   - Reduces server load

4. **Reset page on filter change**
   - Prevents confusing empty states
   - Better user experience

5. **Consistent error handling**
   - Toast notifications
   - Friendly error messages
   - Fallback UI states

---

## Summary: The Complete Process

### Phase 1: Analysis (Day 1)
1. Audit existing code and API routes
2. Identify gaps (API exists but no UI)
3. Check for reusable patterns
4. Create implementation plan

### Phase 2: Foundation (Day 1-2)
1. Define types matching backend
2. Create/verify service layer
3. Create React Query hooks
4. Test API integration

### Phase 3: Implementation (Day 2-3)
1. Create main container component (View)
2. Extract filter component
3. Extract table component
4. Create dialogs (Create/Edit/Delete)
5. Add to navigation
6. Build & verify

### Phase 4: Polish (Day 3-4)
1. Add loading states (skeletons)
2. Add error states
3. Add empty states
4. Optimize performance (debounce, memoization)
5. Final build & testing

### Phase 5: Documentation (Day 4)
1. Document patterns used
2. Update methodology
3. Note lessons learned

---

## Quick Reference Checklist

When implementing a new feature:

**Planning Phase:**
- [ ] API route exists and documented
- [ ] Backend contract understood
- [ ] Types defined
- [ ] Similar feature identified for pattern reference

**Implementation Phase:**
- [ ] Service created with proper error handling
- [ ] Hooks created with query keys
- [ ] Main View component created
- [ ] Filters component created
- [ ] Table component created
- [ ] Dialogs created (if needed)
- [ ] Barrel export added
- [ ] Page route created
- [ ] Navigation updated

**Verification Phase:**
- [ ] Build passes (`npm run build`)
- [ ] Dev server works (`npm run dev`)
- [ ] List view loads correctly
- [ ] Filters work
- [ ] CRUD operations work
- [ ] Loading states show
- [ ] Error states show
- [ ] Toast notifications work

**Polish Phase:**
- [ ] Debounced search (if applicable)
- [ ] Pagination reset on filter change
- [ ] Memoization for expensive operations
- [ ] Consistent error messages
- [ ] Accessibility considered

---

## Conclusion

This methodology represents real-world best practices developed through iterative implementation of a production admin dashboard. The key to success is:

1. **Consistent patterns** - same structure everywhere
2. **Incremental verification** - build after each phase
3. **Type safety** - catch errors at compile time
4. **Component reusability** - DRY principle
5. **User experience** - loading states, error handling, feedback

Following these principles ensures maintainable, scalable, and robust frontend applications.

---

**Document Version**: 1.0  
**Last Updated**: January 5, 2026  
**Project**: Kuinbee Marketplace Admin Frontend
