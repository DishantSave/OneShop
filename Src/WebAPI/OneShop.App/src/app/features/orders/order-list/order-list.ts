import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { OrderService } from '../services/order.service';
import { CompanyService } from '../../company/services/company.service';
import { StoreService } from '../../store/services/store.service';
import { WarehouseService } from '../../warehouse/services/warehouse.service';
import { ItemService } from '../../item/services/item.service';
import { TaxService } from '../../tax/services/tax.service';
import { PromoService } from '../../discounts/services/promo.service';
import { AddressService } from '../../settings/services/address.service';
import { PromoValidationResult } from '../../discounts/models/promo.model';
import { Order, OrderItem, OrderInput, OrderItemInput } from '../models/order.model';
import { Item } from '../../item/models/item.model';
import { Access } from '../../../core/services/access';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './order-list.html'
})
export class OrderList implements OnInit {
  private orderService = inject(OrderService);
  private companyService = inject(CompanyService);
  private storeService = inject(StoreService);
  private warehouseService = inject(WarehouseService);
  private itemService = inject(ItemService);
  private taxService = inject(TaxService);
  private promoService = inject(PromoService);
  private addressService = inject(AddressService);
  private toast = inject(MessageService);
  private confirmService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private access = inject(Access);

  // Data signals
  orders = this.orderService.orders;
  companies = this.companyService.companies;
  stores = this.storeService.stores;
  warehouses = this.warehouseService.warehouses;
  allItems = this.itemService.items;
  taxes = this.taxService.taxes;
  promoCodes = this.promoService.promoCodes;
  userAddresses = this.addressService.addresses;
  loading = this.orderService.loading;

  // Promo & Tax state
  appliedPromo = signal<PromoValidationResult | null>(null);
  validatingPromo = signal<boolean>(false);

  // Filters
  selectedCompanyFilter = signal<string>('ALL');
  selectedStatusFilter = signal<string>('ALL');
  selectedChannelFilter = signal<string>('ALL');
  searchQuery = signal<string>('');

  // Modals
  showCreateOrderModal = signal<boolean>(false);
  showDetailsModal = signal<boolean>(false);
  selectedOrderForDetails = signal<Order | null>(null);
  orderToDelete = signal<Order | null>(null);
  savingOrder = signal<boolean>(false);

  // Create Order Form State
  createOrderForm = this.fb.group({
    companyCode: ['', Validators.required],
    channel: ['Both', Validators.required],
    locationType: ['Store', Validators.required],
    locationCode: ['', Validators.required],
    customerName: [''],
    customerEmail: [''],
    customerPhone: [''],
    shippingAddress: [''],
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

  // Items added into the current manual order
  orderDraftItems = signal<OrderItemInput[]>([]);

  // Item Picker State for manual order
  selectedItemForDraft = signal<Item | null>(null);
  selectedSizeForDraft = signal<string>('ALL');
  itemQuantityForDraft = signal<number>(1);
  itemUnitPriceForDraft = signal<number>(0);

  // Available locations based on selected company in Create Order Modal
  availableLocationsForDraft = computed(() => {
    const compCode = this.createOrderForm.get('companyCode')?.value;
    const locType = this.createOrderForm.get('locationType')?.value;
    if (!compCode) return [];

    if (locType === 'Store') {
      return this.stores()
        .filter(s => s.companyCode.toUpperCase() === compCode.toUpperCase())
        .map(s => ({ code: s.code, name: s.name, type: 'Store' }));
    } else {
      return this.warehouses()
        .filter(w => w.companyCode.toUpperCase() === compCode.toUpperCase())
        .map(w => ({ code: w.code, name: w.name, type: 'Warehouse' }));
    }
  });

  // Available items for selected company in Create Order Modal
  availableItemsForDraft = computed(() => {
    const compCode = this.createOrderForm.get('companyCode')?.value;
    if (!compCode) return [];
    return this.allItems().filter(i => i.companyCode.toUpperCase() === compCode.toUpperCase());
  });

  // Filtered orders list
  filteredOrders = computed(() => {
    let list = this.orders();
    const comp = this.selectedCompanyFilter();
    const status = this.selectedStatusFilter();
    const channel = this.selectedChannelFilter();
    const q = this.searchQuery().trim().toLowerCase();

    if (comp !== 'ALL') {
      list = list.filter(o => o.companyCode.toUpperCase() === comp.toUpperCase());
    }
    if (status !== 'ALL') {
      list = list.filter(o => o.status.toUpperCase() === status.toUpperCase());
    }
    if (channel !== 'ALL') {
      list = list.filter(o => o.channel.toUpperCase() === channel.toUpperCase() || o.channel.toUpperCase() === 'BOTH');
    }
    if (q) {
      list = list.filter(o =>
        o.orderId.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.locationName && o.locationName.toLowerCase().includes(q)) ||
        o.companyCode.toLowerCase().includes(q) ||
        (o.items && o.items.some(i => i.itemNumber.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q)))
      );
    }
    return list;
  });

