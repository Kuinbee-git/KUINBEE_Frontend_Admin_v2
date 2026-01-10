import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useUpdateProfile } from '@/hooks/api/useAuth';
import type { UpdateProfileRequest, AdminProfile } from '@/types';

interface OrganizationalDetailsCardProps {
  profile: AdminProfile | null | undefined;
}

export function OrganizationalDetailsCard({ profile }: OrganizationalDetailsCardProps) {
  const updateProfileMutation = useUpdateProfile();
  const [editingOrgDetails, setEditingOrgDetails] = useState(false);
  const [editedDepartment, setEditedDepartment] = useState('');

  const initializeOrgForm = useCallback(() => {
    setEditedDepartment(profile?.adminProfile?.department || '');
  }, [profile]);

  const handleSaveOrgDetails = useCallback(async () => {
    const data: UpdateProfileRequest = {
      adminProfile: {
        department: editedDepartment.trim() || null,
      },
    };
    
    try {
      await updateProfileMutation.mutateAsync(data);
      setEditingOrgDetails(false);
    } catch {
      // Error handled by mutation
    }
  }, [editedDepartment, updateProfileMutation]);

  return (
    <Card style={{ backgroundColor: 'var(--bg-base)' }}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Organizational Details
          </h2>
          {!editingOrgDetails && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                initializeOrgForm();
                setEditingOrgDetails(true);
              }}
            >
              Edit
            </Button>
          )}
        </div>
        
        <div className="space-y-3">
          {editingOrgDetails ? (
            <>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={editedDepartment}
                  onChange={(e) => setEditedDepartment(e.target.value)}
                  placeholder="e.g., Data Governance, Operations"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingOrgDetails(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveOrgDetails}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Employee ID
                </Label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {profile?.adminProfile?.employeeId || 'Not set'}
                </p>
              </div>
              <div>
                <Label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Department
                </Label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {profile?.adminProfile?.department || 'Not set'}
                </p>
              </div>
              <div>
                <Label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Joining Date
                </Label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {profile?.adminProfile?.joiningDate 
                    ? new Date(profile.adminProfile.joiningDate).toLocaleDateString() 
                    : 'Not set'}
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
