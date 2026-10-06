export interface UserAddress {
  sequence?: number;
  accountId?: string;
  userName?: string;
  addressId: string;
  addressType: string; // Office, Home, Warehouse Dock, Branch, etc.
  contactName: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  dateCreated?: string;
}

export interface UserAddressInput {
  addressId?: string;
  addressType: string;
  contactName: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}
