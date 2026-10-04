export interface InventoryAuditTrail {
  sequence: number;
  accountId: string;
  companyCode: string;
  itemNumber: string;
  colourCode: string;
  sizeCode: string;
  locationType: string;
  locationCode: string;
  field: string;
  description: string;
  dateModified: string;
  modifiedBy: string;
}

export interface Inventory {
  sequence: number;
  accountId: string;
  companyCode: string;
  companyName: string;
  itemNumber: string;
  itemName: string;
  itemDisplayName: string;
  colourCode: string;
  colourName?: string;
  colourHex?: string;
  sizeCode: string;
  sizeName?: string;
  locationType: 'Warehouse' | 'Store'; // Warehouse for B2B, Store for B2C
  locationCode: string;
  locationName: string;
  quantityOnHand: number;
  allocatedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  dateModified: string;
  audit?: InventoryAuditTrail[];
}

export interface InventoryInput {
  companyCode: string;
  itemNumber: string;
  colourCode: string;
  sizeCode: string;
  locationType: string;
  locationCode: string;
  quantityOnHand: number;
  allocatedQuantity: number;
  reorderLevel: number;
  reason?: string;
}

export interface BatchInventoryAdjustmentInput {
  companyCode: string;
  locationType: string;
  locationCode: string;
  itemNumber: string;
  colourCode: string;
  sizeCode: string;
  quantityAdjustment: number;
  reason?: string;
}
