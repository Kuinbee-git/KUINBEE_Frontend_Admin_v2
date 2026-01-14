'use client';

import { ReactNode, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Database,
  Users,
  FolderTree,
  Link2,
  Shield,
  BarChart3,
  PanelLeftOpen,
  PanelLeftClose,
  Search,
  Bell,
  LogOut,
  User,
  ClipboardList,
  Mail,
  KeyRound,
  ListChecks,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useAuthStore } from '@/store/auth.store';
import { useSidebarStore } from '@/store/sidebar.store';
import { useThemeStore } from '@/store/theme.store';
import { useLogout } from '@/hooks';
import { AntiFlickerWrapper } from '@/components/auth/AntiFlickerWrapper';
import { AuthGuard } from '@/components/auth/AuthGuard';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { isCollapsed, setCollapsed } = useSidebarStore();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const logoutMutation = useLogout();

  // Hydrate persisted stores on mount to prevent hydration mismatch
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    useSidebarStore.persist.rehydrate();
    useThemeStore.persist.rehydrate();
  }, []);

  const isDark = theme === 'dark';

  const toggleCollapse = useCallback(() => {
    setCollapsed(!isCollapsed);
  }, [isCollapsed, setCollapsed]);

  const handleLogout = useCallback(() => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = '/login';
      },
    });
  }, [logoutMutation]);

  const navItems = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    {
      id: 'datasets',
      label: 'Datasets',
      icon: Database,
      href: '/dashboard/datasets',
      primary: true,
    },
    {
      id: 'my-queue',
      label: 'My Queue',
      icon: ListChecks,
      href: '/dashboard/my-queue',
    },
    {
      id: 'proposals',
      label: 'Proposals',
      icon: ClipboardList,
      href: '/dashboard/proposals',
      primary: true,
    },
    { id: 'suppliers', label: 'Suppliers', icon: Users, href: '/dashboard/suppliers' },
    { id: 'categories', label: 'Categories', icon: FolderTree, href: '/dashboard/categories' },
    { id: 'sources', label: 'Sources', icon: Link2, href: '/dashboard/sources' },
    { id: 'users', label: 'Users & Admins', icon: Shield, href: '/dashboard/admins' },
    { id: 'invites', label: 'Invites', icon: Mail, href: '/dashboard/invites' },
    { id: 'roles', label: 'Roles', icon: KeyRound, href: '/dashboard/roles' },
    { id: 'audit', label: 'Audit Logs', icon: FileText, href: '/dashboard/audit' },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, href: '/dashboard/reports' },
  ], []);

  // Get initials for avatar - memoized
  const getInitials = useCallback((email?: string) => {
    if (!email) return 'A';
    return email.substring(0, 2).toUpperCase();
  }, []);

  return (
    <div
      className="min-h-screen flex transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      {/* Left Sidebar Navigation */}
      <aside
        className="flex flex-col border-r transition-all duration-300 relative"
        style={{
          width: isCollapsed ? '64px' : '256px',
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
        }}
      >
        {/* Logo/Brand Area */}
        <div
          className="h-16 flex items-center px-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div
              className="h-9 px-4 bg-gradient-to-r from-[#1a2240] to-[#2a3250] rounded-lg flex items-center justify-center shadow-sm"
              style={{
                minWidth: isCollapsed ? '32px' : '120px',
              }}
            >
              <span className="text-white font-semibold text-sm tracking-[0.1em]">
                {isCollapsed ? 'K' : 'KUINBEE'}
              </span>
            </div>
          </div>
        </div>

        {/* Collapse/Expand Toggle Button */}
        <div className="px-3 pt-3 pb-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <button
            onClick={toggleCollapse}
            className="w-full h-8 flex items-center justify-center border rounded-lg transition-all hover:bg-[var(--bg-hover)]"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              backgroundColor: 'var(--bg-base)',
              borderColor: 'var(--border-default)',
            }}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
            ) : (
              <div className="flex items-center gap-2">
                <PanelLeftClose className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Collapse
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/dashboard' 
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
            const isPrimary = item.primary;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative ${
                  isPrimary ? 'font-semibold' : ''
                }`}
                style={{
                  backgroundColor: isActive
                    ? isDark
                      ? 'var(--bg-nav-active)'
                      : 'var(--bg-hover)'
                    : 'transparent',
                  color: isActive
                    ? isDark
                      ? 'var(--text-nav-active)'
                      : 'var(--brand-primary)'
                    : 'var(--text-secondary)',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  borderLeft: isActive 
                    ? isDark 
                      ? '3px solid var(--border-nav-active)' 
                      : '3px solid var(--brand-primary)' 
                    : 'none',
                  paddingLeft: isActive ? 'calc(0.75rem - 3px)' : '0.75rem',
                  fontWeight: isActive ? '600' : isPrimary ? '600' : '400',
                }}
                title={isCollapsed ? item.label : undefined}
                aria-label={item.label}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${isPrimary ? 'stroke-[2.5]' : ''}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Utility Bar */}
        <header
          className="h-16 border-b flex items-center justify-between px-6"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-default)',
          }}
        >
          {/* Left - Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: 'var(--text-muted)' }}
              />
              <Input
                type="search"
                placeholder="Search datasets, suppliers..."
                className="pl-10 h-9 transition-all"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* Right - Theme, Notifications & Profile */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle variant="clean" size="sm" />

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Bell className="h-4 w-4" />
              <span
                className="absolute top-1 right-1 h-2 w-2 rounded-full"
                style={{ backgroundColor: 'var(--state-error)' }}
              />
            </Button>

            {/* Admin Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback
                      className="text-xs font-semibold"
                      style={{
                        backgroundColor: 'var(--brand-primary)',
                        color: '#ffffff',
                      }}
                    >
                      {getInitials(user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      Admin
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin User</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'admin@kuinbee.com'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                {/* Settings button removed */}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <AntiFlickerWrapper>
            <AuthGuard>{children}</AuthGuard>
          </AntiFlickerWrapper>
        </main>
      </div>
    </div>
  );
}
