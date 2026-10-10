import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ItemService } from '../services/item.service';
import { CollectionService } from '../services/collection.service';
import { CompanyService } from '../../company/services/company.service';
import { Item, Collection, CollectionInput } from '../models/item.model';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './item-list.html'
})
export class ItemList implements OnInit {
  private itemService = inject(ItemService);
  private collectionService = inject(CollectionService);
  private companyService = inject(CompanyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(MessageService);
  private fb = inject(FormBuilder);

  loading = this.itemService.loading;
  items = this.itemService.items;
  collections = this.collectionService.collections;
  companies = this.companyService.companies;

  activeTab = signal<'items' | 'collections'>('items');
  searchTerm = signal('');
  selectedCompanyCode = signal<string>('ALL');
  channelFilter = signal<'ALL' | 'B2C' | 'B2B' | 'Both'>('ALL');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  selectedCollectionFilter = signal<string>('ALL');

  itemToDelete = signal<Item | null>(null);
  deleteInputText = signal('');
  deleting = signal(false);

  selectedItemForVariants = signal<Item | null>(null);

  // Collection modal state
  showCollectionModal = signal(false);
  collectionToEdit = signal<Collection | null>(null);
  collectionToDelete = signal<Collection | null>(null);
  savingCollection = signal(false);

  // Size-level Items selection inside Collection Create/Edit modal: array of `${itemNumber}::${sizeCode}`
  selectedItemSizesInCollection = signal<string[]>([]);
  itemSearchInCollectionModal = signal<string>('');
  channelFilterInCollectionModal = signal<'ALL' | 'B2C' | 'B2B' | 'Both'>('ALL');

  // Quick Manage Items Modal state (from collection cards): array of `${itemNumber}::${sizeCode}`
  showManageItemsModal = signal<boolean>(false);
  targetCollectionForManageItems = signal<Collection | null>(null);
  manageItemSizesSelection = signal<string[]>([]);
  savingManageItems = signal<boolean>(false);
  manageItemsSearch = signal<string>('');

  collectionForm = this.fb.group({
    companyCode: ['', Validators.required],
    code: ['', [Validators.required, Validators.maxLength(30)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    season: [''],
    channel: ['Both', Validators.required],
    bannerImage: [''],
    isActive: [true]
  });

  permissions = computed(() => {
    const userStr = localStorage.getItem('userDetails');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.isCustomerAccount && !u.isSellerAccount) {
          return { canView: true, canCreate: false, canEdit: false, canDelete: false };
        }
      } catch {}
    }
    const raw = localStorage.getItem('screenAccess');
    if (!raw) return { canView: true, canCreate: true, canEdit: true, canDelete: true };
    try {
      const screens: any[] = JSON.parse(raw);
      const entry = screens.find(s => {
        const name = s?.screen?.screen ?? s?.screen?.name ?? s?.screenName ?? '';
        const clean = String(name).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return clean === 'items' || clean === 'itemmaster';
      });
      if (!entry) return { canView: true, canCreate: true, canEdit: true, canDelete: true };
      return { canView: !!entry.canView, canCreate: !!entry.canCreate, canEdit: !!entry.canEdit, canDelete: !!entry.canDelete };
    } catch {
      return { canView: true, canCreate: true, canEdit: true, canDelete: true };
    }
  });

