import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
import { PromoValidationResult } from '../../discounts/models/promo.model';
import { CartItem, SegregatedOrderGroup } from '../models/order.model';

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

  // Checkout Modal State
  showCheckoutModal = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  submissionSuccess = signal<boolean>(false);
  generatedOrderIds = signal<string[]>([]);
  errorMessage = signal<string | null>(null);

  // Customer Checkout Form
  checkoutForm = this.fb.group({
    customerName: ['', [Validators.required, Validators.minLength(2)]],
    customerEmail: ['', [Validators.email]],
    customerPhone: [''],
    shippingAddress: ['', [Validators.required]],
    shippingState: [''],
    shipVia: ['Road Freight'],
    deliveryPartner: ['Delhivery'],
    pickupLocationCode: [''],
    pickupLocationName: [''],
    promoCode: [''],
    tax: [0],
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

  totalPayable = computed(() => {
    const sub = this.cartSubtotal();
    const tax = Number(this.checkoutForm.get('tax')?.value || 0);
    const ship = Number(this.checkoutForm.get('shippingCost')?.value || 0);
    const disc = Number(this.checkoutForm.get('discount')?.value || 0);
    const tot = sub + tax + ship - disc;
    return tot > 0 ? tot : 0;
  });

  ngOnInit() {
    this.taxService.loadTaxes();
    this.promoService.loadPromoCodes(true);
    this.addressService.loadAddresses();
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
    this.recalculateTaxAndPromo();
  }

  removeItem(itemId: string) {
    this.cartService.removeFromCart(itemId);
    this.recalculateTaxAndPromo();
  }

  clearAll() {
    if (confirm('Are you sure you want to empty your cart?')) {
      this.cartService.clearCart();
      this.appliedPromo.set(null);
      this.checkoutForm.patchValue({ discount: 0, tax: 0 });
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
    }
  }

  onStateInputBlur() {
    const state = this.checkoutForm.get('shippingState')?.value;
    if (state) {
      this.calculateStateTax(state);
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

  private async recalculateTaxAndPromo() {
    const state = this.checkoutForm.get('shippingState')?.value;
    if (state) {
      this.calculateStateTax(state);
    }
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

  openCheckout() {
    if (this.cartItems().length === 0) return;
    this.errorMessage.set(null);
    this.submissionSuccess.set(false);
    this.generatedOrderIds.set([]);

    // Auto default pickup warehouse if store group exists
    if (this.hasStoreGroup() && this.warehouses().length > 0 && !this.checkoutForm.get('pickupLocationCode')?.value) {
      const firstWh = this.warehouses()[0];
      this.checkoutForm.patchValue({
        pickupLocationCode: firstWh.code,
        pickupLocationName: `${firstWh.name} (${firstWh.code})`
      });
    }

    this.showCheckoutModal.set(true);
  }

  closeCheckout() {
    this.showCheckoutModal.set(false);
  }

  async submitCheckout() {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const raw = this.checkoutForm.getRawValue();
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
      shippingCost: Number(raw.shippingCost || 0),
      shipVia: raw.shipVia?.trim() || 'Road Freight',
      deliveryPartner: raw.deliveryPartner?.trim() || 'Delhivery',
      pickupLocationCode: raw.pickupLocationCode?.trim() || undefined,
      pickupLocationName: raw.pickupLocationName?.trim() || undefined
    });

    if (orderInputs.length === 0) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    try {
      const res = await this.orderService.createBatch(orderInputs);

      if (res.success) {
        this.submissionSuccess.set(true);
        this.generatedOrderIds.set(res.segregatedOrderIds || orderInputs.map(o => o.orderId || 'ORD'));
        this.cartService.clearCart();
      } else {
        this.errorMessage.set(res.message || 'Failed to place orders.');
      }
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Unexpected error placing batch orders.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goToOrders() {
    this.closeCheckout();
    this.close();
    this.router.navigate(['/dashboard/orders']);
  }
}
