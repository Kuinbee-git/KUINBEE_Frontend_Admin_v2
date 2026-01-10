# Quick Reference Guide

## 🚀 Where to Put Things

### Adding a New Page
```
src/app/(dashboard)/new-feature/page.tsx
```

### Adding a Feature Component
```
src/components/features/new-feature/ComponentName.tsx
```

### Adding a Shared Component
```
src/components/shared/ComponentName.tsx
```

### Adding an API Service
```
src/lib/api/new-feature.service.ts
```

### Adding a Custom Hook
```
src/lib/hooks/useNewFeature.ts
```

### Adding a Type
```
src/types/new-feature.types.ts
```
Then export in `src/types/index.ts`

### Adding a Zustand Store
```
src/store/new-feature.store.ts
```
Then export in `src/store/index.ts`

---

## 📋 Import Cheat Sheet

```tsx
// UI Components (shadcn)
import { Button } from "@/components/ui/button"

// Feature Components
import { DatasetTable } from "@/components/features/datasets/DatasetTable"

// Shared Components
import { StatusBadge } from "@/components/shared/StatusBadge"

// API Services
import { datasetsService } from "@/lib/api/datasets.service"

// Hooks
import { useAuth } from "@/lib/hooks/useAuth"

// Utils
import { cn } from "@/lib/utils/cn"

// Constants
import { ROUTES } from "@/lib/constants/routes"
import { PERMISSIONS } from "@/lib/constants/permissions"

// Types
import type { Dataset } from "@/types"

// Store
import { useAuthStore } from "@/store/auth.store"
```

---

## 🎯 Component Template

```tsx
"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Dataset } from "@/types"

interface ComponentNameProps {
  data?: Dataset[]
  onAction?: (id: string) => void
}

export function ComponentName({ data, onAction }: ComponentNameProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div 
      className="min-h-screen p-6" 
      style={{ backgroundColor: "var(--bg-surface)" }}
    >
      <h1 style={{ color: "var(--text-primary)" }}>
        Component Title
      </h1>
      {/* Your UI */}
    </div>
  )
}
```

---

## 🎨 Styling Rules (STRICT)

### ✅ DO
```tsx
// Use CSS variables
<div style={{ backgroundColor: "var(--bg-base)" }}>

// Use inline styles for theming
<h1 style={{ color: "var(--text-primary)" }}>

// Use Tailwind for layout
<div className="flex items-center gap-4">

// Use cn() for conditional classes
<div className={cn("base-class", isActive && "active-class")}>
```

### ❌ DON'T
```tsx
// Raw hex colors
<div style={{ backgroundColor: "#ffffff" }}>

// Tailwind for colors/typography
<h1 className="text-2xl font-bold text-gray-900">
```

---

## 🗺️ Navigation Map

```
Auth:
/login                  → LoginPage
/register               → RegisterPage
/forgot-password        → ForgotPasswordPage

Dashboard:
/dashboard              → DashboardPage
/datasets               → DatasetsListPage
/datasets/DS-001        → DatasetDetailPage
/suppliers              → SuppliersListPage
/suppliers/SUP-001      → SupplierDetailPage
/categories             → CategoriesPage
/sources                → SourcesPage
/users-admins           → UsersAdminsIndexPage
/users                  → UsersListPage
/users/USR-001          → UserDetailPage
/admins                 → AdminsListPage
/admins/ADM-001         → AdminDetailPage
/reports                → ReportsPage
```

---

## 🔐 Using Zustand Stores

```tsx
// Auth Store
import { useAuthStore } from "@/store/auth.store"

const { user, isAuthenticated, login, logout } = useAuthStore()

// Theme Store
import { useThemeStore } from "@/store/theme.store"

const { theme, isDark, setTheme, toggleTheme } = useThemeStore()

// Sidebar Store
import { useSidebarStore } from "@/store/sidebar.store"

const { isCollapsed, setCollapsed, toggleCollapsed } = useSidebarStore()
```

---

## 📦 Type Usage

```tsx
import type { 
  Dataset, 
  Supplier, 
  User, 
  Admin,
  Category,
  Source 
} from "@/types"

// API Response
import type { ApiResponse, PaginatedResponse } from "@/types"

const data: ApiResponse<Dataset> = await fetchDataset()
const list: PaginatedResponse<User> = await fetchUsers()
```

---

## 🎯 Next Steps Checklist

- [ ] Install dependencies (shadcn, Zustand, React Query)
- [ ] Setup Tailwind CSS v4
- [ ] Migrate globals.css (design tokens)
- [ ] Install shadcn/ui components
- [ ] Create layout components (Sidebar, Header)
- [ ] Build login page (glass morphism)
- [ ] Implement dashboard
- [ ] Connect to backend APIs

---

## 📞 Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

**Last Updated:** December 29, 2024  
**Status:** Ready for development 🚀
