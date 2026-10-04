import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InventoryService } from '../services/inventory.service';
import { CompanyService } from '../../company/services/company.service';
import { WarehouseService } from '../../warehouse/services/warehouse.service';
import { StoreService } from '../../store/services/store.service';
import { ItemService } from '../../item/services/item.service';
import { Inventory, InventoryInput, BatchInventoryAdjustmentInput } from '../models/inventory.model';
import { Warehouse } from '../../warehouse/models/warehouse.model';
import { Store } from '../../store/models/store.model';
import { Item } from '../../item/models/item.model';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './inventory-list.html'
})
export class InventoryList implements OnInit {
  private inventoryService = inject(InventoryService);
  private companyService = inject(CompanyService);
  private warehouseService = inject(WarehouseService);
  private storeService = inject(StoreService);
  private itemService = inject(ItemService);
  private toast = inject(MessageService);
  private fb = inject(FormBuilder);

  loading = this.inventoryService.loading;
  inventory = this.inventoryService.inventory;
  companies = this.companyService.companies;
  warehouses = this.warehouseService.warehouses;
  stores = this.storeService.stores;
  items = this.itemService.items;

  // Filters
  selectedCompanyCode = signal<string>('ALL');
  selectedLocationType = signal<'ALL' | 'Warehouse' | 'Store'>('ALL'); // Warehouse for B2B, Store for B2C
  selectedLocationCode = signal<string>('ALL');
  searchTerm = signal<string>('');

  // Modals
  showStockModal = signal(false);
  showAdjustModal = signal(false);
  showAuditModal = signal(false);
  saving = signal(false);

  selectedRecordForAudit = signal<Inventory | null>(null);

  // Form for New / Set Stock Level
  stockForm = this.fb.group({
    companyCode: ['', Validators.required],
    locationType: ['Warehouse', Validators.required], // 'Warehouse' (B2B) or 'Store' (B2C)
    locationCode: ['', Validators.required],
    itemNumber: ['', Validators.required],
    colourCode: ['', Validators.required],
    sizeCode: ['', Validators.required],
    quantityOnHand: [0, [Validators.required, Validators.min(0)]],
    allocatedQuantity: [0, [Validators.min(0)]],
    reorderLevel: [10, [Validators.min(0)]],
    reason: ['Initial stock entry']
  });

  // Form for Quick Adjustment (+ / -)
  adjustForm = this.fb.group({
    companyCode: ['', Validators.required],
    locationType: ['', Validators.required],
    locationCode: ['', Validators.required],
    itemNumber: ['', Validators.required],
    colourCode: ['', Validators.required],
    sizeCode: ['', Validators.required],
    adjustment: [0, [Validators.required]],
    reason: ['Manual inventory adjustment', Validators.required]
  });

  permissions = computed(() => {
    const raw = localStorage.getItem('screenAccess');
    if (!raw) return { canView: true, canCreate: true, canEdit: true, canDelete: true };
    try {
      const screens: any[] = JSON.parse(raw);
      const entry = screens.find(s => {
        const name = s?.screen?.screen ?? s?.screen?.name ?? s?.screenName ?? '';
        const clean = String(name).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return clean === 'inventory';
      });
      if (!entry) return { canView: true, canCreate: true, canEdit: true, canDelete: true };
      return { canView: !!entry.canView, canCreate: !!entry.canCreate, canEdit: !!entry.canEdit, canDelete: !!entry.canDelete };
    } catch {
      return { canView: true, canCreate: true, canEdit: true, canDelete: true };
    }
  });

  // Dynamic locations for selected company in filter
  availableFilterLocations = computed(() => {
    const comp = this.selectedCompanyCode();
    const type = this.selectedLocationType();

    if (type === 'Warehouse') {
      let list = this.warehouses();
      if (comp !== 'ALL') list = list.filter(w => w.companyCode.toUpperCase() === comp.toUpperCase());
      return list.map(w => ({ code: w.code, name: `${w.code} — ${w.name} (B2B Warehouse)` }));
    } else if (type === 'Store') {
      let list = this.stores();
      if (comp !== 'ALL') list = list.filter(s => s.companyCode.toUpperCase() === comp.toUpperCase());
      return list.map(s => ({ code: s.code, name: `${s.code} — ${s.name} (B2C Store)` }));
    }
    return [];
  });