  filteredItems = computed(() => {
    let list = this.items();

    const comp = this.selectedCompanyCode();
    if (comp !== 'ALL') {
      list = list.filter(i => i.companyCode.toUpperCase() === comp.toUpperCase());
    }

    const chan = this.channelFilter();
    if (chan !== 'ALL') {
      list = list.filter(i => i.salesChannel === chan || i.salesChannel === 'Both');
    }

    const status = this.statusFilter();
    if (status === 'active') {
      list = list.filter(i => i.isActive);
    } else if (status === 'inactive') {
      list = list.filter(i => !i.isActive);
    }

    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      list = list.filter(i =>
        i.name.toLowerCase().includes(term) ||
        i.itemNumber.toLowerCase().includes(term) ||
        i.displayName.toLowerCase().includes(term) ||
        i.category.toLowerCase().includes(term) ||
        (i.brand && i.brand.toLowerCase().includes(term))
      );
    }

    const colFilter = this.selectedCollectionFilter();
    if (colFilter !== 'ALL') {
      const col = this.collections().find(c => c.code.toUpperCase() === colFilter.toUpperCase());
      const itemNums = new Set(col?.items?.map(ci => ci.itemNumber.toUpperCase()) ?? []);
      list = list.filter(i => itemNums.has(i.itemNumber.toUpperCase()));
    }

    return list;
  });

  availableItemsForCollectionModal = computed(() => {
    const comp = this.collectionForm.get('companyCode')?.value;
    let list = this.items();
    if (comp) {
      list = list.filter(i => i.companyCode.toUpperCase() === comp.toUpperCase());
    }
    const ch = this.channelFilterInCollectionModal();
    if (ch !== 'ALL') {
      list = list.filter(i => i.salesChannel === ch || i.salesChannel === 'Both');
    }
    const term = this.itemSearchInCollectionModal().trim().toLowerCase();
    if (term) {
      list = list.filter(i =>
        i.itemNumber.toLowerCase().includes(term) ||
        i.name.toLowerCase().includes(term) ||
        i.category.toLowerCase().includes(term)
      );
    }
    return list;
  });

  availableItemsForQuickManage = computed(() => {
    const col = this.targetCollectionForManageItems();
    if (!col) return [];
    let list = this.items().filter(i => i.companyCode.toUpperCase() === col.companyCode.toUpperCase());
    const term = this.manageItemsSearch().trim().toLowerCase();
    if (term) {
      list = list.filter(i =>
        i.itemNumber.toLowerCase().includes(term) ||
        i.name.toLowerCase().includes(term) ||
        i.category.toLowerCase().includes(term)
      );
    }
    return list;
  });

  filteredCollections = computed(() => {
    let list = this.collections();
    const comp = this.selectedCompanyCode();
    if (comp !== 'ALL') {
      list = list.filter(c => c.companyCode.toUpperCase() === comp.toUpperCase());
    }
    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term) ||
        (c.season && c.season.toLowerCase().includes(term))
      );
    }
    return list;
  });

  stats = computed(() => {
    const all = this.items();
    return {
      total: all.length,
      b2c: all.filter(i => i.salesChannel === 'B2C' || i.salesChannel === 'Both').length,
      b2b: all.filter(i => i.salesChannel === 'B2B' || i.salesChannel === 'Both').length,
      collections: this.collections().length
    };
  });

  ngOnInit() {
    this.refresh();
  }

  async refresh() {
    try {
      const comp = this.selectedCompanyCode() === 'ALL' ? undefined : this.selectedCompanyCode();
      await Promise.all([
        this.companyService.list(),
        this.itemService.list(comp),
        this.collectionService.list(comp)
      ]);
    } catch (err: any) {
      console.error('Failed to load items/collections:', err);
      this.toast.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Failed to load items.' });
    }
  }

  openCreateItem() {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  editItem(item: Item) {
    this.router.navigate([item.companyCode, item.itemNumber], { relativeTo: this.route });
  }

  confirmDeleteItem(item: Item) {
    this.itemToDelete.set(item);
    this.deleteInputText.set('');
  }

  cancelDeleteItem() {
    this.itemToDelete.set(null);
    this.deleteInputText.set('');
  }

  async executeDeleteItem() {
    const itm = this.itemToDelete();
    if (!itm) return;

    if (this.deleteInputText().trim() !== itm.name.trim()) {
      this.toast.add({ severity: 'warn', summary: 'Name Mismatch', detail: 'Please type the exact item name to confirm deletion.' });
      return;
    }

    this.deleting.set(true);
    try {
      const res = await this.itemService.delete(itm.companyCode, itm.itemNumber);
      if (res.success) {
        this.toast.add({ severity: 'success', summary: 'Deleted', detail: res.message || `Item ${itm.name} deleted.` });
        this.cancelDeleteItem();
      } else {
        this.toast.add({ severity: 'error', summary: 'Delete Failed', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Failed to delete item.' });
    } finally {
      this.deleting.set(false);
    }
  }

  openVariantsModal(item: Item) {
    this.selectedItemForVariants.set(item);
  }

  closeVariantsModal() {
    this.selectedItemForVariants.set(null);
  }

  // Helper: Extract all distinct sizes configured on an item
  getItemSizes(itm: Item): string[] {
    if (!itm.variants || itm.variants.length === 0) {
      return ['ALL'];
    }
    const sizes = Array.from(new Set(itm.variants.map(v => v.sizeCode.toUpperCase()))).filter(Boolean);
    return sizes.length > 0 ? sizes : ['ALL'];
  }

  // Summary computed for Create/Edit Collection Modal
  selectedSizesSummaryInCollectionModal = computed(() => {
    const keys = this.selectedItemSizesInCollection();
    const distinctItems = new Set(keys.map(k => k.split('::')[0])).size;
    return {
      totalSizes: keys.length,
      distinctItems
    };
  });

  // Summary computed for Quick Manage Items Modal
  selectedSizesSummaryInQuickManage = computed(() => {
    const keys = this.manageItemSizesSelection();
    const distinctItems = new Set(keys.map(k => k.split('::')[0])).size;
    return {
      totalSizes: keys.length,
      distinctItems
    };
  });

  // Collection modal handlers
  openCreateCollection() {
    this.collectionToEdit.set(null);
    const compCode = this.selectedCompanyCode() !== 'ALL' ? this.selectedCompanyCode() : (this.companies()[0]?.code ?? '');
    this.selectedItemSizesInCollection.set([]);
    this.itemSearchInCollectionModal.set('');
    this.channelFilterInCollectionModal.set('ALL');

    this.collectionForm.reset({
      companyCode: compCode,
      code: '',
      name: '',
      description: '',
      season: 'Summer 2026',
      channel: 'Both',
      bannerImage: '',
      isActive: true
    });
    this.collectionForm.get('code')?.enable();
    this.collectionForm.get('companyCode')?.enable();
    this.showCollectionModal.set(true);
  }

  openEditCollection(col: Collection) {
    this.collectionToEdit.set(col);
    const existing = col.items?.map(i => `${i.itemNumber.toUpperCase()}::${(i.sizeCode || 'ALL').toUpperCase()}`) ?? [];
    this.selectedItemSizesInCollection.set(existing);
    this.itemSearchInCollectionModal.set('');
    this.channelFilterInCollectionModal.set('ALL');

    this.collectionForm.reset({
      companyCode: col.companyCode,
      code: col.code,
      name: col.name,
      description: col.description || '',
      season: col.season || '',
      channel: col.channel,
      bannerImage: col.bannerImage || '',
      isActive: col.isActive
    });
    this.collectionForm.get('code')?.disable();
    this.collectionForm.get('companyCode')?.disable();
    this.showCollectionModal.set(true);
  }

  closeCollectionModal() {
    this.showCollectionModal.set(false);
  }

  isSizeSelectedInCollection(itemNumber: string, sizeCode: string): boolean {
    const key = `${itemNumber.toUpperCase()}::${sizeCode.toUpperCase()}`;
    return this.selectedItemSizesInCollection().includes(key);
  }

  isItemFullySelectedInCollection(itm: Item): boolean {
    const sizes = this.getItemSizes(itm);
    return sizes.every(s => this.isSizeSelectedInCollection(itm.itemNumber, s));
  }

  isItemPartiallySelectedInCollection(itm: Item): boolean {
    const sizes = this.getItemSizes(itm);
    const some = sizes.some(s => this.isSizeSelectedInCollection(itm.itemNumber, s));
    return some && !this.isItemFullySelectedInCollection(itm);
  }

  toggleSizeInCollection(itemNumber: string, sizeCode: string) {
    const key = `${itemNumber.toUpperCase()}::${sizeCode.toUpperCase()}`;
    const current = this.selectedItemSizesInCollection();
    if (current.includes(key)) {
      this.selectedItemSizesInCollection.set(current.filter(k => k !== key));
    } else {
      this.selectedItemSizesInCollection.set([...current, key]);
    }
  }

  toggleItemAllSizesInCollection(itm: Item) {
    const sizes = this.getItemSizes(itm);
    const allSelected = sizes.every(s => this.isSizeSelectedInCollection(itm.itemNumber, s));
    const current = this.selectedItemSizesInCollection();
    const itemPrefix = `${itm.itemNumber.toUpperCase()}::`;

    if (allSelected) {
      this.selectedItemSizesInCollection.set(current.filter(k => !k.startsWith(itemPrefix)));
    } else {
      const keysToAdd = sizes.map(s => `${itemPrefix}${s}`);
      const merged = Array.from(new Set([...current, ...keysToAdd]));
      this.selectedItemSizesInCollection.set(merged);
    }
  }

  selectAllItemsForCollectionModal() {
    const allKeys: string[] = [];
    for (const itm of this.availableItemsForCollectionModal()) {
      for (const s of this.getItemSizes(itm)) {
        allKeys.push(`${itm.itemNumber.toUpperCase()}::${s}`);
      }
    }
    const merged = Array.from(new Set([...this.selectedItemSizesInCollection(), ...allKeys]));
    this.selectedItemSizesInCollection.set(merged);
  }

  clearAllItemsForCollectionModal() {
    this.selectedItemSizesInCollection.set([]);
  }

  getSelectedSizesForItemInCollection(itemNumber: string): string[] {
    const prefix = `${itemNumber.toUpperCase()}::`;
    return this.selectedItemSizesInCollection()
      .filter(k => k.startsWith(prefix))
      .map(k => k.substring(prefix.length));
  }

  // Quick Manage Collection Items handlers
  openManageCollectionItems(col: Collection) {
    this.targetCollectionForManageItems.set(col);
    const existing = col.items?.map(i => `${i.itemNumber.toUpperCase()}::${(i.sizeCode || 'ALL').toUpperCase()}`) ?? [];
    this.manageItemSizesSelection.set(existing);
    this.manageItemsSearch.set('');
    this.showManageItemsModal.set(true);
  }

  closeManageCollectionItems() {
    this.showManageItemsModal.set(false);
    this.targetCollectionForManageItems.set(null);
    this.manageItemSizesSelection.set([]);
  }

  isSizeSelectedInQuickManage(itemNumber: string, sizeCode: string): boolean {
    const key = `${itemNumber.toUpperCase()}::${sizeCode.toUpperCase()}`;
    return this.manageItemSizesSelection().includes(key);
  }

  isItemFullySelectedInQuickManage(itm: Item): boolean {
    const sizes = this.getItemSizes(itm);
    return sizes.every(s => this.isSizeSelectedInQuickManage(itm.itemNumber, s));
  }

  isItemPartiallySelectedInQuickManage(itm: Item): boolean {
    const sizes = this.getItemSizes(itm);
    const some = sizes.some(s => this.isSizeSelectedInQuickManage(itm.itemNumber, s));
    return some && !this.isItemFullySelectedInQuickManage(itm);
  }

  toggleSizeInQuickManage(itemNumber: string, sizeCode: string) {
    const key = `${itemNumber.toUpperCase()}::${sizeCode.toUpperCase()}`;
    const current = this.manageItemSizesSelection();
    if (current.includes(key)) {
      this.manageItemSizesSelection.set(current.filter(k => k !== key));
    } else {
      this.manageItemSizesSelection.set([...current, key]);
    }
  }

  toggleItemAllSizesInQuickManage(itm: Item) {
    const sizes = this.getItemSizes(itm);
    const allSelected = sizes.every(s => this.isSizeSelectedInQuickManage(itm.itemNumber, s));
    const current = this.manageItemSizesSelection();
    const itemPrefix = `${itm.itemNumber.toUpperCase()}::`;

    if (allSelected) {
      this.manageItemSizesSelection.set(current.filter(k => !k.startsWith(itemPrefix)));
    } else {
      const keysToAdd = sizes.map(s => `${itemPrefix}${s}`);
      const merged = Array.from(new Set([...current, ...keysToAdd]));
      this.manageItemSizesSelection.set(merged);
    }
  }

  selectAllQuickManage() {
    const allKeys: string[] = [];
    for (const itm of this.availableItemsForQuickManage()) {
      for (const s of this.getItemSizes(itm)) {
        allKeys.push(`${itm.itemNumber.toUpperCase()}::${s}`);
      }
    }
    const merged = Array.from(new Set([...this.manageItemSizesSelection(), ...allKeys]));
    this.manageItemSizesSelection.set(merged);
  }

  clearAllQuickManage() {
    this.manageItemSizesSelection.set([]);
  }

  getSelectedSizesForItemInQuickManage(itemNumber: string): string[] {
    const prefix = `${itemNumber.toUpperCase()}::`;
    return this.manageItemSizesSelection()
      .filter(k => k.startsWith(prefix))
      .map(k => k.substring(prefix.length));
  }

  async saveQuickManageItems() {
    const col = this.targetCollectionForManageItems();
    if (!col) return;

    this.savingManageItems.set(true);
    try {
      const itemsPayload = this.manageItemSizesSelection().map((k, idx) => {
        const parts = k.split('::');
        return { itemNumber: parts[0], sizeCode: parts[1] || 'ALL', sortOrder: idx + 1 };
      });

      const payload: CollectionInput = {
        companyCode: col.companyCode,
        code: col.code,
        name: col.name,
        description: col.description,
        season: col.season,
        channel: col.channel,
        bannerImage: col.bannerImage,
        isActive: col.isActive,
        items: itemsPayload
      };

      const res = await this.collectionService.update(payload);
      if (res.success) {
        this.toast.add({ severity: 'success', summary: 'Catalog Updated', detail: `Updated items and size sets for ${col.name}.` });
        await this.collectionService.list(this.selectedCompanyCode() === 'ALL' ? undefined : this.selectedCompanyCode());
        this.closeManageCollectionItems();
      } else {
        this.toast.add({ severity: 'error', summary: 'Update Failed', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Failed to update collection items.' });
    } finally {
      this.savingManageItems.set(false);
    }
  }

  async saveCollection() {
    if (this.collectionForm.invalid) {
      this.collectionForm.markAllAsTouched();
      this.toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill in all required fields.' });
      return;
    }

    const raw = this.collectionForm.getRawValue();
    const itemsPayload = this.selectedItemSizesInCollection().map((k, idx) => {
      const parts = k.split('::');
      return { itemNumber: parts[0], sizeCode: parts[1] || 'ALL', sortOrder: idx + 1 };
    });

    const payload: CollectionInput = {
      companyCode: raw.companyCode!.trim().toUpperCase(),
      code: raw.code!.trim().toUpperCase(),
      name: raw.name!.trim(),
      description: raw.description?.trim() || undefined,
      season: raw.season?.trim() || undefined,
      channel: raw.channel || 'Both',
      bannerImage: raw.bannerImage?.trim() || undefined,
      isActive: !!raw.isActive,
      items: itemsPayload
    };

    this.savingCollection.set(true);
    try {
      const res = this.collectionToEdit()
        ? await this.collectionService.update(payload)
        : await this.collectionService.create(payload);

      if (res.success) {
        this.toast.add({ severity: 'success', summary: 'Success', detail: res.message });
        this.closeCollectionModal();
      } else {
        this.toast.add({ severity: 'error', summary: 'Error', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Failed to save collection.' });
    } finally {
      this.savingCollection.set(false);
    }
  }

  // Display helpers for cards and catalog badges
  getGroupedCollectionItems(col: Collection): { itemNumber: string; itemName?: string; sizes: string[] }[] {
    if (!col.items || col.items.length === 0) return [];
    const map = new Map<string, { itemNumber: string; itemName?: string; sizes: string[] }>();
    for (const ci of col.items) {
      const key = ci.itemNumber.toUpperCase();
      if (!map.has(key)) {
        map.set(key, { itemNumber: ci.itemNumber, itemName: ci.itemName || ci.itemDisplayName, sizes: [] });
      }
      const entry = map.get(key)!;
      const sz = ci.sizeCode || 'ALL';
      if (!entry.sizes.includes(sz)) {
        entry.sizes.push(sz);
      }
    }
    return Array.from(map.values());
  }

  getCollectionSizesCount(col: Collection): number {
    return col.items?.length || 0;
  }

  getCollectionDistinctItemsCount(col: Collection): number {
    if (!col.items) return 0;
    return new Set(col.items.map(ci => ci.itemNumber.toUpperCase())).size;
  }

  getItemSizesInSelectedCollection(itemNumber: string): string[] {
    const colFilter = this.selectedCollectionFilter();
    if (colFilter === 'ALL') return [];
    const col = this.collections().find(c => c.code.toUpperCase() === colFilter.toUpperCase());
    if (!col?.items) return [];
    return col.items
      .filter(ci => ci.itemNumber.toUpperCase() === itemNumber.toUpperCase())
      .map(ci => ci.sizeCode || 'ALL');
  }

  confirmDeleteCollection(col: Collection) {
    this.collectionToDelete.set(col);
  }

  cancelDeleteCollection() {
    this.collectionToDelete.set(null);
  }

  async executeDeleteCollection() {
    const col = this.collectionToDelete();
    if (!col) return;
    try {
      const res = await this.collectionService.delete(col.companyCode, col.code);
      if (res.success) {
        this.toast.add({ severity: 'success', summary: 'Deleted', detail: `Collection ${col.name} deleted.` });
        this.cancelDeleteCollection();
      } else {
        this.toast.add({ severity: 'error', summary: 'Delete Failed', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Failed to delete collection.' });
    }
  }
}
