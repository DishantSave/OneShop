export interface Company {
  sequence?: number;
  accountId?: string;
  code: string;                 // 2 chars, immutable after create
  name: string;
  displayName: string;
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
  isTestCompany: boolean;
  isActive: boolean;
  dateCreated?: string;
  audit?: CompanyAuditTrail[];
}

export interface CompanyAuditTrail {
  sequence: number;
  accountId: string;
  code: string;
  field: string;
  description: string;
  dateModified: string;
  modifiedBy: string;
}

export const emptyCompany = (): Company => ({
  accountId: '',
  code: '',
  name: '',
  displayName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateCode: '',
  countryCode: '',
  postalCode: '',
  contact: '',
  email: '',
  website: '',
  logo: '',
  currencyCode: '',
  timeZone: '',
  isTestCompany: false,
  isActive: true
});
