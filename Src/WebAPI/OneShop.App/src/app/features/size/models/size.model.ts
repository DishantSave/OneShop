export interface SizeAuditTrail {
  sequence: number;
  accountId: string;
  companyCode: string;
  sizeCode: string;
  field: string;
  description: string;
  dateModified: string;
  modifiedBy: string;
}

export interface Size {
  sequence: number;
  accountId: string;
  companyCode: string;
  companyName: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  dateCreated: string;
  audit?: SizeAuditTrail[];
}

export interface SizeInput {
  companyCode: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}
