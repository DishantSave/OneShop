export type StoreType = 'Physical' | 'Online' | 'Outlet' | 'Warehouse' | 'Pop-up';

export interface Store {
  sequence?: number;
  accountId?: string;
  companyCode: string;          // 2 chars, immutable after create
  companyName?: string | null;  // For display
  code: string;                 // 2-4 chars, immutable after create
  name: string;
  displayName: string;
  storeType: StoreType | string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  stateCode: string;
  countryCode: string;
  postalCode: string;
  contact: string;
  email: string;
  website?: string | null;
  logo?: string | null;         // data URL / hosted URL
  currencyCode?: string | null;
  timeZone?: string | null;
  isTestStore: boolean;
  originalIsTestStore?: boolean;
  isActive: boolean;
  originalIsActive?: boolean;
  dateCreated?: string;
  audit?: StoreAuditTrail[];
}

export interface StoreAuditTrail {
  sequence: number;
  accountId: string;
  companyCode: string;
  storeCode: string;
  field: string;
  description: string;
  dateModified: string;
  modifiedBy: string;
}

export const emptyStore = (): Store => ({
  accountId: '',
  companyCode: '',
  code: '',
  name: '',
  displayName: '',
  storeType: 'Physical',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateCode: '',
  countryCode: 'IN',
  postalCode: '',
  contact: '',
  email: '',
  website: '',
  logo: '',
  currencyCode: 'INR',
  timeZone: 'Asia/Kolkata',
  isTestStore: false,
  isActive: true
});
