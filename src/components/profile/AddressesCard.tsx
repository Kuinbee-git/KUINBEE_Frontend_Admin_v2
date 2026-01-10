import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Pencil, Trash2, MapPin } from 'lucide-react';
import { useCreateAddress, useUpdateAddress, useDeleteAddress } from '@/hooks/api/useAuth';
import { useAddresses } from '@/hooks/api/useAddresses';
import type { CreateAddressRequest, UpdateAddressRequest } from '@/types';
import type { Address } from '@/types/address.types';
import { AddressDialog } from './AddressDialog';
import { DeleteAddressDialog } from './DeleteAddressDialog';

export function AddressesCard() {
  const { data: addresses, error: addressesError } = useAddresses();
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addressEditMode, setAddressEditMode] = useState<'create' | 'edit'>('create');
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  const [addressForm, setAddressForm] = useState<CreateAddressRequest>({
    addressType: 'PERSONAL',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    isDefault: false,
    label: '',
  });

  const resetAddressForm = useCallback(() => {
    setAddressForm({
      addressType: 'PERSONAL',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
      isDefault: false,
      label: '',
    });
  }, []);

  const openCreateAddressDialog = useCallback(() => {
    resetAddressForm();
    setAddressEditMode('create');
    setEditingAddressId(null);
    setAddressDialogOpen(true);
  }, [resetAddressForm]);

  const openEditAddressDialog = useCallback((address: Address) => {
    setAddressForm({
      addressType: address.addressType,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      landmark: address.landmark || '',
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
      label: address.label || '',
    });
    setAddressEditMode('edit');
    setEditingAddressId(address.id);
    setAddressDialogOpen(true);
  }, []);

  const openDeleteDialog = useCallback((addressId: string) => {
    setDeletingAddressId(addressId);
    setDeleteDialogOpen(true);
  }, []);

  const handleSaveAddress = useCallback(async () => {
    try {
      if (addressEditMode === 'create') {
        await createAddressMutation.mutateAsync(addressForm);
      } else if (editingAddressId) {
        await updateAddressMutation.mutateAsync({
          addressId: editingAddressId,
          data: addressForm as UpdateAddressRequest,
        });
      }
      setAddressDialogOpen(false);
      resetAddressForm();
    } catch {
      // Error handled by mutation
    }
  }, [addressEditMode, addressForm, editingAddressId, createAddressMutation, updateAddressMutation, resetAddressForm]);

  const handleDeleteAddress = useCallback(async () => {
    if (!deletingAddressId) return;
    
    try {
      await deleteAddressMutation.mutateAsync(deletingAddressId);
      setDeleteDialogOpen(false);
      setDeletingAddressId(null);
    } catch {
      // Error handled by mutation
    }
  }, [deletingAddressId, deleteAddressMutation]);

  return (
    <>
      <Card style={{ backgroundColor: 'var(--bg-base)' }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Saved Addresses
              </h2>
            </div>
            <Button 
              size="sm" 
              onClick={openCreateAddressDialog}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Address
            </Button>
          </div>

          {addressesError ? (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--state-error)' }}>
                Failed to load addresses
              </p>
            </div>
          ) : !addresses || addresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No addresses saved yet
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openCreateAddressDialog}
                className="mt-3"
              >
                Add your first address
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((address: Address) => (
                <div
                  key={address.id}
                  className="rounded-lg border p-4 hover:shadow-sm transition-shadow"
                  style={{ 
                    borderColor: 'var(--border-default)', 
                    backgroundColor: 'var(--bg-surface)' 
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {address.addressType.replace(/_/g, ' ')}
                        </Badge>
                        {address.isDefault && (
                          <Badge 
                            className="text-xs" 
                            style={{ backgroundColor: 'var(--state-success)', color: '#fff' }}
                          >
                            Default
                          </Badge>
                        )}
                        {address.label && (
                          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {address.label}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        {address.addressLine1}
                      </div>
                      
                      {address.addressLine2 && (
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {address.addressLine2}
                        </div>
                      )}
                      
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {address.landmark && `${address.landmark}, `}
                        {address.city}, {address.state}
                      </div>
                      
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {address.country} - {address.postalCode}
                      </div>
                      
                      <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                        Added on {new Date(address.createdAt).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditAddressDialog(address)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(address.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddressDialog
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        mode={addressEditMode}
        addressForm={addressForm}
        setAddressForm={setAddressForm}
        onSave={handleSaveAddress}
        isSaving={createAddressMutation.isPending || updateAddressMutation.isPending}
      />

      <DeleteAddressDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteAddress}
        isDeleting={deleteAddressMutation.isPending}
      />
    </>
  );
}
