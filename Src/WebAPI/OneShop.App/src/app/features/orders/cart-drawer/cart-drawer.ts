import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { StoreService } from '../../store/services/store.service';
import { WarehouseService } from '../../warehouse/services/warehouse.service';
import { TaxService } from '../../tax/services/tax.service';
import { PromoService } from '../../discounts/services/promo.service';
import { AddressService } from '../../settings/services/address.service';
import { DeliveryPartnerService } from '../../delivery-partner/services/delivery-partner.service';
import { Access } from '../../../core/services/access';
import { PromoValidationResult } from '../../discounts/models/promo.model';
import { CartItem, SegregatedOrderGroup, ShippingCalculationResult } from '../models/order.model';
import { InvoiceData } from '../order-success/order-success';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cart-drawer.html'
})
export class CartDrawer implements OnInit {
  public cartService = inject(CartService);
  private orderService = inject(OrderService);
  private storeService = inject(StoreService);
  private warehouseService = inject(WarehouseService);
  private taxService = inject(TaxService);
  private promoService = inject(PromoService);
  private addressService = inject(AddressService);
  private deliveryPartnerService = inject(DeliveryPartnerService);
  public access = inject(Access);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Cart signals
  isOpen = this.cartService.isDrawerOpen;
  cartItems = this.cartService.cartItems;
  cartCount = this.cartService.cartCount;
  cartSubtotal = this.cartService.cartSubtotal;
  segregatedGroups = this.cartService.segregatedGroups;

  // Stores & Warehouses
  stores = this.storeService.stores;
  warehouses = this.warehouseService.warehouses;

  // Tax, Promo & Address Signals
  taxes = this.taxService.taxes;
  promoCodes = this.promoService.promoCodes;
  userAddresses = this.addressService.addresses;
  appliedPromo = signal<PromoValidationResult | null>(null);
  validatingPromo = signal<boolean>(false);

  // Persona
  isCustomer = computed(() => this.access.isCustomer());
  isVendor = computed(() => this.access.isVendor());

  // Fixed & Configurable Fees
  platformFee = signal<number>(0.50);
  otherTax = signal<number>(0.00);

  // Shipping dynamic calculation & automated assignment
  shippingCost = signal<number>(0);
  shippingCalculation = signal<ShippingCalculationResult | null>(null);
  assignedCarrierName = signal<string>('Store Assigned Courier');
  isCalculatingShipping = signal<boolean>(false);

  // Checkout Modal State
  showCheckoutModal = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Payment Gateway Modal State (OTP Simulation)
  showPaymentGatewayModal = signal<boolean>(false);
  paymentMode = signal<'CARD' | 'UPI' | 'NETBANKING'>('CARD');
  cardNumber = signal<string>('4532 •••• •••• 8892');
  cardExpiry = signal<string>('10/28');
  cardCvv = signal<string>('431');
  upiId = signal<string>('customer@okhdfcbank');
  generatedOtp = signal<string>('724915');
  enteredOtp = signal<string>('');
  otpError = signal<string | null>(null);
  isProcessingPayment = signal<boolean>(false);

  // Customer Checkout Form
  checkoutForm = this.fb.group({
    customerName: ['', [Validators.required, Validators.minLength(2)]],
    customerEmail: ['', [Validators.email]],
    customerPhone: [''],
    shippingAddress: ['', [Validators.required]],
    shippingState: [''],
    shipVia: ['Road Freight'],
    deliveryPartner: [''],
    pickupLocationCode: [''],
    pickupLocationName: [''],
    promoCode: [''],
    tax: [0],
    otherTax: [0],
    shippingCost: [0],
    discount: [0],
    notes: ['']
  });

  hasWarehouseGroup = computed(() => {
    return this.segregatedGroups().some(g => g.locationType === 'Warehouse');
  });

  hasStoreGroup = computed(() => {
    return this.segregatedGroups().some(g => g.locationType === 'Store');
  });

  // Free Shipping rule: strictly Order Subtotal >= 500
  isFreeShipping = computed(() => {
    return this.cartSubtotal() >= 500;
  });

