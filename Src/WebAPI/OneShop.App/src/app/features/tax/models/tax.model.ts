export interface StateTax {
  sequence?: number;
  accountId?: string;
  countryCode: string;
  stateCode: string;
  stateName: string;
  taxRate: number;
  taxType: string;
  isActive: boolean;
  dateCreated?: string;
  dateModified?: string;
  createdBy?: string;
}

export interface StateTaxInput {
  countryCode?: string;
  stateCode: string;
  stateName: string;
  taxRate: number;
  taxType?: string;
  isActive: boolean;
}
