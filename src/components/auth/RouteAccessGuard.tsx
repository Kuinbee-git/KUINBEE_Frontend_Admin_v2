'use client';

import { ShieldAlert } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { canAccess } from '@/lib/authorization/authorization';
import { getRouteAccessRequirement } from '@/lib/authorization/route-access';
import { useAuthorization } from '@/hooks/useAuthorization';

export function RouteAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { permissions, permissionsQuery, user } = useAuthorization();
  const requirement = getRouteAccessRequirement(pathname);

  if (permissionsQuery.isLoading && user?.userType === 'ADMIN' && permissions.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-label="Checking access">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!canAccess(user?.userType, permissions, requirement)) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="mx-auto max-w-xl">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <ShieldAlert className="mb-4 h-10 w-10 text-destructive" aria-hidden="true" />
            <h1 className="text-xl font-semibold">Access restricted</h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Your account does not have the permission required for this section. If this seems
              incorrect, ask a superadmin to review your assigned roles.
            </p>
            {permissionsQuery.isError ? (
              <Button className="mt-5" variant="outline" onClick={() => permissionsQuery.refetch()}>
                Retry permission check
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
