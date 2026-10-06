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
  dateAdded?: string;
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
  shippingCost: number;
  discount: number;
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
}

export interface OrderItemInput {
  itemNumber: string;
  itemName: string;
  colourCode?: string;
  sizeCode: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
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
  shippingCost?: number;
  discount?: number;
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
  id: string; // unique cart key (e.g. itemNumber::sizeCode::companyCode)
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
  shippingCost?: number;
  discount?: number;
  promoCode?: string;
}

