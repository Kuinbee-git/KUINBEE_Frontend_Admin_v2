'use client';

import { type ReactNode, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  BadgePercent,
  BarChart3,
  ClipboardList,
  ClipboardPenLine,
  Database,
  FileText,
  FolderTree,
  KeyRound,
  LayoutDashboard,
  Link2,
  ListChecks,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Star,
  User,
  Users,
  WandSparkles,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { RouteAccessGuard } from '@/components/auth/RouteAccessGuard';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useLogout, useMyPermissions } from '@/hooks';
import { canAccess, type AccessRequirement } from '@/lib/authorization/authorization';
import {
  ADMIN_DIRECTORY_ACCESS,
  CATEGORY_CATALOG_ACCESS,
  DATA_REQUIREMENT_ACCESS,
  DATASET_REVIEW_ACCESS,
  PLATFORM_DATASET_ACCESS,
  SOURCE_CATALOG_ACCESS,
  SUPPLIER_WORKSPACE_ACCESS,
  USER_DIRECTORY_ACCESS,
} from '@/lib/authorization/route-access';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { useAuthStore } from '@/store/auth.store';
import { useSidebarStore } from '@/store/sidebar.store';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

type NavGroupId = 'overview' | 'review' | 'marketplace' | 'governance';

interface AdminNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  group: NavGroupId;
  access?: AccessRequirement;
}

const NAV_GROUPS: Array<{ id: NavGroupId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'review', label: 'Review operations' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'governance', label: 'Governance' },
];

const NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    group: 'overview',
  },
  {
    id: 'my-queue',
    label: 'My Queue',
    icon: ListChecks,
    href: '/dashboard/my-queue',
    group: 'review',
    access: { anyOf: [PERMISSIONS.DATASETS.VIEW_ASSIGNED] },
  },
  {
    id: 'supplier-kyc',
    label: 'Supplier Queue',
    icon: ClipboardList,
    href: '/dashboard/supplier-kyc',
    group: 'review',
    access: { anyOf: [PERMISSIONS.SUPPLIERS.MANAGE_VERIFICATION] },
  },
  {
    id: 'proposals',
    label: 'Proposals',
    icon: ClipboardList,
    href: '/dashboard/proposals',
    group: 'review',
    access: DATASET_REVIEW_ACCESS,
  },
  {
    id: 'update-requests',
    label: 'Update Requests',
    icon: ClipboardList,
    href: '/dashboard/update-requests',
    group: 'review',
    access: DATASET_REVIEW_ACCESS,
  },
  {
    id: 'discount-proposals',
    label: 'Discount Proposals',
    icon: BadgePercent,
    href: '/dashboard/discount-proposals',
    group: 'review',
    access: DATASET_REVIEW_ACCESS,
  },
  {
    id: 'datasets',
    label: 'Datasets',
    icon: Database,
    href: '/dashboard/datasets',
    group: 'marketplace',
    access: PLATFORM_DATASET_ACCESS,
  },
  {
    id: 'data-requirements',
    label: 'Data Requirements',
    icon: ClipboardPenLine,
    href: '/dashboard/data-requirements',
    group: 'marketplace',
    access: DATA_REQUIREMENT_ACCESS,
  },
  {
    id: 'custom-collection-services',
    label: 'Custom Services',
    icon: WandSparkles,
    href: '/dashboard/custom-collection-services',
    group: 'marketplace',
    access: { anyOf: [PERMISSIONS.CUSTOM_COLLECTION.REVIEW_SERVICES] },
  },
  {
    id: 'custom-collection-leads',
    label: 'Custom Leads',
    icon: Mail,
    href: '/dashboard/custom-collection-leads',
    group: 'marketplace',
    access: { anyOf: [PERMISSIONS.CUSTOM_COLLECTION.MANAGE_LEADS] },
  },
  {
    id: 'questions',
    label: 'Questions',
    icon: MessageSquare,
    href: '/dashboard/questions',
    group: 'marketplace',
    access: { anyOf: [PERMISSIONS.DATASETS.VIEW_PROPOSALS] },
  },
  {
    id: 'reviews',
    label: 'Reviews',
    icon: Star,
    href: '/dashboard/reviews',
    group: 'marketplace',
    access: { anyOf: [PERMISSIONS.DATASETS.VIEW_ANALYTICS] },
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    icon: Users,
    href: '/dashboard/suppliers',
    group: 'marketplace',
    access: SUPPLIER_WORKSPACE_ACCESS,
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: FolderTree,
    href: '/dashboard/categories',
    group: 'marketplace',
    access: CATEGORY_CATALOG_ACCESS,
  },
  {
    id: 'sources',
    label: 'Sources',
    icon: Link2,
    href: '/dashboard/sources',
    group: 'marketplace',
    access: SOURCE_CATALOG_ACCESS,
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    href: '/dashboard/users',
    group: 'governance',
    access: USER_DIRECTORY_ACCESS,
  },
  {
    id: 'admins',
    label: 'Admins',
    icon: Shield,
    href: '/dashboard/admins',
    group: 'governance',
    access: ADMIN_DIRECTORY_ACCESS,
  },
  {
    id: 'invites',
    label: 'Invites',
    icon: Mail,
    href: '/dashboard/invites',
    group: 'governance',
    access: { anyOf: [PERMISSIONS.ADMINS.CREATE] },
  },
  {
    id: 'roles',
    label: 'Roles',
    icon: KeyRound,
    href: '/dashboard/roles',
    group: 'governance',
    access: { anyOf: [PERMISSIONS.ROLES.MANAGE] },
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    icon: FileText,
    href: '/dashboard/audit',
    group: 'governance',
    access: { superadminOnly: true },
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: BarChart3,
    href: '/dashboard/reports',
    group: 'governance',
    access: { anyOf: [PERMISSIONS.REPORTS.VIEW, PERMISSIONS.REPORTS.EXPORT] },
  },
];

