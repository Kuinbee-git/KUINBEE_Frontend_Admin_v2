export type AddressType = "PERSONAL" | "BILLING" | "SHIPPING" | "REGISTERED_OFFICE" | "BUSINESS";

export interface Address {
  id: string;
  addressType: AddressType;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
  label: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  addressType?: AddressType;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country?: string;
  postalCode: string;
  isDefault?: boolean;
  label?: string;
}

export interface UpdateAddressRequest {
  addressType?: AddressType;
  addressLine1?: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isDefault?: boolean;
  label?: string | null;
}
