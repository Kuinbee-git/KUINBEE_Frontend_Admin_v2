import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useUpdateProfile } from '@/hooks/api/useAuth';
import type { UpdateProfileRequest, Gender, AdminProfile } from '@/types';

interface PersonalInfoCardProps {
  profile: AdminProfile | null | undefined;
}

export function PersonalInfoCard({ profile }: PersonalInfoCardProps) {
  const updateProfileMutation = useUpdateProfile();
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
  
  const [editedFirstName, setEditedFirstName] = useState('');
  const [editedLastName, setEditedLastName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedDateOfBirth, setEditedDateOfBirth] = useState('');
  const [editedGender, setEditedGender] = useState<Gender | ''>('');

  const initializePersonalForm = useCallback(() => {
    setEditedFirstName(profile?.personalInfo?.firstName || '');
    setEditedLastName(profile?.personalInfo?.lastName || '');
    setEditedPhone(profile?.user?.phone || '');
    setEditedDateOfBirth(
      profile?.personalInfo?.dateOfBirth 
        ? new Date(profile.personalInfo.dateOfBirth).toISOString().split('T')[0]
        : ''
    );
    setEditedGender(profile?.personalInfo?.gender || '');
  }, [profile]);

  const handleSavePersonalInfo = useCallback(async () => {
    const data: UpdateProfileRequest = {
      phone: editedPhone.trim() || null,
      personalInfo: {
        firstName: editedFirstName.trim(),
        lastName: editedLastName.trim(),
        dateOfBirth: editedDateOfBirth || null,
        gender: editedGender || null,
      },
    };
    
    try {
      await updateProfileMutation.mutateAsync(data);
      setEditingPersonalInfo(false);
    } catch {
      // Error handled by mutation
    }
  }, [editedPhone, editedFirstName, editedLastName, editedDateOfBirth, editedGender, updateProfileMutation]);

  return (
    <Card style={{ backgroundColor: 'var(--bg-base)' }}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Personal Information
          </h2>
          {!editingPersonalInfo && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                initializePersonalForm();
                setEditingPersonalInfo(true);
              }}
            >
              Edit
            </Button>
          )}
        </div>
        
        {editingPersonalInfo ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editedFirstName}
                  onChange={(e) => setEditedFirstName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editedLastName}
                  onChange={(e) => setEditedLastName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editedPhone}
                onChange={(e) => setEditedPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={editedDateOfBirth}
                  onChange={(e) => setEditedDateOfBirth(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  value={editedGender} 
                  onValueChange={(value) => setEditedGender(value as Gender)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                    <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingPersonalInfo(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSavePersonalInfo}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  First Name
                </Label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {profile?.personalInfo?.firstName || 'Not set'}
                </p>
              </div>
              <div>
                <Label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Last Name
                </Label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {profile?.personalInfo?.lastName || 'Not set'}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Phone
              </Label>
              <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                {profile?.user?.phone || 'Not set'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Date of Birth
                </Label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {profile?.personalInfo?.dateOfBirth 
                    ? new Date(profile.personalInfo.dateOfBirth).toLocaleDateString()
                    : 'Not set'}
                </p>
              </div>
              <div>
                <Label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Gender
                </Label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {profile?.personalInfo?.gender 
                    ? profile.personalInfo.gender.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                    : 'Not set'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