  totalPayable = computed(() => {
    const sub = this.cartSubtotal();
    const tax = Number(this.checkoutForm.get('tax')?.value || 0);
    const othTax = Number(this.otherTax() || 0);
    const ship = this.isFreeShipping() ? 0 : this.shippingCost();
    const plat = Number(this.platformFee() || 0.50);
    const disc = Number(this.checkoutForm.get('discount')?.value || 0);
    const tot = sub + tax + othTax + ship + plat - disc;
    return tot > 0 ? Math.round(tot * 100) / 100 : 0;
  });

  constructor() {
    // Automatically keep shipping rate in sync whenever cart items / subtotal change
    effect(() => {
      const sub = this.cartSubtotal();
      const count = this.cartCount();
      if (sub > 0 && count > 0) {
        if (sub >= 500) {
          this.shippingCost.set(0);
          this.checkoutForm.patchValue({ shippingCost: 0 }, { emitEvent: false });
        } else {
          // Immediately apply positive shipping rate (Rule: Base $5.00 + $1.00/item or default partner rate)
          const partners = this.deliveryPartnerService.partners();
          const activePartner = partners.find(p => p.isActive && p.isDefault) || partners.find(p => p.isActive);
          const rate = activePartner
            ? Math.round((activePartner.baseShippingRate + (count * activePartner.perItemShippingRate)) * 100) / 100
            : Math.round((5.00 + (count * 1.00)) * 100) / 100;
          this.shippingCost.set(rate);
          this.checkoutForm.patchValue({ shippingCost: rate }, { emitEvent: false });
          if (activePartner && !this.checkoutForm.get('deliveryPartner')?.value) {
            this.assignedCarrierName.set(activePartner.partnerName);
          }
        }
      } else {
        this.shippingCost.set(0);
        this.checkoutForm.patchValue({ shippingCost: 0 }, { emitEvent: false });
      }
    }, { allowSignalWrites: true });
  }