  // Dynamic dropdowns for New Stock Form
  formLocations = computed(() => {
    const comp = this.stockForm.get('companyCode')?.value?.toUpperCase();
    const type = this.stockForm.get('locationType')?.value;
    if (!comp) return [];

    if (type === 'Warehouse') {
      return this.warehouses()
        .filter(w => w.companyCode.toUpperCase() === comp && w.isActive)
        .map(w => ({ code: w.code, name: `${w.code} — ${w.name} (Wholesale B2B Depot)` }));
    } else {
      return this.stores()
        .filter(s => s.companyCode.toUpperCase() === comp && s.isActive)
        .map(s => ({ code: s.code, name: `${s.code} — ${s.name} (Retail B2C Store)` }));
    }
  });

  formItems = computed(() => {
    const comp = this.stockForm.get('companyCode')?.value?.toUpperCase();
    if (!comp) return [];
    return this.items().filter(i => i.companyCode.toUpperCase() === comp && i.isActive);
  });

  selectedFormItem = computed(() => {
    const itemNum = this.stockForm.get('itemNumber')?.value?.toUpperCase();
    if (!itemNum) return null;
    return this.formItems().find(i => i.itemNumber.toUpperCase() === itemNum) ?? null;
  });

  formVariants = computed(() => {
    const itm = this.selectedFormItem();
    if (!itm || !itm.variants) return [];
    return itm.variants.filter(v => v.isActive);
  });

