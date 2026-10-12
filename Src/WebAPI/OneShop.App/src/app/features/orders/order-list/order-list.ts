import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
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
import { Order, OrderItem, OrderInput, OrderItemInput, UpdateOrderDetailsInput, OrderAuditTrail } from '../models/order.model';
import { Item } from '../../item/models/item.model';
import { Access } from '../../../core/services/access';
import { Account } from '../../../core/services/account';
import { CartService } from '../services/cart.service';
import { NotificationService } from '../../notifications/services/notification.service';

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
  public cartService = inject(CartService);
  public notifService = inject(NotificationService);
  private toast = inject(MessageService);
  private confirmService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private access = inject(Access);
  private account = inject(Account);

  // User & Persona Detection
  currentUser = signal<any>(this.account.getUserDetails());

  isCustomer = computed(() => {
    const u = this.currentUser();
    if (!u) return false;
    return u.isCustomerAccount === true && !u.isSellerAccount;
  });

  isMaster = computed(() => {
    const u = this.currentUser();
    if (!u) return true; // Default to Master in admin / staff session
    if (this.isCustomer()) return false;
    if (u.isMainAccount === true || !!u.subscriptionType) return true;
    const dept = (u.department || '').toLowerCase();
    const desig = (u.designation || '').toLowerCase();
    return !dept.includes('support') && !desig.includes('support');
  });

  isSupport = computed(() => {
    const u = this.currentUser();
    if (!u) return true;
    if (this.isCustomer()) return false;
    return true; // Any non-customer portal staff has support privileges
  });

  userRoleLabel = computed(() => {
    if (this.isCustomer()) return 'Customer';
    if (this.isMaster()) return 'Master Admin';
    return 'Support Specialist';
  });

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
  customerStatusFilter = signal<'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED'>('ALL');
  searchQuery = signal<string>('');
  showMyOrdersOnly = signal<boolean>(false);

  // Modals & Details View
  showCreateOrderModal = signal<boolean>(false);
  showDetailsModal = signal<boolean>(false);
  selectedOrderForDetails = signal<Order | null>(null);
  orderToDelete = signal<Order | null>(null);
  savingOrder = signal<boolean>(false);

  // Shopify-Style Order Modification & Timeline State
  isEditMode = signal<boolean>(false);
  savingEdit = signal<boolean>(false);
  newTimelineComment = signal<string>('');
  submittingComment = signal<boolean>(false);

  // Edit Order Form (Limited, relevant fields)
  editOrderForm = this.fb.group({
    customerName: [''],
    customerEmail: [''],
    customerPhone: [''],
    shippingAddress: ['', Validators.required],
    shippingState: [''],
    shipVia: ['Road Freight'],
    deliveryPartner: ['Delhivery'],
    pickupLocationCode: [''],
    notes: ['']
  });

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

    // End-User scoping: Customers only see their own orders. Master/Support see all or toggled to My Orders
    if (this.isCustomer() || this.showMyOrdersOnly()) {
      const u = this.currentUser();
      const curEmail = (u?.email || '').trim().toLowerCase();
      const curUser = (u?.userName || '').trim().toLowerCase();
      const cleanUser = curUser.replace(/\s+/g, '');

      list = list.filter(o => {
        const oCreatedBy = (o.createdBy || '').trim().toLowerCase();
        const oCustEmail = (o.customerEmail || '').trim().toLowerCase();
        const oCustName = (o.customerName || '').trim().toLowerCase();
        const cleanCustName = oCustName.replace(/\s+/g, '');

        return (
          (curUser && oCreatedBy === curUser) ||
          (curEmail && (oCreatedBy === curEmail || oCustEmail === curEmail)) ||
          (cleanUser && cleanCustName && (cleanCustName.includes(cleanUser) || cleanUser.includes(cleanCustName)))
        );
      });
    }

    if (comp !== 'ALL') {
      list = list.filter(o => o.companyCode.toUpperCase() === comp.toUpperCase());
    }
    if (status !== 'ALL') {
      list = list.filter(o => o.status.toUpperCase() === status.toUpperCase());
    }
    if (channel !== 'ALL') {
      list = list.filter(o => o.channel.toUpperCase() === channel.toUpperCase() || o.channel.toUpperCase() === 'BOTH');
    }

    // Customer-specific tabs filter (ALL, ACTIVE, DELIVERED, CANCELLED)
    if (this.isCustomer()) {
      const custTab = this.customerStatusFilter();
      if (custTab === 'ACTIVE') {
        list = list.filter(o => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status.toLowerCase()));
      } else if (custTab === 'DELIVERED') {
        list = list.filter(o => o.status.toLowerCase() === 'delivered');
      } else if (custTab === 'CANCELLED') {
        list = list.filter(o => o.status.toLowerCase() === 'cancelled');
      }
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

    // Always sort recent at the top
    return [...list].sort((a, b) => {
      const timeB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
      const timeA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
      return timeB - timeA;
    });
  });

  // KPI Stats
  orderStats = computed(() => {
    const list = this.filteredOrders();
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
    const user = this.account.getUserDetails();
    this.currentUser.set(user);
    if (this.isCustomer()) {
      this.showMyOrdersOnly.set(true);
    } else {
      this.showMyOrdersOnly.set(false);
    }

    this.refreshData();
    this.taxService.loadTaxes();
    this.promoService.loadPromoCodes(true);
    this.addressService.loadAddresses();

    this.route.queryParams.subscribe(params => {
      const targetOrderId = params['orderId'];
      if (targetOrderId) {
        this.searchQuery.set(targetOrderId);
        setTimeout(() => {
          const match = this.orders().find(o => o.orderId.toLowerCase() === targetOrderId.toLowerCase());
          if (match) {
            this.openOrderDetails(match);
          }
        }, 600);
      }
    });
  }

  refreshData() {
    const u = this.currentUser();
    const createdByFilter = (this.isCustomer() || this.showMyOrdersOnly())
      ? (u?.userName || u?.email || undefined)
      : undefined;

    this.orderService.list(undefined, undefined, undefined, undefined, createdByFilter).catch(err => {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to fetch orders.' });
    });
  }

  toggleMyOrdersOnly(val?: boolean) {
    if (this.isCustomer()) return; // End users always restricted to own orders
    const newVal = val !== undefined ? val : !this.showMyOrdersOnly();
    this.showMyOrdersOnly.set(newVal);
    this.refreshData();
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  openCreateOrderModal() {
    if (this.isCustomer()) {
      this.toast.add({
        severity: 'info',
        summary: 'Order via Catalog & Cart',
        detail: 'Customers can place orders by browsing the Catalog and checking out via Cart.',
        life: 4000
      });
      this.router.navigate(['/dashboard']);
      return;
    }

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

  async openOrderDetails(order: Order) {
    this.selectedOrderForDetails.set(order);
    this.isEditMode.set(false);
    this.newTimelineComment.set('');
    this.populateEditForm(order);
    this.showDetailsModal.set(true);

    // Asynchronously fetch complete order details with fresh audit trail
    try {
      const fullOrder = await this.orderService.getById(order.companyCode, order.orderId);
      if (fullOrder) {
        this.selectedOrderForDetails.set(fullOrder);
        this.populateEditForm(fullOrder);
      }
    } catch (err) {
      console.error('Error fetching complete order details:', err);
    }
  }

  closeOrderDetails() {
    this.showDetailsModal.set(false);
    this.selectedOrderForDetails.set(null);
    this.isEditMode.set(false);
  }

  populateEditForm(order: Order) {
    this.editOrderForm.reset({
      customerName: order.customerName || '',
      customerEmail: order.customerEmail || '',
      customerPhone: order.customerPhone || '',
      shippingAddress: order.shippingAddress || '',
      shippingState: order.shippingState || '',
      shipVia: order.shipVia || 'Road Freight',
      deliveryPartner: order.deliveryPartner || 'Delhivery',
      pickupLocationCode: order.pickupLocationCode || '',
      notes: order.notes || ''
    });
  }

  isOrderLocked(order: Order | null): boolean {
    if (!order) return true;
    const s = (order.status || '').toLowerCase();
    return s === 'shipped' || s === 'delivered' || s === 'cancelled';
  }

  canUserEditOrder(order: Order | null): boolean {
    if (!order) return false;
    if (this.isOrderLocked(order)) return false;
    return !this.isCustomer();
  }

  canCustomerCancelOrder(order: Order | null): boolean {
    if (!order || !order.status) return false;
    const s = order.status.trim().toLowerCase();
    return !['shipped', 'delivered', 'cancelled'].includes(s);
  }

  async cancelOrderAsCustomer(order: Order) {
    if (!order) return;
    if (!this.canCustomerCancelOrder(order)) {
      this.toast.add({
        severity: 'warn',
        summary: 'Cannot Cancel',
        detail: `Orders marked as ${order.status} cannot be cancelled.`
      });
      return;
    }

    this.confirmService.confirm({
      message: `Are you sure you want to cancel Order #${order.orderId}?`,
      header: 'Cancel Order Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const res = await this.orderService.updateStatus(order.companyCode, order.orderId, 'Cancelled', 'Customer');
          if (res.success) {
            this.toast.add({
              severity: 'success',
              summary: 'Order Cancelled',
              detail: `Order #${order.orderId} has been successfully cancelled.`
            });
            this.refreshData();
            if (this.selectedOrderForDetails()?.orderId === order.orderId) {
              this.selectedOrderForDetails.update(cur => cur ? { ...cur, status: 'Cancelled' } : null);
            }
          } else {
            this.toast.add({ severity: 'error', summary: 'Cancellation Failed', detail: res.message });
          }
        } catch (err: any) {
          this.toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to cancel order.' });
        }
      }
    });
  }

  viewOrderInvoice(order: Order) {
    if (!order) return;
    this.closeOrderDetails();
    this.router.navigate(['/dashboard/orders/success'], {
      queryParams: {
        orderId: order.orderId,
        companyCode: order.companyCode
      }
    });
  }

  async openEditOrder(order: Order) {
    if (this.isOrderLocked(order)) {
      this.toast.add({
        severity: 'warn',
        summary: 'Order Locked',
        detail: `Orders marked as ${order.status} cannot be modified.`
      });
      return;
    }
    await this.openOrderDetails(order);
    this.isEditMode.set(true);
  }

  toggleEditMode() {
    const o = this.selectedOrderForDetails();
    if (!o) return;

    if (this.isEditMode()) {
      this.isEditMode.set(false);
      this.populateEditForm(o);
    } else {
      if (this.isOrderLocked(o)) {
        this.toast.add({
          severity: 'warn',
          summary: 'Order Locked',
          detail: `Orders marked as ${o.status} cannot be modified.`
        });
        return;
      }
      if (!this.canUserEditOrder(o)) {
        this.toast.add({
          severity: 'warn',
          summary: 'Access Restricted',
          detail: 'Only Support Specialists and Master Admins are authorized to modify orders.'
        });
        return;
      }
      this.populateEditForm(o);
      this.isEditMode.set(true);
    }
  }

  onSelectSavedAddressForEdit(event: Event) {
    const addrId = (event.target as HTMLSelectElement).value;
    if (!addrId) return;

    const addr = this.userAddresses().find(a => a.addressId === addrId);
    if (addr) {
      const fullAddress = `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}, ${addr.state} - ${addr.postalCode}, ${addr.country}`;
      this.editOrderForm.patchValue({
        customerName: addr.contactName,
        customerPhone: addr.phone || '',
        shippingAddress: fullAddress,
        shippingState: addr.state
      });
    }
  }

  async saveEditedDetails() {
    const order = this.selectedOrderForDetails();
    if (!order) return;

    if (this.isOrderLocked(order)) {
      this.toast.add({
        severity: 'error',
        summary: 'Order Locked',
        detail: `Cannot modify order because its status is ${order.status}.`
      });
      return;
    }

    if (!this.canUserEditOrder(order)) {
      this.toast.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'You do not have permission to modify this order.'
      });
      return;
    }

    if (this.editOrderForm.invalid) {
      this.editOrderForm.markAllAsTouched();
      this.toast.add({
        severity: 'warn',
        summary: 'Required Fields Missing',
        detail: 'Please provide a valid shipping address.'
      });
      return;
    }

    const raw = this.editOrderForm.getRawValue();
    const pickupWh = this.warehouses().find(w => w.code.toUpperCase() === (raw.pickupLocationCode || '').toUpperCase());

    const input: UpdateOrderDetailsInput = {
      companyCode: order.companyCode,
      orderId: order.orderId,
      customerName: raw.customerName?.trim() || undefined,
      customerEmail: raw.customerEmail?.trim() || undefined,
      customerPhone: raw.customerPhone?.trim() || undefined,
      shippingAddress: raw.shippingAddress?.trim() || undefined,
      shippingState: raw.shippingState?.trim() || undefined,
      shipVia: order.locationType === 'Warehouse' ? (raw.shipVia?.trim() || undefined) : undefined,
      deliveryPartner: order.locationType === 'Store' ? (raw.deliveryPartner?.trim() || undefined) : undefined,
      pickupLocationCode: order.locationType === 'Store' ? (raw.pickupLocationCode?.trim() || undefined) : undefined,
      pickupLocationName: order.locationType === 'Store' ? (pickupWh ? `${pickupWh.name} (${pickupWh.code})` : undefined) : undefined,
      notes: raw.notes?.trim() || undefined,
      userRole: this.userRoleLabel()
    };

    this.savingEdit.set(true);
    try {
      const res = await this.orderService.updateDetails(input);
      if (res.success) {
        this.toast.add({ severity: 'success', summary: 'Order Updated', detail: res.message });
        this.isEditMode.set(false);

        // Fetch refreshed order with updated fields and fresh audit trail records
        const fresh = await this.orderService.getById(order.companyCode, order.orderId);
        if (fresh) {
          this.selectedOrderForDetails.set(fresh);
          this.populateEditForm(fresh);
        }
        await this.refreshData();
      } else {
        this.toast.add({ severity: 'error', summary: 'Update Failed', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to update order details.' });
    } finally {
      this.savingEdit.set(false);
    }
  }

  async postTimelineComment() {
    const order = this.selectedOrderForDetails();
    if (!order) return;

    const comment = this.newTimelineComment().trim();
    if (!comment) {
      this.toast.add({ severity: 'warn', summary: 'Empty Note', detail: 'Please enter a note or comment to post.' });
      return;
    }

    this.submittingComment.set(true);
    try {
      const res = await this.orderService.addTimelineComment({
        companyCode: order.companyCode,
        orderId: order.orderId,
        comment: comment,
        userRole: this.userRoleLabel()
      });

      if (res.success) {
        this.toast.add({ severity: 'success', summary: 'Note Added', detail: 'Timeline event recorded.' });
        this.newTimelineComment.set('');

        const fresh = await this.orderService.getById(order.companyCode, order.orderId);
        if (fresh) {
          this.selectedOrderForDetails.set(fresh);
        }
      } else {
        this.toast.add({ severity: 'error', summary: 'Failed to Post', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to post timeline comment.' });
    } finally {
      this.submittingComment.set(false);
    }
  }

  async changeOrderStatus(order: Order, newStatus: string) {
    if (!order || !newStatus) return;
    if ((order.status || '').toLowerCase() === newStatus.toLowerCase()) return;

    if (this.isOrderLocked(order)) {
      this.toast.add({
        severity: 'warn',
        summary: 'Order Locked',
        detail: `Cannot change status because order is permanently locked as ${order.status}.`
      });
      return;
    }

    try {
      const res = await this.orderService.updateStatus(order.companyCode, order.orderId, newStatus, this.userRoleLabel());
      if (res.success) {
        this.toast.add({ severity: 'success', summary: 'Status Updated', detail: `Order ${order.orderId} moved to ${newStatus}.` });

        // Update local list signal immediately so master screen reflects change
        this.orders.update(prev =>
          prev.map(o => o.orderId === order.orderId && o.companyCode === order.companyCode ? { ...o, status: newStatus } : o)
        );

        const fresh = await this.orderService.getById(order.companyCode, order.orderId);
        if (fresh && this.selectedOrderForDetails()?.orderId === order.orderId) {
          this.selectedOrderForDetails.set(fresh);
          this.populateEditForm(fresh);
        }
      } else {
        this.toast.add({ severity: 'error', summary: 'Update Failed', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to update order status.' });
    }
  }

  getAuditActionBadge(actionType: string): { bg: string; color: string; border: string; icon: string; label: string } {
    switch ((actionType || '').toLowerCase()) {
      case 'create':
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)', icon: 'pi pi-check-circle', label: 'Order Created' };
      case 'statuschange':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)', icon: 'pi pi-sync', label: 'Status Change' };
      case 'update':
        return { bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)', icon: 'pi pi-pencil', label: 'Detail Modified' };
      case 'comment':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)', icon: 'pi pi-comment', label: 'Support Note' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.12)', color: '#6b7280', border: 'rgba(107, 114, 128, 0.3)', icon: 'pi pi-info-circle', label: 'Event' };
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
    switch ((status || '').toLowerCase()) {
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
    return (orderId || '').includes('.');
  }

  // --- Customer Amazon-Style Orders Dashboard Helpers ---

  setCustomerStatusFilter(filter: 'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED') {
    this.customerStatusFilter.set(filter);
  }

  getItemImage(itemNumber: string): string | null {
    if (!itemNumber) return null;
    const it = this.allItems().find(i => i.itemNumber.toUpperCase() === itemNumber.toUpperCase());
    if (!it || !it.images) return null;
    const parts = it.images.split(',');
    return parts[0]?.trim() || null;
  }

  getEstimatedArrivalInfo(order: Order): { label: string; dateText: string; isProcessing: boolean; icon: string; color: string } {
    const s = (order.status || '').toLowerCase();
    if (s === 'delivered') {
      const dateStr = order.orderDate ? new Date(order.orderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Delivered';
      return {
        label: 'Delivered',
        dateText: `Delivered on ${dateStr}`,
        isProcessing: false,
        icon: 'pi pi-check-circle',
        color: '#10b981'
      };
    }
    if (s === 'cancelled') {
      return {
        label: 'Cancelled',
        dateText: 'Order Cancelled',
        isProcessing: false,
        icon: 'pi pi-times-circle',
        color: '#ef4444'
      };
    }
    if (s === 'shipped') {
      const baseDate = order.orderDate ? new Date(order.orderDate) : new Date();
      const estDate = new Date(baseDate);
      estDate.setDate(estDate.getDate() + 4);
      const estStr = estDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const partner = order.deliveryPartner || order.shipVia || 'Express Courier';
      return {
        label: 'Shipped',
        dateText: `Estimated Delivery: ${estStr} (Dispatched via ${partner})`,
        isProcessing: false,
        icon: 'pi pi-truck',
        color: '#05517e'
      };
    }
    // Pending, Confirmed, Processing (initial state before partner updates)
    return {
      label: 'Processing',
      dateText: 'Processing (Estimated Delivery Pending Partner Dispatch)',
      isProcessing: true,
      icon: 'pi pi-clock',
      color: '#f59e0b'
    };
  }

  downloadOrderInvoice(order: Order) {
    if (!order) return;
    this.router.navigate(['/dashboard/orders/success'], {
      queryParams: {
        orderId: order.orderId,
        companyCode: order.companyCode,
        download: '1'
      }
    });
  }

  buyAgain(item: OrderItem, order: Order) {
    const price = item.unitPrice || 0;
    this.cartService.addToCart({
      itemNumber: item.itemNumber,
      itemName: item.itemName,
      category: (item as any).category || 'Retail',
      companyCode: order.companyCode,
      companyName: order.companyName || order.companyCode,
      sizeCode: item.sizeCode || 'ALL',
      channel: 'B2C',
      unitPrice: price,
      b2cPrice: price,
      quantity: 1,
      locationType: (order.locationType as 'Store' | 'Warehouse') || 'Store',
      locationCode: order.locationCode,
      locationName: order.locationName || order.locationCode
    });
    this.toast.add({
      severity: 'success',
      summary: 'Added to Cart',
      detail: `${item.itemName} (${item.sizeCode || 'Std'}) added to your cart!`,
      life: 3000
    });
    this.cartService.openDrawer();
  }

  // Recommended Products for Customers
  suggestedProducts = computed(() => {
    const list = this.allItems();
    if (!list || list.length === 0) return [];
    const b2c = list.filter(i => !i.salesChannel || i.salesChannel.toUpperCase() === 'B2C' || i.salesChannel.toUpperCase() === 'BOTH');
    return (b2c.length > 0 ? b2c : list).slice(0, 6);
  });

  addSuggestedToCart(item: Item) {
    const defaultSize = item.variants && item.variants.length > 0 ? item.variants[0].sizeCode : 'ALL';
    const price = item.b2cPrice || item.b2bPrice || 0;
    this.cartService.addToCart({
      itemNumber: item.itemNumber,
      itemName: item.name,
      category: item.category,
      companyCode: item.companyCode,
      companyName: item.companyCode,
      sizeCode: defaultSize,
      channel: (item.salesChannel as 'B2B' | 'B2C' | 'Both') || 'Both',
      unitPrice: price,
      b2cPrice: item.b2cPrice,
      b2bPrice: item.b2bPrice,
      quantity: 1,
      locationType: 'Store',
      locationCode: 'DEFAULT',
      locationName: 'Online Store'
    });
    this.toast.add({
      severity: 'success',
      summary: 'Added to Cart',
      detail: `${item.name} added to your cart!`,
      life: 3000
    });
    this.cartService.openDrawer();
  }

  // Embedded Notifications / Order Alerts helpers
  dismissAlert(orderId: string, event?: Event) {
    if (event) event.stopPropagation();
    this.notifService.dismissNotification(orderId);
  }

  markAlertRead(orderId: string, event?: Event) {
    if (event) event.stopPropagation();
    this.notifService.markAsRead(orderId);
  }

  markAllAlertsRead() {
    this.notifService.markAllAsRead();
  }
}
