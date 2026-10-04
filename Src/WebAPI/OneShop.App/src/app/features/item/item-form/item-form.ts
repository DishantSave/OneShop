import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ItemService } from '../services/item.service';
import { CompanyService } from '../../company/services/company.service';
import { ColourService } from '../../colour/services/colour.service';
import { SizeService } from '../../size/services/size.service';
import { Item, ItemInput, ItemVariant } from '../models/item.model';
import { Colour } from '../../colour/models/colour.model';
import { Size } from '../../size/models/size.model';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  templateUrl: './item-form.html'
})
export class ItemForm implements OnInit {
  private fb = inject(FormBuilder);
  private itemService = inject(ItemService);
  private companyService = inject(CompanyService);
  private colourService = inject(ColourService);
  private sizeService = inject(SizeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(MessageService);

  private companyCodeParam = this.route.snapshot.paramMap.get('companyCode');
  private itemNumberParam = this.route.snapshot.paramMap.get('itemNumber');

  isEditMode = this.itemNumberParam !== null && this.itemNumberParam !== 'new' && this.companyCodeParam !== null;
  companyCode = this.isEditMode ? this.companyCodeParam?.trim().toUpperCase() ?? null : null;
  itemNumber = this.isEditMode ? this.itemNumberParam?.trim().toUpperCase() ?? null : null;

  companies = this.companyService.companies;
  companyColours = signal<Colour[]>([]);
  companySizes = signal<Size[]>([]);

  selectedColourCodes = signal<string[]>([]);
  selectedSizeCodes = signal<string[]>([]);

  saving = signal(false);
  loading = signal(false);
  checkingNumber = signal(false);
  numberAvailability = signal<'available' | 'taken' | 'invalid' | null>(null);

  currentItem = signal<Item | null>(null);

  auditTrail = computed(() => {
    return this.currentItem()?.audit ?? [];
  });

  permissions = computed(() => {
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

  canSubmit = computed(() =>
    !this.isEditMode ? this.permissions().canCreate : this.permissions().canEdit
  );

  form = this.fb.group({
    companyCode: ['', Validators.required],
    itemNumber: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    displayName: ['', Validators.maxLength(200)],
    description: ['', Validators.maxLength(1000)],
    category: ['Apparel', [Validators.required, Validators.maxLength(100)]],
    salesChannel: ['Both', Validators.required], // 'B2C', 'B2B', 'Both'
    b2cPrice: [0, [Validators.min(0)]],
    b2cCompareAtPrice: [null as number | null],
    b2bPrice: [0, [Validators.min(0)]],
    b2bMinQuantity: [1, [Validators.required, Validators.min(1)]], // MOQ
    unitOfMeasure: ['PCS', [Validators.required, Validators.maxLength(20)]],
    season: [''],
    brand: [''],
    tags: [''],
    images: [''],
    isActive: [true],
    variants: this.fb.array([])
  });

  get variantsArray(): FormArray {
    return this.form.get('variants') as FormArray;
  }

  async ngOnInit() {
    await this.companyService.list();

    if (this.isEditMode && this.companyCode && this.itemNumber) {
      this.form.get('companyCode')?.disable();
      this.form.get('itemNumber')?.disable();
      await this.loadCompanyDependencies(this.companyCode);
      await this.loadItem(this.companyCode, this.itemNumber);
    } else {
      if (this.companies().length > 0) {
        const firstComp = this.companies()[0].code;
        this.form.patchValue({ companyCode: firstComp });
        await this.loadCompanyDependencies(firstComp);
      }
    }
  }

  async onCompanySelect(compCode: string) {
    if (this.isEditMode) return;
    this.form.patchValue({ companyCode: compCode });
    await this.loadCompanyDependencies(compCode);
    this.checkNumberUniqueness();
  }

  async loadCompanyDependencies(compCode: string) {
    try {
      const [colours, sizes] = await Promise.all([
        this.colourService.list(compCode),
        this.sizeService.list(compCode)
      ]);
      this.companyColours.set(colours.filter(c => c.isActive));
      this.companySizes.set(sizes.filter(s => s.isActive));
    } catch (err) {
      console.error('Failed to load company colours/sizes:', err);
    }
  }

  async loadItem(companyCode: string, itemNum: string) {
    this.loading.set(true);
    try {
      const itm = await this.itemService.get(companyCode, itemNum);
      if (itm) {
        this.currentItem.set(itm);
        this.form.patchValue({
          companyCode: itm.companyCode,
          itemNumber: itm.itemNumber,
          name: itm.name,
          displayName: itm.displayName,
          description: itm.description || '',
          category: itm.category,
          salesChannel: itm.salesChannel,
          b2cPrice: itm.b2cPrice,
          b2cCompareAtPrice: itm.b2cCompareAtPrice ?? null,
          b2bPrice: itm.b2bPrice,
          b2bMinQuantity: itm.b2bMinQuantity || 1,
          unitOfMeasure: itm.unitOfMeasure,
          season: itm.season || '',
          brand: itm.brand || '',
          tags: itm.tags || '',
          images: itm.images || '',
          isActive: itm.isActive
        });

        // Populate variants form array
        this.variantsArray.clear();
        if (itm.variants && itm.variants.length > 0) {
          for (const v of itm.variants) {
            this.variantsArray.push(this.fb.group({
              colourCode: [v.colourCode, Validators.required],
              sizeCode: [v.sizeCode, Validators.required],
              sku: [v.sku || ''],
              barcode: [v.barcode || ''],
              additionalPrice: [v.additionalPrice || 0],
              isActive: [v.isActive]
            }));
          }
        }
      } else {
        this.toast.add({ severity: 'error', summary: 'Not Found', detail: `Item [${itemNum}] not found.` });
        this.cancel();
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Failed to load item.' });
    } finally {
      this.loading.set(false);
    }
  }

  async checkNumberUniqueness() {
    if (this.isEditMode) return;
    const compCode = this.form.get('companyCode')?.value?.trim().toUpperCase();
    const itemNum = this.form.get('itemNumber')?.value?.trim().toUpperCase();

    if (!compCode || !itemNum) {
      this.numberAvailability.set('invalid');
      return;
    }

    this.checkingNumber.set(true);
    try {
      const exists = await this.itemService.checkNumberExists(compCode, itemNum);
      this.numberAvailability.set(exists ? 'taken' : 'available');
    } catch {
      this.numberAvailability.set(null);
    } finally {
      this.checkingNumber.set(false);
    }
  }

  // Variant Matrix Generation
  toggleColourSelection(code: string) {
    const current = this.selectedColourCodes();
    if (current.includes(code)) {
      this.selectedColourCodes.set(current.filter(c => c !== code));
    } else {
      this.selectedColourCodes.set([...current, code]);
    }
  }

  toggleSizeSelection(code: string) {
    const current = this.selectedSizeCodes();
    if (current.includes(code)) {
      this.selectedSizeCodes.set(current.filter(s => s !== code));
    } else {
      this.selectedSizeCodes.set([...current, code]);
    }
  }

  generateVariantsMatrix() {
    const colours = this.selectedColourCodes();
    const sizes = this.selectedSizeCodes();
    const itemNum = this.form.get('itemNumber')?.value?.trim().toUpperCase() || 'ITEM';

    if (colours.length === 0 || sizes.length === 0) {
      this.toast.add({ severity: 'warn', summary: 'Selection Missing', detail: 'Please select at least one colour and one size to generate the matrix.' });
      return;
    }

    let addedCount = 0;
    for (const c of colours) {
      for (const s of sizes) {
        // Check if already in array
        const exists = this.variantsArray.controls.some(ctrl =>
          ctrl.get('colourCode')?.value === c && ctrl.get('sizeCode')?.value === s
        );

        if (!exists) {
          const sku = `${itemNum}-${c}-${s}`;
          this.variantsArray.push(this.fb.group({
            colourCode: [c, Validators.required],
            sizeCode: [s, Validators.required],
            sku: [sku],
            barcode: [''],
            additionalPrice: [0],
            isActive: [true]
          }));
          addedCount++;
        }
      }
    }

    this.toast.add({ severity: 'success', summary: 'Matrix Generated', detail: `Generated ${addedCount} variant combinations.` });
  }

  removeVariant(index: number) {
    this.variantsArray.removeAt(index);
  }

  clearAllVariants() {
    this.variantsArray.clear();
  }

  cancel() {
    this.router.navigate(['/dashboard/items']);
  }

  async submit() {
    if (!this.canSubmit()) {
      this.toast.add({ severity: 'warn', summary: 'Permission Denied', detail: 'You do not have permission to save items.' });
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill in all required fields properly.' });
      return;
    }

    const raw = this.form.getRawValue();
    const compCode = (this.isEditMode ? this.companyCode : raw.companyCode)?.trim().toUpperCase()!;
    const itemNum = (this.isEditMode ? this.itemNumber : raw.itemNumber)?.trim().toUpperCase()!;

    const channel = raw.salesChannel || 'Both';
    const b2cPrice = Number(raw.b2cPrice) || 0;
    const b2bPrice = Number(raw.b2bPrice) || 0;
    const b2bMinQuantity = Math.max(1, Number(raw.b2bMinQuantity) || 1);

    // Validate MOQ for B2B
    if ((channel === 'B2B' || channel === 'Both') && b2bMinQuantity < 1) {
      this.toast.add({ severity: 'error', summary: 'Invalid MOQ', detail: 'B2B orders require a minimum order quantity of at least 1.' });
      return;
    }

    const variantsPayload = raw.variants?.map((v: any) => ({
      colourCode: v.colourCode.trim().toUpperCase(),
      sizeCode: v.sizeCode.trim().toUpperCase(),
      sku: v.sku?.trim() || null,
      barcode: v.barcode?.trim() || null,
      additionalPrice: Number(v.additionalPrice) || 0,
      isActive: !!v.isActive
    }));

    const payload: ItemInput = {
      companyCode: compCode,
      itemNumber: itemNum,
      name: raw.name!.trim(),
      displayName: raw.displayName?.trim() || raw.name!.trim(),
      description: raw.description?.trim() || undefined,
      category: raw.category!.trim(),
      salesChannel: channel,
      b2cPrice: b2cPrice,
      b2cCompareAtPrice: raw.b2cCompareAtPrice ? Number(raw.b2cCompareAtPrice) : undefined,
      b2bPrice: b2bPrice,
      b2bMinQuantity: b2bMinQuantity,
      unitOfMeasure: raw.unitOfMeasure?.trim() || 'PCS',
      season: raw.season?.trim() || undefined,
      brand: raw.brand?.trim() || undefined,
      tags: raw.tags?.trim() || undefined,
      images: raw.images?.trim() || undefined,
      isActive: !!raw.isActive,
      variants: variantsPayload
    };

    this.saving.set(true);
    try {
      const res = this.isEditMode
        ? await this.itemService.update(payload)
        : await this.itemService.create(payload);

      if (res.success) {
        this.toast.add({
          severity: 'success',
          summary: this.isEditMode ? 'Item Updated' : 'Item Created',
          detail: res.message
        });
        this.cancel();
      } else {
        this.toast.add({ severity: 'error', summary: 'Save Error', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Failed to save item.' });
    } finally {
      this.saving.set(false);
    }
  }
}