  filteredInventory = computed(() => {
    let list = this.inventory();

    const comp = this.selectedCompanyCode();
    if (comp !== 'ALL') {
      list = list.filter(i => i.companyCode.toUpperCase() === comp.toUpperCase());
    }

    const type = this.selectedLocationType();
    if (type !== 'ALL') {
      list = list.filter(i => i.locationType === type);
    }

    const loc = this.selectedLocationCode();
    if (loc !== 'ALL') {
      list = list.filter(i => i.locationCode.toUpperCase() === loc.toUpperCase());
    }

    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      list = list.filter(i =>
        i.itemNumber.toLowerCase().includes(term) ||
        i.itemName.toLowerCase().includes(term) ||
        i.colourCode.toLowerCase().includes(term) ||
        i.sizeCode.toLowerCase().includes(term) ||
        i.locationName.toLowerCase().includes(term)
      );
    }

    return list;
  });

  stats = computed(() => {
    const all = this.inventory();
    const totalQty = all.reduce((sum, i) => sum + i.quantityOnHand, 0);
    const availQty = all.reduce((sum, i) => sum + i.availableQuantity, 0);
    const lowStockCount = all.filter(i => i.availableQuantity <= i.reorderLevel).length;

    return {
      skus: all.length,
      totalQty,
      availQty,
      lowStock: lowStockCount
    };
  });

  async ngOnInit() {
    await this.refresh();
  }

  async refresh() {
    try {
      const comp = this.selectedCompanyCode() === 'ALL' ? undefined : this.selectedCompanyCode();
      const type = this.selectedLocationType() === 'ALL' ? undefined : this.selectedLocationType();
      const loc = this.selectedLocationCode() === 'ALL' ? undefined : this.selectedLocationCode();

      await Promise.all([
        this.companyService.list(),
        this.warehouseService.list(comp),
        this.storeService.list(comp),
        this.itemService.list(comp),
        this.inventoryService.list(comp, type, loc)
      ]);
    } catch (err: any) {
      console.error('Failed to load inventory data:', err);
      this.toast.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Failed to load inventory.' });
    }
  }

  openCreateStockModal() {
    const comp = this.selectedCompanyCode() !== 'ALL' ? this.selectedCompanyCode() : (this.companies()[0]?.code ?? '');
    this.stockForm.reset({
      companyCode: comp,
      locationType: 'Warehouse', // default to Warehouse for B2B
      locationCode: '',
      itemNumber: '',
      colourCode: '',
      sizeCode: '',
      quantityOnHand: 100,
      allocatedQuantity: 0,
      reorderLevel: 20,
      reason: 'Initial stock intake'
    });

    // Auto select first location if available
    const whs = this.warehouses().filter(w => w.companyCode.toUpperCase() === comp.toUpperCase());
    if (whs.length > 0) {
      this.stockForm.patchValue({ locationCode: whs[0].code });
    }

    const itms = this.items().filter(i => i.companyCode.toUpperCase() === comp.toUpperCase());
    if (itms.length > 0) {
      this.stockForm.patchValue({ itemNumber: itms[0].itemNumber });
      if (itms[0].variants && itms[0].variants.length > 0) {
        this.stockForm.patchValue({
          colourCode: itms[0].variants[0].colourCode,
          sizeCode: itms[0].variants[0].sizeCode
        });
      }
    }

    this.showStockModal.set(true);
  }

  closeStockModal() {
    this.showStockModal.set(false);
  }

  onStockFormCompanyChange(compCode: string) {
    this.stockForm.patchValue({ companyCode: compCode, locationCode: '', itemNumber: '', colourCode: '', sizeCode: '' });
  }

  onStockFormLocationTypeChange(type: string) {
    this.stockForm.patchValue({ locationType: type, locationCode: '' });
  }

  onStockFormItemChange(itemNum: string) {
    this.stockForm.patchValue({ itemNumber: itemNum, colourCode: '', sizeCode: '' });
    const itm = this.items().find(i => i.itemNumber.toUpperCase() === itemNum.toUpperCase());
    if (itm?.variants && itm.variants.length > 0) {
      this.stockForm.patchValue({
        colourCode: itm.variants[0].colourCode,
        sizeCode: itm.variants[0].sizeCode
      });
    }
  }

  async saveStock() {
    if (this.stockForm.invalid) {
      this.stockForm.markAllAsTouched();
      this.toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill in all dropdowns and quantities.' });
      return;
    }

    const raw = this.stockForm.getRawValue();
    const payload: InventoryInput = {
      companyCode: raw.companyCode!.trim().toUpperCase(),
      locationType: raw.locationType!,
      locationCode: raw.locationCode!.trim().toUpperCase(),
      itemNumber: raw.itemNumber!.trim().toUpperCase(),
      colourCode: raw.colourCode!.trim().toUpperCase(),
      sizeCode: raw.sizeCode!.trim().toUpperCase(),
      quantityOnHand: Number(raw.quantityOnHand) || 0,
      allocatedQuantity: Number(raw.allocatedQuantity) || 0,
      reorderLevel: Number(raw.reorderLevel) || 0,
      reason: raw.reason?.trim() || 'Manual stock update'
    };

    this.saving.set(true);
    try {
      const res = await this.inventoryService.upsert(payload);
      if (res.success) {
        this.toast.add({ severity: 'success', summary: 'Success', detail: res.message });
        this.closeStockModal();
      } else {
        this.toast.add({ severity: 'error', summary: 'Error', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Failed to update stock.' });
    } finally {
      this.saving.set(false);
    }
  }

  // Quick Adjustment Modal
  openAdjustModal(record: Inventory) {
    this.adjustForm.reset({
      companyCode: record.companyCode,
      locationType: record.locationType,
      locationCode: record.locationCode,
      itemNumber: record.itemNumber,
      colourCode: record.colourCode,
      sizeCode: record.sizeCode,
      adjustment: 0,
      reason: 'Physical cycle count adjustment'
    });
    this.showAdjustModal.set(true);
  }

  closeAdjustModal() {
    this.showAdjustModal.set(false);
  }

  async saveAdjustment() {
    if (this.adjustForm.invalid) {
      this.adjustForm.markAllAsTouched();
      this.toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please enter adjustment quantity and reason.' });
      return;
    }

    const raw = this.adjustForm.getRawValue();
    const adj = Number(raw.adjustment);
    if (adj === 0) {
      this.toast.add({ severity: 'warn', summary: 'No Change', detail: 'Adjustment quantity cannot be 0.' });
      return;
    }

    const payload: BatchInventoryAdjustmentInput = {
      companyCode: raw.companyCode!,
      locationType: raw.locationType!,
      locationCode: raw.locationCode!,
      itemNumber: raw.itemNumber!,
      colourCode: raw.colourCode!,
      sizeCode: raw.sizeCode!,
      quantityAdjustment: adj,
      reason: raw.reason!
    };

    this.saving.set(true);
    try {
      const res = await this.inventoryService.adjust(payload);
      if (res.success) {
        this.toast.add({ severity: 'success', summary: 'Adjusted', detail: res.message });
        this.closeAdjustModal();
      } else {
        this.toast.add({ severity: 'error', summary: 'Error', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Failed to adjust stock.' });
    } finally {
      this.saving.set(false);
    }
  }

  async viewAudit(record: Inventory) {
    this.selectedRecordForAudit.set(record);
    const full = await this.inventoryService.getRecord(
      record.companyCode, record.itemNumber, record.colourCode, record.sizeCode, record.locationType, record.locationCode
    );
    if (full) {
      this.selectedRecordForAudit.set(full);
    }
    this.showAuditModal.set(true);
  }

  closeAuditModal() {
    this.showAuditModal.set(false);
    this.selectedRecordForAudit.set(null);
  }
}
