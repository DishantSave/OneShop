import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { DeliveryPartner, DeliveryPartnerInput, ShippingCalculationResult } from '../../orders/models/order.model';

export const GET_DELIVERY_PARTNERS = gql`
  query GetDeliveryPartners($companyCode: String, $channel: String) {
    deliveryPartners(companyCode: $companyCode, channel: $channel) {
      sequence
      accountId
      companyCode
      partnerName
      channel
      itemCategory
      baseShippingRate
      perItemShippingRate
      freeShippingThreshold
      estimatedDays
      isDefault
      isActive
      dateCreated
      dateModified
      createdBy
    }
  }
`;

export const CALCULATE_SHIPPING = gql`
  query CalculateShipping($companyCode: String!, $channel: String!, $subTotal: Decimal!, $totalItems: Int!) {
    calculateShipping(companyCode: $companyCode, channel: $channel, subTotal: $subTotal, totalItems: $totalItems) {
      assignedPartnerName
      totalShippingCost
      perItemShippingCost
      isFreeShipping
      freeShippingThreshold
      estimatedDays
    }
  }
`;

export const SAVE_DELIVERY_PARTNER = gql`
  mutation SaveDeliveryPartner($input: DeliveryPartnerInput!) {
    saveDeliveryPartner(input: $input) {
      success
      message
    }
  }
`;

export const DELETE_DELIVERY_PARTNER = gql`
  mutation DeleteDeliveryPartner($sequence: Long!) {
    deleteDeliveryPartner(sequence: $sequence) {
      success
      message
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class DeliveryPartnerService {
  private apollo = inject(Apollo);

  partners = signal<DeliveryPartner[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  async list(companyCode?: string, channel?: string): Promise<DeliveryPartner[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await firstValueFrom(
        this.apollo.query<{ deliveryPartners: DeliveryPartner[] }>({
          query: GET_DELIVERY_PARTNERS,
          variables: {
            companyCode: companyCode || null,
            channel: channel || null
          },
          fetchPolicy: 'network-only'
        })
      );

      const items = result?.data?.deliveryPartners ?? [];
      this.partners.set(items);
      return items;
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch delivery partners.';
      this.error.set(msg);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async calculateShipping(companyCode: string, channel: string, subTotal: number, totalItems: number): Promise<ShippingCalculationResult | null> {
    try {
      const result = await firstValueFrom(
        this.apollo.query<{ calculateShipping: ShippingCalculationResult }>({
          query: CALCULATE_SHIPPING,
          variables: {
            companyCode,
            channel,
            subTotal,
            totalItems
          },
          fetchPolicy: 'network-only'
        })
      );

      return result?.data?.calculateShipping ?? null;
    } catch (err) {
      console.warn('Error calculating dynamic shipping from server:', err);
      // Fallback calculation: free if >= 500, else base $5 + $1/item
      const isFree = subTotal >= 500;
      const count = Math.max(1, totalItems);
      return {
        assignedPartnerName: 'Delhivery Express',
        totalShippingCost: isFree ? 0 : Math.round((5.00 + (count * 1.00)) * 100) / 100,
        perItemShippingCost: isFree ? 0 : 1.00,
        isFreeShipping: isFree,
        freeShippingThreshold: 500.0,
        estimatedDays: 3
      };
    }
  }

  async save(input: DeliveryPartnerInput): Promise<{ success: boolean; message: string }> {
    try {
      const result = await firstValueFrom(
        this.apollo.mutate<{ saveDeliveryPartner: { success: boolean; message: string } }>({
          mutation: SAVE_DELIVERY_PARTNER,
          variables: { input }
        })
      );

      const payload = result?.data?.saveDeliveryPartner ?? { success: false, message: 'No response from server.' };
      if (payload.success) {
        await this.list(input.companyCode);
      }
      return payload;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to save delivery partner.' };
    }
  }

  async delete(sequence: number, companyCode?: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await firstValueFrom(
        this.apollo.mutate<{ deleteDeliveryPartner: { success: boolean; message: string } }>({
          mutation: DELETE_DELIVERY_PARTNER,
          variables: { sequence }
        })
      );

      const payload = result?.data?.deleteDeliveryPartner ?? { success: false, message: 'No response from server.' };
      if (payload.success) {
        this.partners.update(prev => prev.filter(p => p.sequence !== sequence));
      }
      return payload;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to delete delivery partner.' };
    }
  }
}