  async ngOnInit() {
    this.taxService.loadTaxes();
    this.promoService.loadPromoCodes(true);
    this.addressService.loadAddresses();
    await this.deliveryPartnerService.list();

    // Auto populate customer credentials if available
    const userStr = localStorage.getItem('userDetails');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        this.checkoutForm.patchValue({
          customerName: u.name || u.userName || '',
          customerEmail: u.email || ''
        });
      } catch { }
    }

    // Immediately calculate initial shipping & tax
    await this.recalculateAllFinancials();
  }

  close() {
    this.cartService.closeDrawer();
  }

  formatGroupItems(group: SegregatedOrderGroup): string {
    return group.items.map(it => `${it.itemName} (${it.sizeCode}) x${it.quantity}`).join(', ');
  }

  updateQty(itemId: string, delta: number) {
    const item = this.cartItems().find(i => i.id === itemId);
    if (!item) return;
    const newQty = item.quantity + delta;
    this.cartService.updateQuantity(itemId, newQty);
    this.recalculateAllFinancials();
  }

  removeItem(itemId: string) {
    this.cartService.removeFromCart(itemId);
    this.recalculateAllFinancials();
  }

  clearAll() {
    if (confirm('Are you sure you want to empty your cart?')) {
      this.cartService.clearCart();
      this.appliedPromo.set(null);
      this.checkoutForm.patchValue({ discount: 0, tax: 0, shippingCost: 0 });
    }
  }

  // Get available fulfillment destinations for a specific item's company
  getAvailableDestinations(companyCode: string): { type: 'Store' | 'Warehouse'; code: string; name: string }[] {
    const res: { type: 'Store' | 'Warehouse'; code: string; name: string }[] = [];

    const compStores = this.stores().filter(s => s.companyCode.toUpperCase() === companyCode.toUpperCase());
    for (const s of compStores) {
      res.push({ type: 'Store', code: s.code, name: `${s.name} (${s.code})` });
    }

    const compWarehouses = this.warehouses().filter(w => w.companyCode.toUpperCase() === companyCode.toUpperCase());
    for (const w of compWarehouses) {
      res.push({ type: 'Warehouse', code: w.code, name: `${w.name} (${w.code})` });
    }

    return res;
  }

  onDestinationChange(item: CartItem, event: Event) {
    const select = event.target as HTMLSelectElement;
    const val = select.value; // formatted as "Type::Code::Name"
    if (!val) return;

    const [type, code, name] = val.split('::');
    this.cartService.updateItemLocation(item.id, type as 'Store' | 'Warehouse', code, name);
    this.recalculateAllFinancials();
  }

  onSelectSavedAddress(event: Event) {
    const addrId = (event.target as HTMLSelectElement).value;
    if (!addrId) return;

    const addr = this.userAddresses().find(a => a.addressId === addrId);
    if (addr) {
      const fullAddress = `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}, ${addr.state} - ${addr.postalCode}, ${addr.country}`;
      this.checkoutForm.patchValue({
        customerName: addr.contactName,
        customerPhone: addr.phone || '',
        shippingAddress: fullAddress,
        shippingState: addr.state
      });
      this.calculateStateTax(addr.state);
      this.calculateShippingRate();
    }
  }

  onStateInputBlur() {
    const state = this.checkoutForm.get('shippingState')?.value;
    if (state) {
      this.calculateStateTax(state);
      this.calculateShippingRate();
    }
  }

  calculateStateTax(stateNameOrCode?: string) {
    const state = (stateNameOrCode || this.checkoutForm.get('shippingState')?.value || '').trim().toLowerCase();
    if (!state) return;

    const match = this.taxes().find(t =>
      t.isActive && (
        t.stateCode.toLowerCase() === state ||
        t.stateName.toLowerCase() === state ||
        t.stateName.toLowerCase().includes(state)
      )
    );

    if (match) {
      const sub = this.cartSubtotal();
      const calculatedTax = Math.round((sub * match.taxRate / 100) * 100) / 100;
      this.checkoutForm.patchValue({ tax: calculatedTax });
    } else {
      // Default standard state tax (e.g. 5%)
      const sub = this.cartSubtotal();
      const calculatedTax = Math.round((sub * 0.05) * 100) / 100;
      this.checkoutForm.patchValue({ tax: calculatedTax });
    }
  }

  async calculateShippingRate() {
    const sub = this.cartSubtotal();
    const count = this.cartCount();
    if (sub <= 0 || count <= 0) {
      this.shippingCost.set(0);
      this.checkoutForm.patchValue({ shippingCost: 0 });
      return;
    }

    // Rule: Order value >= 500 => FREE SHIPPING ($0)
    if (sub >= 500) {
      this.shippingCost.set(0);
      this.checkoutForm.patchValue({ shippingCost: 0 });
      this.shippingCalculation.set({
        assignedPartnerName: this.assignedCarrierName() || 'Delhivery Express',
        totalShippingCost: 0,
        perItemShippingCost: 0,
        isFreeShipping: true,
        freeShippingThreshold: 500,
        estimatedDays: 2
      });
      return;
    }

    // If sub < 500, calculate positive shipping rate immediately from configured partner rule or default
    const partners = this.deliveryPartnerService.partners();
    const activePartner = partners.find(p => p.isActive && p.isDefault) || partners.find(p => p.isActive);
    const initialRate = activePartner
      ? Math.round((activePartner.baseShippingRate + (count * activePartner.perItemShippingRate)) * 100) / 100
      : Math.round((5.00 + (count * 1.00)) * 100) / 100;

    this.shippingCost.set(initialRate);
    this.checkoutForm.patchValue({ shippingCost: initialRate });
    if (activePartner && !this.checkoutForm.get('deliveryPartner')?.value) {
      this.assignedCarrierName.set(activePartner.partnerName);
    }

    this.isCalculatingShipping.set(true);
    const firstGroup = this.segregatedGroups()[0];
    const companyCode = firstGroup?.companyCode || 'HS';
    let channel = firstGroup?.channel || 'B2C';
    if (channel === 'Both') {
      channel = this.isVendor() ? 'B2B' : 'B2C';
    }

    try {
      const result = await this.deliveryPartnerService.calculateShipping(companyCode, channel, sub, count);
      if (result) {
        this.shippingCalculation.set(result);
        if (result.assignedPartnerName) {
          this.assignedCarrierName.set(result.assignedPartnerName);
        }
        const cost = (result.isFreeShipping && sub >= 500) ? 0 : (result.totalShippingCost > 0 ? result.totalShippingCost : initialRate);
        this.shippingCost.set(cost);
        this.checkoutForm.patchValue({ shippingCost: cost });
      }
    } catch (err) {
      console.warn('API shipping calculation skipped, applied rule rate:', initialRate);
    } finally {
      this.isCalculatingShipping.set(false);
    }
  }

  async applyPromoCode() {
    const code = this.checkoutForm.get('promoCode')?.value?.trim();
    if (!code) return;

    const sub = this.cartSubtotal();
    if (sub <= 0) return;

    this.validatingPromo.set(true);
    const res = await this.promoService.validatePromo(code, sub);
    this.validatingPromo.set(false);

    if (res.isValid) {
      this.appliedPromo.set(res);
      this.checkoutForm.patchValue({ discount: res.calculatedDiscount });
    } else {
      this.appliedPromo.set(null);
      this.checkoutForm.patchValue({ discount: 0 });
      this.errorMessage.set(res.message);
    }
  }

  removePromoCode() {
    this.appliedPromo.set(null);
    this.checkoutForm.patchValue({ promoCode: '', discount: 0 });
  }

  private async recalculateAllFinancials() {
    const state = this.checkoutForm.get('shippingState')?.value;
    if (state) {
      this.calculateStateTax(state);
    }
    await this.calculateShippingRate();

    const promo = this.appliedPromo();
    if (promo && promo.code) {
      const sub = this.cartSubtotal();
      if (sub <= 0) {
        this.removePromoCode();
      } else {
        const res = await this.promoService.validatePromo(promo.code, sub);
        if (res.isValid) {
          this.appliedPromo.set(res);
          this.checkoutForm.patchValue({ discount: res.calculatedDiscount });
        } else {
          this.removePromoCode();
        }
      }
    }
  }

  onPickupWarehouseChange(event: Event) {
    const code = (event.target as HTMLSelectElement).value;
    const wh = this.warehouses().find(w => w.code.toUpperCase() === code.toUpperCase());
    if (wh) {
      this.checkoutForm.patchValue({
        pickupLocationCode: wh.code,
        pickupLocationName: `${wh.name} (${wh.code})`
      });
    }
  }

  async openCheckout() {
    if (this.cartItems().length === 0) return;
    this.errorMessage.set(null);

    // Auto default pickup warehouse if store group exists
    if (this.hasStoreGroup() && this.warehouses().length > 0 && !this.checkoutForm.get('pickupLocationCode')?.value) {
      const firstWh = this.warehouses()[0];
      this.checkoutForm.patchValue({
        pickupLocationCode: firstWh.code,
        pickupLocationName: `${firstWh.name} (${firstWh.code})`
      });
    }

    await this.recalculateAllFinancials();
    this.showCheckoutModal.set(true);
  }

  closeCheckout() {
    this.showCheckoutModal.set(false);
  }

  // STEP 1: Proceed to Payment Gateway
  proceedToPayment() {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.errorMessage.set('Please fill in required delivery information (Customer Name & Shipping Address).');
      return;
    }

    this.errorMessage.set(null);
    this.otpError.set(null);
    this.enteredOtp.set('');

    // Generate random 6-digit OTP for simulation
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.generatedOtp.set(code);

    // Open Payment Gateway modal
    this.showPaymentGatewayModal.set(true);
  }

  closePaymentGateway() {
    this.showPaymentGatewayModal.set(false);
    this.enteredOtp.set('');
    this.otpError.set(null);
  }

  fillDemoOtp() {
    this.enteredOtp.set(this.generatedOtp());
    this.otpError.set(null);
  }

  // STEP 2: Verify OTP & Place Orders ONLY upon successful payment
  async verifyOtpAndCompletePayment() {
    const entered = this.enteredOtp().trim();
    if (!entered) {
      this.otpError.set('Please enter the 6-digit OTP sent to your phone/email.');
      return;
    }

    if (entered !== this.generatedOtp()) {
      this.otpError.set('Invalid OTP. Please check the 6-digit code and try again.');
      return;
    }

    this.isProcessingPayment.set(true);
    this.otpError.set(null);

    const raw = this.checkoutForm.getRawValue();
    const platFee = this.platformFee();
    const othTax = this.otherTax();
    const finalShipCost = this.isFreeShipping() ? 0 : this.shippingCost();

    const orderInputs = this.cartService.toOrderInputs({
      name: raw.customerName?.trim(),
      email: raw.customerEmail?.trim(),
      phone: raw.customerPhone?.trim(),
      address: raw.shippingAddress?.trim(),
      state: raw.shippingState?.trim(),
      notes: raw.notes?.trim(),
      promoCode: raw.promoCode?.trim() || undefined,
      discount: Number(raw.discount || 0),
      tax: Number(raw.tax || 0),
      otherTax: othTax,
      shippingCost: finalShipCost,
      platformFee: platFee,
      paymentStatus: 'Paid', // Reaches vendor ONLY AFTER payment is processed!
      shipVia: raw.shipVia?.trim() || 'Road Freight',
      deliveryPartner: this.assignedCarrierName(),
      pickupLocationCode: raw.pickupLocationCode?.trim() || undefined,
      pickupLocationName: raw.pickupLocationName?.trim() || undefined
    });

    try {
      // Place the orders to vendors with PaymentStatus = 'Paid'
      const res = await this.orderService.createBatch(orderInputs);

      if (res.success) {
        const orderIds = res.segregatedOrderIds || orderInputs.map(o => o.orderId || 'ORD');
        const groups = this.segregatedGroups();
        const firstGroup = groups[0];

        // Prepare full invoice payload for download
        const invoicePayload: InvoiceData = {
          orderIds: orderIds,
          orderDate: new Date().toISOString(),
          customerName: raw.customerName || 'Customer',
          customerEmail: raw.customerEmail || undefined,
          customerPhone: raw.customerPhone || undefined,
          shippingAddress: raw.shippingAddress || '',
          shippingState: raw.shippingState || undefined,
          paymentMethod: `Prepaid (${this.paymentMode()})`,
          paymentStatus: 'Paid',
          otpVerified: true,
          companyCode: firstGroup?.companyCode || 'HS',
          companyName: firstGroup?.companyName || firstGroup?.companyCode || 'OneShop Merchant',
          storeName: firstGroup?.locationName || firstGroup?.locationCode || 'Central Store',
          storeCode: firstGroup?.locationCode || 'STORE-01',
          items: this.cartItems().map(it => {
            const itCount = this.cartCount() || 1;
            const ratio = it.quantity / itCount;
            return {
              itemNumber: it.itemNumber,
              itemName: it.itemName,
              sizeCode: it.sizeCode,
              companyCode: it.companyCode,
              storeName: it.locationName || it.locationCode,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              tax: Math.round(Number(raw.tax || 0) * ratio * 100) / 100,
              shippingCost: Math.round(finalShipCost * ratio * 100) / 100,
              discount: Math.round(Number(raw.discount || 0) * ratio * 100) / 100,
              totalPrice: it.quantity * it.unitPrice
            };
          }),
          subTotal: this.cartSubtotal(),
          discount: Number(raw.discount || 0),
          tax: Number(raw.tax || 0),
          otherTax: othTax,
          shippingCost: finalShipCost,
          platformFee: platFee,
          totalAmount: this.totalPayable(),
          deliveryPartner: this.assignedCarrierName(),
          isFreeShipping: this.isFreeShipping()
        };

        // Clear Cart & Close Modals
        this.cartService.clearCart();
        this.showPaymentGatewayModal.set(false);
        this.showCheckoutModal.set(false);
        this.close();

        // Redirect to Order Placed Successful screen
        this.router.navigate(['/dashboard/orders/success'], {
          state: { invoiceData: invoicePayload }
        });
      } else {
        this.otpError.set(res.message || 'Payment verified but order creation failed.');
      }
    } catch (err: any) {
      this.otpError.set(err?.message || 'Error communicating with server during order placement.');
    } finally {
      this.isProcessingPayment.set(false);
    }
  }
}
