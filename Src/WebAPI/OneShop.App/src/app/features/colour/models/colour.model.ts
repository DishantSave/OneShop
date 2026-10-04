export interface ColourAuditTrail {
  sequence: number;
  accountId: string;
  companyCode: string;
  colourCode: string;
  field: string;
  description: string;
  dateModified: string;
  modifiedBy: string;
}

export interface Colour {
  sequence: number;
  accountId: string;
  companyCode: string;
  companyName: string;
  code: string;
  name: string;
  hexCode?: string;
  isActive: boolean;
  dateCreated: string;
  audit?: ColourAuditTrail[];
}

export interface ColourInput {
  companyCode: string;
  code: string;
  name: string;
  hexCode?: string;
  isActive: boolean;
}
