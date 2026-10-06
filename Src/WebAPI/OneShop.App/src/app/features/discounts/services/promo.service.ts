import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { PromoCode, PromoCodeInput, PromoValidationResult } from '../models/promo.model';

export const GET_PROMO_CODES = gql`
  query GetPromoCodes($activeOnly: Boolean) {
    promoCodes(activeOnly: $activeOnly) {
      sequence
      accountId
      code
      description
      discountType
      discountValue
      minOrderAmount
      maxDiscountAmount
      validFrom
      validUntil
      usageLimit
      timesUsed
      isActive
      dateCreated
      createdBy
    }
  }
`;

export const VALIDATE_PROMO_CODE = gql`
  query ValidatePromoCode($code: String!, $subTotal: Decimal!) {
    validatePromoCode(code: $code, subTotal: $subTotal) {
      success
      message
      validationDetails {
        isValid
        message
        code
        discountType
        discountValue
        calculatedDiscount
      }
    }
  }
`;

export const SAVE_PROMO_CODE = gql`
  mutation SavePromoCode($input: PromoCodeInput!) {
    savePromoCode(input: $input) {
      success
      message
      promoDetails {
        code
        discountType
        discountValue
        isActive
      }
    }
  }
`;

export const DELETE_PROMO_CODE = gql`
  mutation DeletePromoCode($code: String!) {
    deletePromoCode(code: $code) {
      success
      message
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class PromoService {
  private apollo = inject(Apollo);

  promoCodes = signal<PromoCode[]>([]);
  loading = signal<boolean>(false);

  constructor() {
    this.loadPromoCodes();
  }

  async loadPromoCodes(activeOnly?: boolean): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.apollo.query<{ promoCodes: PromoCode[] }>({
          query: GET_PROMO_CODES,
          variables: { activeOnly },
          fetchPolicy: 'network-only'
        })
      );
      this.promoCodes.set(res.data?.promoCodes || []);
    } catch (err) {
      console.error('Failed to load promo codes:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async validatePromo(code: string, subTotal: number): Promise<PromoValidationResult> {
    try {
      const res = await firstValueFrom(
        this.apollo.query<{ validatePromoCode: { success: boolean; message: string; validationDetails: PromoValidationResult } }>({
          query: VALIDATE_PROMO_CODE,
          variables: { code: code.trim().toUpperCase(), subTotal },
          fetchPolicy: 'network-only'
        })
      );
      return res.data?.validatePromoCode?.validationDetails || {
        isValid: false,
        message: 'Invalid promo response',
        calculatedDiscount: 0
      };
    } catch (err: any) {
      return {
        isValid: false,
        message: err.message || 'Error validating promo code',
        calculatedDiscount: 0
      };
    }
  }

  async savePromo(input: PromoCodeInput): Promise<{ success: boolean; message: string }> {
    try {
      const res = await firstValueFrom(
        this.apollo.mutate<{ savePromoCode: { success: boolean; message: string } }>({
          mutation: SAVE_PROMO_CODE,
          variables: { input }
        })
      );
      await this.loadPromoCodes();
      return res.data?.savePromoCode || { success: false, message: 'No response' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error saving promo code' };
    }
  }

  async deletePromo(code: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await firstValueFrom(
        this.apollo.mutate<{ deletePromoCode: { success: boolean; message: string } }>({
          mutation: DELETE_PROMO_CODE,
          variables: { code: code.trim().toUpperCase() }
        })
      );
      await this.loadPromoCodes();
      return res.data?.deletePromoCode || { success: false, message: 'No response' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error deleting promo code' };
    }
  }
}
