export interface OrderItem {
  sequence?: number;
  accountId?: string;
  companyCode: string;
  orderId?: string;
  itemNumber: string;
  itemName: string;
  colourCode?: string;
  sizeCode: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  tax?: number;
  shippingCost?: number;
  discount?: number;
  dateAdded?: string;
}

export interface OrderAuditTrail {
  sequence?: number;
  accountId: string;
  companyCode: string;
  orderId: string;
  actionType: 'Created' | 'StatusChanged' | 'DetailsUpdated' | 'CommentAdded';
  field?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  dateModified: string;
  modifiedBy: string;
  userRole?: string;
}

export interface Order {
  sequence?: number;
  accountId?: string;
  companyCode: string;
  companyName?: string;
  orderId: string;
  parentOrderId?: string;
  channel: 'B2B' | 'B2C' | 'Both';
  locationType: 'Store' | 'Warehouse';
  locationCode: string;
  locationName?: string;
  status: string;
  paymentStatus: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  totalItems: number;
  subTotal: number;
  tax: number;
  otherTax?: number;
  shippingCost: number;
  discount: number;
  platformFee?: number;
  totalAmount: number;
  notes?: string;
  orderDate?: string;
  dateCreated?: string;
  createdBy?: string;
  shipVia?: string;
  deliveryPartner?: string;
  pickupLocationCode?: string;
  pickupLocationName?: string;
  shippingState?: string;
  promoCode?: string;
  items?: OrderItem[];
  auditTrail?: OrderAuditTrail[];
  canModify?: boolean;
}

export interface UpdateOrderDetailsInput {
  companyCode: string;
  orderId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingState?: string;
  shipVia?: string;
  deliveryPartner?: string;
  pickupLocationCode?: string;
  pickupLocationName?: string;
  notes?: string;
  userRole?: string;
}

export interface AddOrderTimelineCommentInput {
  companyCode: string;
  orderId: string;
  comment: string;
  userRole?: string;
}

export interface OrderItemInput {
  itemNumber: string;
  itemName: string;
  colourCode?: string;
  sizeCode: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  tax?: number;
  shippingCost?: number;
  discount?: number;
}

export interface OrderInput {
  companyCode: string;
  orderId?: string;
  parentOrderId?: string;
  channel: string;
  locationType: string;
  locationCode: string;
  status?: string;
  paymentStatus?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  tax?: number;
  otherTax?: number;
  shippingCost?: number;
  discount?: number;
  platformFee?: number;
  notes?: string;
  shipVia?: string;
  deliveryPartner?: string;
  pickupLocationCode?: string;
  pickupLocationName?: string;
  shippingState?: string;
  promoCode?: string;
  items: OrderItemInput[];
}

export interface BatchOrderInput {
  orders: OrderInput[];
}

export interface CartItem {
  id: string; // unique cart key (e.g. itemNumber::sizeCode::companyCode::locationCode)
  itemNumber: string;
  itemName: string;
  category?: string;
  companyCode: string;
  companyName?: string;
  sizeCode: string;
  channel: 'B2B' | 'B2C' | 'Both';
  unitPrice: number;
  b2cPrice?: number;
  b2bPrice?: number;
  b2bMinQuantity?: number;
  quantity: number;
  locationType: 'Store' | 'Warehouse';
  locationCode: string;
  locationName?: string;
  // Item financial breakdown
  taxAmount?: number;
  shippingAmount?: number;
  discountAmount?: number;
}

export interface SegregatedOrderGroup {
  groupKey: string;
  companyCode: string;
  companyName: string;
  locationType: 'Store' | 'Warehouse';
  locationCode: string;
  locationName: string;
  channel: 'B2B' | 'B2C' | 'Both';
  items: CartItem[];
  totalItems: number;
  subTotal: number;
  assignedOrderId: string;
  shipVia?: string;
  deliveryPartner?: string;
  pickupLocationCode?: string;
  pickupLocationName?: string;
  tax?: number;
  otherTax?: number;
  shippingCost?: number;
  discount?: number;
  platformFee?: number;
  promoCode?: string;
}

export interface DeliveryPartner {
  sequence: number;
  accountId: string;
  companyCode: string;
  partnerName: string;
  channel: string;
  itemCategory: string;
  baseShippingRate: number;
  perItemShippingRate: number;
  freeShippingThreshold: number;
  estimatedDays: number;
  isDefault: boolean;
  isActive: boolean;
  dateCreated?: string;
  dateModified?: string;
  createdBy?: string;
}

export interface DeliveryPartnerInput {
  sequence?: number;
  companyCode: string;
  partnerName: string;
  channel?: string;
  itemCategory?: string;
  baseShippingRate?: number;
  perItemShippingRate?: number;
  freeShippingThreshold?: number;
  estimatedDays?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface ShippingCalculationResult {
  assignedPartnerName: string;
  assignedPartner?: string;
  totalShippingCost: number;
  perItemShippingCost: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
  estimatedDays: number;
}
