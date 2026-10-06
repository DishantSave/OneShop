export interface PromoCode {
  sequence?: number;
  accountId?: string;
  code: string;
  description?: string;
  discountType: 'Percentage' | 'FixedAmount';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  timesUsed: number;
  isActive: boolean;
  dateCreated?: string;
  createdBy?: string;
}

export interface PromoCodeInput {
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom?: string;
  validUntil?: string;
  usageLimit?: number;
  isActive: boolean;
}

export interface PromoValidationResult {
  isValid: boolean;
  message: string;
  code?: string;
  discountType?: string;
  discountValue?: number;
  calculatedDiscount: number;
}
