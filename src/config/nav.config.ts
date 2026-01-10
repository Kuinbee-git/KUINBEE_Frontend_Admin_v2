/**
 * Navigation Configuration
 * Sidebar navigation items
 */

import {
  LayoutDashboard,
  Database,
  Users,
  FolderTree,
  Database as Sources,
  Shield,
  BarChart3,
  FileText,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  primary?: boolean;
  badge?: string | number;
}

export const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'datasets',
    label: 'Datasets',
    href: '/datasets',
    icon: Database,
    primary: true, // Primary workflow (from docs)
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    href: '/suppliers',
    icon: Users,
  },
  {
    id: 'categories',
    label: 'Categories',
    href: '/categories',
    icon: FolderTree,
  },
  {
    id: 'sources',
    label: 'Sources',
    href: '/sources',
    icon: Sources,
  },
  {
    id: 'users-admins',
    label: 'Users & Admins',
    href: '/users-admins',
    icon: Shield,
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    href: '/audit',
    icon: FileText,
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
];
