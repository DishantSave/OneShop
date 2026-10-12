export interface OrderNotification {
  id: string;
  orderId: string;
  companyCode: string;
  companyName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  channel: string;
  locationName?: string;
  totalAmount: number;
  totalItems: number;
  status: string;
  paymentStatus: string;
  orderDate?: string;
  dateCreated?: string;
  createdBy?: string;
  isRead: boolean;
  title: string;
  message: string;
  timeAgo: string;
}