  // KPI Stats
  orderStats = computed(() => {
    const list = this.orders();
    const totalCount = list.length;
    const pendingCount = list.filter(o => o.status.toLowerCase() === 'pending').length;
    const processingCount = list.filter(o => ['confirmed', 'processing'].includes(o.status.toLowerCase())).length;
    const completedCount = list.filter(o => ['shipped', 'delivered'].includes(o.status.toLowerCase())).length;
    const totalVolume = list.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      totalCount,
      pendingCount,
      processingCount,
      completedCount,
      totalVolume
    };
  });

  // Order Draft calculations
  draftTotalUnits = computed(() => {
    return this.orderDraftItems().reduce((acc, it) => acc + it.quantity, 0);
  });

  draftSubtotal = computed(() => {
    return this.orderDraftItems().reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
  });

  draftTotal = computed(() => {
    const sub = this.draftSubtotal();
    const tax = Number(this.createOrderForm.get('tax')?.value || 0);
    const ship = Number(this.createOrderForm.get('shippingCost')?.value || 0);
    const disc = Number(this.createOrderForm.get('discount')?.value || 0);
    const tot = sub + tax + ship - disc;
    return tot > 0 ? tot : 0;
  });

  ngOnInit() {
    this.refreshData();
    this.taxService.loadTaxes();
    this.promoService.loadPromoCodes(true);
    this.addressService.loadAddresses();
  }

  refreshData() {
    this.orderService.list().catch(err => {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to fetch orders.' });
    });
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  openCreateOrderModal() {
    this.orderDraftItems.set([]);
    this.selectedItemForDraft.set(null);
    this.selectedSizeForDraft.set('ALL');
    this.itemQuantityForDraft.set(1);
    this.itemUnitPriceForDraft.set(0);
    this.appliedPromo.set(null);

    const defaultComp = this.companies()[0]?.code || '';

    this.createOrderForm.reset({
      companyCode: defaultComp,
      channel: 'B2C',
      locationType: 'Store',
      locationCode: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      shippingAddress: '',
      shippingState: '',
      shipVia: 'Road Freight',
      deliveryPartner: 'Delhivery',
      pickupLocationCode: '',
      pickupLocationName: '',
      promoCode: '',
      tax: 0,
      shippingCost: 0,
      discount: 0,
      notes: ''
    });

    this.onCompanyOrLocTypeChanged();
    this.showCreateOrderModal.set(true);
  }

  closeCreateOrderModal() {
    this.showCreateOrderModal.set(false);
  }

  onCompanyOrLocTypeChanged() {
    const locType = this.createOrderForm.get('locationType')?.value;
    const compCode = this.createOrderForm.get('companyCode')?.value;

    if (locType === 'Warehouse') {
      this.createOrderForm.patchValue({ channel: 'B2B', shipVia: 'Road Freight' });
    } else {
      this.createOrderForm.patchValue({ channel: 'B2C', deliveryPartner: 'Delhivery' });
      const compWhs = this.warehouses().filter(w => w.companyCode.toUpperCase() === compCode?.toUpperCase());
      if (compWhs.length > 0) {
        this.createOrderForm.patchValue({
          pickupLocationCode: compWhs[0].code,
          pickupLocationName: `${compWhs[0].name} (${compWhs[0].code})`
        });
      }
    }

    const locs = this.availableLocationsForDraft();
    if (locs.length > 0) {
      this.createOrderForm.get('locationCode')?.setValue(locs[0].code);
    } else {
      this.createOrderForm.get('locationCode')?.setValue('');
    }
    this.selectedItemForDraft.set(null);
  }

  onPickupWarehouseChanged(event: Event) {
    const code = (event.target as HTMLSelectElement).value;
    const wh = this.warehouses().find(w => w.code.toUpperCase() === code.toUpperCase());
    if (wh) {
      this.createOrderForm.patchValue({
        pickupLocationCode: wh.code,
        pickupLocationName: `${wh.name} (${wh.code})`
      });
    }
  }

  onSelectSavedAddress(event: Event) {
    const addrId = (event.target as HTMLSelectElement).value;
    if (!addrId) return;

    const addr = this.userAddresses().find(a => a.addressId === addrId);
    if (addr) {
      const fullAddress = `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}, ${addr.state} - ${addr.postalCode}, ${addr.country}`;
      this.createOrderForm.patchValue({
        customerName: addr.contactName,
        customerPhone: addr.phone || '',
        shippingAddress: fullAddress,
        shippingState: addr.state
      });
      this.calculateStateTax(addr.state);
    }
  }

  onStateInputBlur() {
    const state = this.createOrderForm.get('shippingState')?.value;
    if (state) {
      this.calculateStateTax(state);
    }
  }

  calculateStateTax(stateNameOrCode?: string) {
    const state = (stateNameOrCode || this.createOrderForm.get('shippingState')?.value || '').trim().toLowerCase();
    if (!state) return;

    const match = this.taxes().find(t =>
      t.isActive && (
        t.stateCode.toLowerCase() === state ||
        t.stateName.toLowerCase() === state ||
        t.stateName.toLowerCase().includes(state)
      )
    );

    if (match) {
      const sub = this.draftSubtotal();
      const calculatedTax = Math.round((sub * match.taxRate / 100) * 100) / 100;
      this.createOrderForm.patchValue({ tax: calculatedTax });
      this.toast.add({
        severity: 'info',
        summary: 'Tax Applied',
        detail: `${match.taxRate}% ${match.taxType} (₹${calculatedTax}) automatically applied for ${match.stateName}.`
      });
    }
  }

  async applyPromoCode() {
    const code = this.createOrderForm.get('promoCode')?.value?.trim();
    if (!code) {
      this.toast.add({ severity: 'warn', summary: 'Promo Code', detail: 'Please enter a promo code.' });
      return;
    }

    const sub = this.draftSubtotal();
    if (sub <= 0) {
      this.toast.add({ severity: 'warn', summary: 'Cart Empty', detail: 'Please add items to calculate discount.' });
      return;
    }

    this.validatingPromo.set(true);
    const res = await this.promoService.validatePromo(code, sub);
    this.validatingPromo.set(false);

    if (res.isValid) {
      this.appliedPromo.set(res);
      this.createOrderForm.patchValue({ discount: res.calculatedDiscount });
      this.toast.add({ severity: 'success', summary: 'Promo Applied', detail: res.message });
    } else {
      this.appliedPromo.set(null);
      this.createOrderForm.patchValue({ discount: 0 });
      this.toast.add({ severity: 'error', summary: 'Invalid Promo', detail: res.message });
    }
  }

  removePromoCode() {
    this.appliedPromo.set(null);
    this.createOrderForm.patchValue({ promoCode: '', discount: 0 });
    this.toast.add({ severity: 'info', summary: 'Promo Removed', detail: 'Promo discount cleared.' });
  }

  onSelectedItemChanged(itemNum: string) {
    const itm = this.availableItemsForDraft().find(i => i.itemNumber.toUpperCase() === itemNum.toUpperCase());
    if (!itm) {
      this.selectedItemForDraft.set(null);
      return;
    }
    this.selectedItemForDraft.set(itm);
    const sizes = this.getItemSizes(itm);
    this.selectedSizeForDraft.set(sizes[0] || 'ALL');

    const channel = this.createOrderForm.get('channel')?.value;
    const price = (channel === 'B2B' && itm.b2bPrice) ? itm.b2bPrice : (itm.b2cPrice || itm.b2bPrice || 0);
    this.itemUnitPriceForDraft.set(price);

    const minQty = (channel === 'B2B' && itm.b2bMinQuantity) ? itm.b2bMinQuantity : 1;
    this.itemQuantityForDraft.set(minQty);
  }

  getItemSizes(itm: Item): string[] {
    if (!itm.variants || itm.variants.length === 0) return ['ALL'];
    const s = Array.from(new Set(itm.variants.map(v => v.sizeCode.toUpperCase()))).filter(Boolean);
    return s.length > 0 ? s : ['ALL'];
  }

  addItemToDraft() {
    const itm = this.selectedItemForDraft();
    if (!itm) {
      this.toast.add({ severity: 'warn', summary: 'Select Product', detail: 'Please pick an item to add.' });
      return;
    }

    const qty = this.itemQuantityForDraft();
    if (qty <= 0) {
      this.toast.add({ severity: 'warn', summary: 'Invalid Quantity', detail: 'Quantity must be at least 1.' });
      return;
    }

    const price = this.itemUnitPriceForDraft();
    const size = this.selectedSizeForDraft() || 'ALL';

    const current = this.orderDraftItems();
    const existingIndex = current.findIndex(x => x.itemNumber.toUpperCase() === itm.itemNumber.toUpperCase() && x.sizeCode.toUpperCase() === size.toUpperCase());

    if (existingIndex > -1) {
      const updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + qty,
        unitPrice: price
      };
      this.orderDraftItems.set(updated);
    } else {
      this.orderDraftItems.set([
        ...current,
        {
          itemNumber: itm.itemNumber,
          itemName: itm.name,
          sizeCode: size,
          quantity: qty,
          unitPrice: price
        }
      ]);
    }

    this.toast.add({ severity: 'info', summary: 'Item Added', detail: `${itm.name} (${size}) added to order draft.` });

    // Auto-update tax if state was selected
    const state = this.createOrderForm.get('shippingState')?.value;
    if (state) {
      this.calculateStateTax(state);
    }
  }

  removeDraftItem(index: number) {
    this.orderDraftItems.update(list => list.filter((_, idx) => idx !== index));
    const state = this.createOrderForm.get('shippingState')?.value;
    if (state) {
      this.calculateStateTax(state);
    }
  }

  async saveNewOrder() {
    if (this.createOrderForm.invalid) {
      this.createOrderForm.markAllAsTouched();
      this.toast.add({ severity: 'warn', summary: 'Missing Fields', detail: 'Please fill in required fields (Company, Location).' });
      return;
    }

    const items = this.orderDraftItems();
    if (items.length === 0) {
      this.toast.add({ severity: 'warn', summary: 'No Items', detail: 'Please add at least one item to the order.' });
      return;
    }

    const raw = this.createOrderForm.getRawValue();

    const payload: OrderInput = {
      companyCode: raw.companyCode!.trim().toUpperCase(),
      channel: raw.channel || 'Both',
      locationType: raw.locationType || 'Store',
      locationCode: raw.locationCode!.trim().toUpperCase(),
      customerName: raw.customerName?.trim() || undefined,
      customerEmail: raw.customerEmail?.trim() || undefined,
      customerPhone: raw.customerPhone?.trim() || undefined,
      shippingAddress: raw.shippingAddress?.trim() || undefined,
      shippingState: raw.shippingState?.trim() || undefined,
      shipVia: raw.locationType === 'Warehouse' ? (raw.shipVia?.trim() || 'Road Freight') : undefined,
      deliveryPartner: raw.locationType === 'Store' ? (raw.deliveryPartner?.trim() || 'Delhivery') : undefined,
      pickupLocationCode: raw.locationType === 'Store' ? raw.pickupLocationCode?.trim() : undefined,
      pickupLocationName: raw.locationType === 'Store' ? raw.pickupLocationName?.trim() : undefined,
      promoCode: raw.promoCode?.trim() || undefined,
      tax: Number(raw.tax || 0),
      shippingCost: Number(raw.shippingCost || 0),
      discount: Number(raw.discount || 0),
      notes: raw.notes?.trim() || undefined,
      items: items
    };

    this.savingOrder.set(true);
    try {
      const res = await this.orderService.create(payload);
      if (res.success) {
        this.toast.add({ severity: 'success', summary: 'Order Created', detail: res.message });
        this.closeCreateOrderModal();
        await this.orderService.list();
      } else {
        this.toast.add({ severity: 'error', summary: 'Creation Failed', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to place order.' });
    } finally {
      this.savingOrder.set(false);
    }
  }

  openOrderDetails(order: Order) {
    this.selectedOrderForDetails.set(order);
    this.showDetailsModal.set(true);
  }

  closeOrderDetails() {
    this.showDetailsModal.set(false);
    this.selectedOrderForDetails.set(null);
  }

  async changeOrderStatus(order: Order, newStatus: string) {
    try {
      const res = await this.orderService.updateStatus(order.companyCode, order.orderId, newStatus);
      if (res.success) {
        this.toast.add({ severity: 'success', summary: 'Status Updated', detail: res.message });
        if (this.selectedOrderForDetails()?.orderId === order.orderId) {
          this.selectedOrderForDetails.update(o => o ? { ...o, status: newStatus } : null);
        }
      } else {
        this.toast.add({ severity: 'error', summary: 'Update Failed', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to update order status.' });
    }
  }

  confirmDeleteOrder(order: Order) {
    this.orderToDelete.set(order);
  }

  cancelDeleteOrder() {
    this.orderToDelete.set(null);
  }

  async executeDeleteOrder() {
    const o = this.orderToDelete();
    if (!o) return;

    try {
      const res = await this.orderService.delete(o.companyCode, o.orderId);
      if (res.success) {
        this.toast.add({ severity: 'success', summary: 'Deleted', detail: res.message });
        this.cancelDeleteOrder();
        if (this.selectedOrderForDetails()?.orderId === o.orderId) {
          this.closeOrderDetails();
        }
      } else {
        this.toast.add({ severity: 'error', summary: 'Delete Failed', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to delete order.' });
    }
  }

  getStatusBadgeColor(status: string): { bg: string; color: string; border: string } {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'processing':
        return { bg: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', border: 'rgba(99, 102, 241, 0.3)' };
      case 'shipped':
        return { bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' };
      case 'delivered':
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'cancelled':
        return { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'pending':
      default:
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
    }
  }

  isSegregatedSubOrder(orderId: string): boolean {
    return orderId.includes('.');
  }
}
