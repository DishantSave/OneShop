import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CollectionService } from '../item/services/collection.service';
import { ItemService } from '../item/services/item.service';
import { CompanyService } from '../company/services/company.service';
import { StoreService } from '../store/services/store.service';
import { WarehouseService } from '../warehouse/services/warehouse.service';
import { CartService } from '../orders/services/cart.service';
import { Item, Collection } from '../item/models/item.model';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './dashboard-home.html'
})
export class DashboardHome implements OnInit {
  private collectionService = inject(CollectionService);
  private itemService = inject(ItemService);
  private companyService = inject(CompanyService);
  private storeService = inject(StoreService);
  private warehouseService = inject(WarehouseService);
  public cartService = inject(CartService);
  private toast = inject(MessageService);
  private router = inject(Router);

  // Data signals
  collections = this.collectionService.collections;
  items = this.itemService.items;
  companies = this.companyService.companies;
  stores = this.storeService.stores;
  warehouses = this.warehouseService.warehouses;
  loadingItems = this.itemService.loading;
  loadingCollections = this.collectionService.loading;

  // Filters
  selectedCatalogFilter = signal<string>('ALL');
  selectedCompanyFilter = signal<string>('ALL');
  selectedChannelFilter = signal<string>('ALL');
  searchQuery = signal<string>('');

  // Per-item selection states
  itemSelectedSizes = signal<Record<string, string>>({});
  itemSelectedDestinations = signal<Record<string, string>>({}); // formatted as "Type::Code::Name"
  itemSelectedQuantities = signal<Record<string, number>>({});

  // Computed filtered items
  filteredItems = computed(() => {
    let result = this.items();
    const catalogCode = this.selectedCatalogFilter();
    const comp = this.selectedCompanyFilter();
    const ch = this.selectedChannelFilter();
    const q = this.searchQuery().trim().toLowerCase();

    // Filter by Catalog / Collection
    if (catalogCode !== 'ALL') {
      const col = this.collections().find(c => c.code.toUpperCase() === catalogCode.toUpperCase());
      if (col && col.items && col.items.length > 0) {
        const itemNumbers = new Set(col.items.map(ci => ci.itemNumber.toUpperCase()));
        result = result.filter(i => itemNumbers.has(i.itemNumber.toUpperCase()));
      } else {
        result = [];
      }
    }

    // Filter by Company
    if (comp !== 'ALL') {
      result = result.filter(i => i.companyCode.toUpperCase() === comp.toUpperCase());
    }

    // Filter by Sales Channel
    if (ch !== 'ALL') {
      result = result.filter(i => i.salesChannel?.toUpperCase() === ch.toUpperCase() || i.salesChannel?.toUpperCase() === 'BOTH');
    }

    // Filter by Search Query
    if (q) {
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.itemNumber.toLowerCase().includes(q) ||
        (i.category && i.category.toLowerCase().includes(q)) ||
        i.companyCode.toLowerCase().includes(q)
      );
    }

    return result;
  });

  // KPI Stats
  totalCatalogsCount = computed(() => this.collections().length);
  totalItemsCount = computed(() => this.items().length);
  cartItemCount = this.cartService.cartCount;
  cartSubtotal = this.cartService.cartSubtotal;
  segregatedCount = computed(() => this.cartService.segregatedGroups().length);

  ngOnInit() {
    this.collectionService.list().catch(console.error);
    this.itemService.list().catch(console.error);
    this.companyService.list().catch(console.error);
    this.storeService.list().catch(console.error);
    this.warehouseService.list().catch(console.error);
  }

  selectCatalog(catalogCode: string) {
    this.selectedCatalogFilter.set(catalogCode);
  }

  getItemSizes(item: Item): string[] {
    if (!item.variants || item.variants.length === 0) return ['ALL'];
    const s = Array.from(new Set(item.variants.map(v => v.sizeCode.toUpperCase()))).filter(Boolean);
    return s.length > 0 ? s : ['ALL'];
  }

  getSelectedSize(item: Item): string {
    const cur = this.itemSelectedSizes()[item.itemNumber];
    if (cur) return cur;
    const sizes = this.getItemSizes(item);
    return sizes[0] || 'ALL';
  }

  selectSize(item: Item, size: string) {
    this.itemSelectedSizes.update(prev => ({ ...prev, [item.itemNumber]: size }));
  }

  getDestinationsForItem(item: Item): { type: 'Store' | 'Warehouse'; code: string; name: string }[] {
    const res: { type: 'Store' | 'Warehouse'; code: string; name: string }[] = [];

    const compStores = this.stores().filter(s => s.companyCode.toUpperCase() === item.companyCode.toUpperCase());
    for (const s of compStores) {
      res.push({ type: 'Store', code: s.code, name: `${s.name} (${s.code})` });
    }

    const compWarehouses = this.warehouses().filter(w => w.companyCode.toUpperCase() === item.companyCode.toUpperCase());
    for (const w of compWarehouses) {
      res.push({ type: 'Warehouse', code: w.code, name: `${w.name} (${w.code})` });
    }

    return res;
  }

  getSelectedDestination(item: Item): { type: 'Store' | 'Warehouse'; code: string; name: string } {
    const raw = this.itemSelectedDestinations()[item.itemNumber];
    if (raw) {
      const [type, code, name] = raw.split('::');
      return { type: (type as 'Store' | 'Warehouse') || 'Store', code, name };
    }

    const available = this.getDestinationsForItem(item);
    if (available.length > 0) {
      return available[0];
    }

    return { type: 'Store', code: 'DEFAULT', name: 'Default Store' };
  }

  onDestinationSelect(item: Item, event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      this.itemSelectedDestinations.update(prev => ({ ...prev, [item.itemNumber]: select.value }));
    }
  }

  getQuantity(item: Item): number {
    return this.itemSelectedQuantities()[item.itemNumber] || 1;
  }

  adjustQuantity(item: Item, delta: number) {
    const cur = this.getQuantity(item);
    const next = Math.max(1, cur + delta);
    this.itemSelectedQuantities.update(prev => ({ ...prev, [item.itemNumber]: next }));
  }

  getPrice(item: Item): number {
    return item.b2cPrice || item.b2bPrice || 0;
  }

  getItemImage(item: Item): string | null {
    if (!item.images) return null;
    const parts = item.images.split(',');
    return parts[0]?.trim() || null;
  }

  addToCart(item: Item) {
    const size = this.getSelectedSize(item);
    const dest = this.getSelectedDestination(item);
    const qty = this.getQuantity(item);
    const price = this.getPrice(item);

    this.cartService.addToCart({
      itemNumber: item.itemNumber,
      itemName: item.name,
      category: item.category,
      companyCode: item.companyCode,
      companyName: this.companies().find(c => c.code.toUpperCase() === item.companyCode.toUpperCase())?.name || item.companyCode,
      sizeCode: size,
      channel: (item.salesChannel as 'B2B' | 'B2C' | 'Both') || 'Both',
      unitPrice: price,
      b2cPrice: item.b2cPrice,
      b2bPrice: item.b2bPrice,
      b2bMinQuantity: item.b2bMinQuantity,
      quantity: qty,
      locationType: dest.type,
      locationCode: dest.code,
      locationName: dest.name
    });

    this.toast.add({
      severity: 'success',
      summary: 'Added to Cart',
      detail: `${qty}x ${item.name} (${size}) added. Fulfill via ${dest.type}: ${dest.name}.`,
      life: 3000
    });
  }

  goToOrders() {
    this.router.navigate(['/dashboard/orders']);
  }

  openCart() {
    this.cartService.openDrawer();
  }
}