function isNavItemActive(pathname: string, href: string) {
  if (href === '/dashboard/datasets' && pathname.startsWith('/dashboard/platform-datasets/')) {
    return true;
  }
  return href === '/dashboard' ? pathname === href : pathname.startsWith(href);
}

interface SidebarNavigationProps {
  collapsed?: boolean;
  items: AdminNavItem[];
  pathname: string;
  onNavigate?: () => void;
}

function SidebarNavigation({
  collapsed = false,
  items,
  pathname,
  onNavigate,
}: SidebarNavigationProps) {
  return (
    <nav
      className="flex-1 overflow-y-auto overscroll-contain px-3 py-4"
      aria-label="Admin navigation"
    >
      {NAV_GROUPS.map((group, groupIndex) => {
        const groupItems = items.filter((item) => item.group === group.id);
        if (groupItems.length === 0) return null;

        return (
          <div
            key={group.id}
            className={cn(groupIndex > 0 && 'mt-5 border-t pt-4')}
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            {collapsed ? (
              <span className="sr-only">{group.label}</span>
            ) : (
              <p
                className="mb-1.5 px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.12em]"
                style={{ color: 'var(--text-muted)' }}
              >
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {groupItems.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(pathname, item.href);

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'relative flex min-h-10 w-full items-center gap-3 rounded-lg border-l-[3px] px-3 py-2 text-sm transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2',
                      collapsed && 'justify-center'
                    )}
                    style={{
                      backgroundColor: isActive ? 'var(--nav-active-bg)' : 'transparent',
                      borderLeftColor: isActive ? 'var(--nav-active)' : 'transparent',
                      color: isActive ? 'var(--nav-active)' : 'var(--text-secondary)',
                      fontWeight: isActive ? 650 : 500,
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        'flex h-9 items-center justify-center rounded-lg bg-[var(--brand-primary)] px-3 text-sm font-semibold tracking-[0.1em] text-[var(--brand-on-primary)] shadow-sm',
        compact ? 'w-9 px-0' : 'min-w-30'
      )}
      aria-label="Kuinbee admin dashboard"
    >
      {compact ? 'K' : 'KUINBEE'}
    </Link>
  );
}

function DashboardShell({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const { isCollapsed, setCollapsed } = useSidebarStore();
  const user = useAuthStore((state) => state.user);
  const storedPermissions = useAuthStore((state) => state.permissions);
  const permissionsQuery = useMyPermissions({ enabled: Boolean(user) });
  const logoutMutation = useLogout();
  const permissions = permissionsQuery.data ?? storedPermissions;

  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => canAccess(user?.userType, permissions, item.access)),
    [permissions, user?.userType]
  );

  const activeItem = useMemo(
    () =>
      [...navItems]
        .sort((first, second) => second.href.length - first.href.length)
        .find((item) => isNavItemActive(pathname, item.href)),
    [navItems, pathname]
  );

  const toggleCollapse = useCallback(() => {
    setCollapsed(!isCollapsed);
  }, [isCollapsed, setCollapsed]);

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const initials = user?.email.slice(0, 2).toUpperCase() || 'AD';
  const roleLabel = user?.userType === 'SUPERADMIN' ? 'Superadmin' : 'Administrator';

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--bg-surface)] text-[var(--text-primary)]">
      <aside
        className="relative hidden h-dvh shrink-0 flex-col border-r transition-[width] duration-200 lg:flex"
        style={{
          width: isCollapsed ? '72px' : '264px',
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b px-4',
            isCollapsed && 'justify-center px-3'
          )}
          style={{ borderColor: 'var(--border-default)' }}
        >
          <Brand compact={isCollapsed} />
        </div>

        <div
          className="shrink-0 border-b px-3 py-3"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <button
            type="button"
            onClick={toggleCollapse}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border bg-[var(--bg-base)] transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>

        <SidebarNavigation collapsed={isCollapsed} items={navItems} pathname={pathname} />
      </aside>

      <Sheet open={isMobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="flex w-[min(88vw,320px)] flex-col gap-0 border-r bg-[var(--bg-base)] p-0 lg:hidden"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate between Kuinbee administration sections.
          </SheetDescription>
          <div
            className="flex h-16 shrink-0 items-center border-b px-4 pr-14"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <Brand />
          </div>
          <SidebarNavigation
            items={navItems}
            pathname={pathname}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex h-16 shrink-0 items-center justify-between gap-3 border-b px-3 sm:px-5 lg:px-6"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </Button>
            <div className="min-w-0">
              <p
                className="truncate text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {activeItem?.label ?? 'Admin'}
              </p>
              <p className="hidden text-xs sm:block" style={{ color: 'var(--text-muted)' }}>
                Kuinbee operations
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle variant="clean" size="sm" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 gap-2 px-1.5 sm:px-2.5">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback
                      className="text-xs font-semibold"
                      style={{
                        backgroundColor: 'var(--brand-primary)',
                        color: 'var(--brand-on-primary)',
                      }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-36 truncate text-sm sm:inline">{roleLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-sm font-medium leading-none">{roleLabel}</p>
                    <p className="truncate text-xs leading-none text-muted-foreground">
                      {user?.email ?? 'Signed-in admin'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>{logoutMutation.isPending ? 'Logging out…' : 'Log out'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto">
          <RouteAccessGuard>{children}</RouteAccessGuard>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: AdminLayoutProps) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
