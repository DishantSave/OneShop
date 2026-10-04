export interface WarehouseAuditTrail {
  sequence: number;
  accountId: string;
  companyCode: string;
  warehouseCode: string;
  field: string;
  description: string;
  dateModified: string;
  modifiedBy: string;
}

export interface Warehouse {
  sequence: number;
  accountId: string;
  companyCode: string;
  companyName: string;
  code: string;
  name: string;
  displayName: string;
  addressLineOne: string;
  addressLineTwo?: string;
  city: string;
  stateCode: string;
  countryCode: string;
  postalCode: string;
  contact: string;
  email: string;
  isTestWarehouse: boolean;
  isActive: boolean;
  dateCreated: string;
  audit?: WarehouseAuditTrail[];
}

export interface WarehouseInput {
  companyCode: string;
  code: string;
  name: string;
  displayName: string;
  addressLineOne: string;
  addressLineTwo?: string;
  city: string;
  stateCode: string;
  countryCode: string;
  postalCode: string;
  contact: string;
  email: string;
  isTestWarehouse: boolean;
  isActive: boolean;
}
