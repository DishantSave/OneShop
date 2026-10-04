export interface ItemVariant {
  sequence?: number;
  accountId?: string;
  companyCode?: string;
  itemNumber?: string;
  colourCode: string;
  colourName?: string;
  colourHex?: string;
  sizeCode: string;
  sizeName?: string;
  sku?: string;
  barcode?: string;
  additionalPrice: number;
  isActive: boolean;
  dateCreated?: string;
}

export interface ItemAuditTrail {
  sequence: number;
  accountId: string;
  companyCode: string;
  itemNumber: string;
  field: string;
  description: string;
  dateModified: string;
  modifiedBy: string;
}

export interface Item {
  sequence: number;
  accountId: string;
  companyCode: string;
  companyName: string;
  itemNumber: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  salesChannel: 'B2C' | 'B2B' | 'Both';
  b2cPrice: number;
  b2cCompareAtPrice?: number;
  b2bPrice: number;
  b2bMinQuantity: number; // Minimum Order Quantity (MOQ)
  unitOfMeasure: string;
  season?: string;
  brand?: string;
  tags?: string;
  images?: string;
  isActive: boolean;
  dateCreated: string;
  variants?: ItemVariant[];
  audit?: ItemAuditTrail[];
}

export interface ItemInput {
  companyCode: string;
  itemNumber: string;
  name: string;
  displayName?: string;
  description?: string;
  category: string;
  salesChannel: string;
  b2cPrice: number;
  b2cCompareAtPrice?: number;
  b2bPrice: number;
  b2bMinQuantity: number;
  unitOfMeasure: string;
  season?: string;
  brand?: string;
  tags?: string;
  images?: string;
  isActive: boolean;
  variants?: {
    colourCode: string;
    sizeCode: string;
    sku?: string;
    barcode?: string;
    additionalPrice: number;
    isActive: boolean;
  }[];
}

export interface CollectionItem {
  sequence?: number;
  accountId?: string;
  companyCode?: string;
  collectionCode?: string;
  itemNumber: string;
  sizeCode: string;
  sizeName?: string;
  itemName?: string;
  itemDisplayName?: string;
  category?: string;
  salesChannel?: string;
  b2cPrice?: number;
  b2bPrice?: number;
  b2bMinQuantity?: number;
  sortOrder: number;
  dateAdded?: string;
}

export interface CollectionItemInput {
  itemNumber: string;
  sizeCode: string;
  sortOrder?: number;
}

export interface Collection {
  sequence: number;
  accountId: string;
  companyCode: string;
  companyName: string;
  code: string;
  name: string;
  description?: string;
  season?: string;
  channel: 'B2C' | 'B2B' | 'Both';
  bannerImage?: string;
  isActive: boolean;
  dateCreated: string;
  items?: CollectionItem[];
}

export interface CollectionInput {
  companyCode: string;
  code: string;
  name: string;
  description?: string;
  season?: string;
  channel: string;
  bannerImage?: string;
  isActive: boolean;
  items?: CollectionItemInput[];
  itemNumbers?: string[];
}
