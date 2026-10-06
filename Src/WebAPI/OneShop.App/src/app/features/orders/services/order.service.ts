import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { Order, OrderInput, BatchOrderInput } from '../models/order.model';

export const GET_ORDERS = gql`
  query GetOrders($companyCode: String, $status: String, $locationCode: String, $channel: String) {
    orders(companyCode: $companyCode, status: $status, locationCode: $locationCode, channel: $channel) {
      sequence
      accountId
      companyCode
      companyName
      orderId
      parentOrderId
      channel
      locationType
      locationCode
      locationName
      status
      paymentStatus
      customerName
      customerEmail
      customerPhone
      shippingAddress
      totalItems
      subTotal
      tax
      shippingCost
      discount
      totalAmount
      notes
      orderDate
      dateCreated
      createdBy
      shipVia
      deliveryPartner
      pickupLocationCode
      pickupLocationName
      shippingState
      promoCode
      items {
        sequence
        accountId
        companyCode
        orderId
        itemNumber
        itemName
        colourCode
        sizeCode
        sku
        quantity
        unitPrice
        totalPrice
        dateAdded
      }
    }
  }
`;

export const GET_ORDER_BY_ID = gql`
  query GetOrderById($companyCode: String!, $orderId: String!) {
    orderById(companyCode: $companyCode, orderId: $orderId) {
      sequence
      accountId
      companyCode
      companyName
      orderId
      parentOrderId
      channel
      locationType
      locationCode
      locationName
      status
      paymentStatus
      customerName
      customerEmail
      customerPhone
      shippingAddress
      totalItems
      subTotal
      tax
      shippingCost
      discount
      totalAmount
      notes
      orderDate
      dateCreated
      createdBy
      shipVia
      deliveryPartner
      pickupLocationCode
      pickupLocationName
      shippingState
      promoCode
      items {
        sequence
        accountId
        companyCode
        orderId
        itemNumber
        itemName
        colourCode
        sizeCode
        sku
        quantity
        unitPrice
        totalPrice
        dateAdded
      }
    }
  }
`;

export const CREATE_ORDER = gql`
  mutation CreateOrder($input: OrderInput!) {
    createOrder(input: $input) {
      success
      message
      segregatedOrderIds
    }
  }
`;

export const CREATE_BATCH_ORDERS = gql`
  mutation CreateBatchOrders($input: BatchOrderInput!) {
    createBatchOrders(input: $input) {
      success
      message
      segregatedOrderIds
    }
  }
`;

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($companyCode: String!, $orderId: String!, $status: String!) {
    updateOrderStatus(companyCode: $companyCode, orderId: $orderId, status: $status) {
      success
      message
    }
  }
`;

export const DELETE_ORDER = gql`
  mutation DeleteOrder($companyCode: String!, $orderId: String!) {
    deleteOrder(companyCode: $companyCode, orderId: $orderId) {
      success
      message
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apollo = inject(Apollo);

  orders = signal<Order[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  async list(companyCode?: string, status?: string, locationCode?: string, channel?: string): Promise<Order[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await firstValueFrom(
        this.apollo.query<{ orders: Order[] }>({
          query: GET_ORDERS,
          variables: {
            companyCode: companyCode || null,
            status: status || null,
            locationCode: locationCode || null,
            channel: channel || null
          },
          fetchPolicy: 'network-only'
        })
      );

      const items = result?.data?.orders ?? [];
      this.orders.set(items);
      return items;
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch orders.';
      this.error.set(msg);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async getById(companyCode: string, orderId: string): Promise<Order | null> {
    const result = await firstValueFrom(
      this.apollo.query<{ orderById: Order | null }>({
        query: GET_ORDER_BY_ID,
        variables: { companyCode, orderId },
        fetchPolicy: 'network-only'
      })
    );

    return result?.data?.orderById ?? null;
  }

  async create(input: OrderInput): Promise<{ success: boolean; message: string; segregatedOrderIds?: string[] }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ createOrder: { success: boolean; message: string; segregatedOrderIds?: string[] } }>({
        mutation: CREATE_ORDER,
        variables: { input }
      })
    );

    const payload = result?.data?.createOrder ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      await this.list(input.companyCode);
    }
    return payload;
  }

  async createBatch(orders: OrderInput[]): Promise<{ success: boolean; message: string; segregatedOrderIds?: string[] }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ createBatchOrders: { success: boolean; message: string; segregatedOrderIds?: string[] } }>({
        mutation: CREATE_BATCH_ORDERS,
        variables: { input: { orders } }
      })
    );

    const payload = result?.data?.createBatchOrders ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      await this.list();
    }
    return payload;
  }

  async updateStatus(companyCode: string, orderId: string, status: string): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ updateOrderStatus: { success: boolean; message: string } }>({
        mutation: UPDATE_ORDER_STATUS,
        variables: { companyCode, orderId, status }
      })
    );

    const payload = result?.data?.updateOrderStatus ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      this.orders.update(prev =>
        prev.map(o => o.orderId === orderId && o.companyCode === companyCode ? { ...o, status } : o)
      );
    }
    return payload;
  }

  async delete(companyCode: string, orderId: string): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ deleteOrder: { success: boolean; message: string } }>({
        mutation: DELETE_ORDER,
        variables: { companyCode, orderId }
      })
    );

    const payload = result?.data?.deleteOrder ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      this.orders.update(prev => prev.filter(o => !(o.orderId === orderId && o.companyCode === companyCode)));
    }
    return payload;
  }
}
