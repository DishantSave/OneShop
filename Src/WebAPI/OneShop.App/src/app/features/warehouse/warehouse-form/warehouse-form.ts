import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { WarehouseService } from '../services/warehouse.service';
import { CompanyService } from '../../company/services/company.service';
import { Warehouse, WarehouseInput } from '../models/warehouse.model';

@Component({
  selector: 'app-warehouse-form',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  templateUrl: './warehouse-form.html'
})
export class WarehouseForm implements OnInit {
  private fb = inject(FormBuilder);
  private warehouseService = inject(WarehouseService);
  private companyService = inject(CompanyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(MessageService);

  private companyCodeParam = this.route.snapshot.paramMap.get('companyCode');
  private codeParam = this.route.snapshot.paramMap.get('code');

  isEditMode = this.codeParam !== null && this.codeParam !== 'new' && this.companyCodeParam !== null;
  companyCode = this.isEditMode ? this.companyCodeParam?.trim().toUpperCase() ?? null : null;
  warehouseCode = this.isEditMode ? this.codeParam?.trim().toUpperCase() ?? null : null;

  companies = this.companyService.companies;

  saving = signal(false);
  loading = signal(false);
  checkingCode = signal(false);
  codeAvailability = signal<'available' | 'taken' | 'invalid' | null>(null);

  permissions = computed(() => {
    const raw = localStorage.getItem('screenAccess');
    if (!raw) {
      return { canView: true, canCreate: true, canEdit: true, canDelete: true };
    }

    try {
      const screens: any[] = JSON.parse(raw);
      const entry = screens.find(s => {
        const name = s?.screen?.screen ?? s?.screen?.name ?? s?.screenName ?? '';
        const clean = String(name).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return clean === 'companymaster' || clean === 'divisionmaster' || clean === 'warehousemaster';
      });

      if (!entry) {
        return { canView: true, canCreate: true, canEdit: true, canDelete: true };
      }

      return {
        canView: !!entry.canView,
        canCreate: !!entry.canCreate,
        canEdit: !!entry.canEdit,
        canDelete: !!entry.canDelete
      };
    } catch {
      return { canView: true, canCreate: true, canEdit: true, canDelete: true };
    }
  });

  canSubmit = computed(() =>
    !this.isEditMode ? this.permissions().canCreate : this.permissions().canEdit
  );

  currentWarehouse = signal<Warehouse | null>(null);

  auditTrail = computed(() => {
    return this.currentWarehouse()?.audit ?? [];
  });

  selectedCompany = computed(() => {
    const code = this.form.get('companyCode')?.value?.trim().toUpperCase();
    if (!code) return null;
    return this.companies().find(c => c.code.toUpperCase() === code) ?? null;
  });

  countryOptions = [
    { label: 'India (IN)', value: 'IN' },
    { label: 'United States (US)', value: 'US' },
    { label: 'United Kingdom (GB)', value: 'GB' },
    { label: 'United Arab Emirates (AE)', value: 'AE' },
    { label: 'Singapore (SG)', value: 'SG' },
    { label: 'Canada (CA)', value: 'CA' },
    { label: 'Australia (AU)', value: 'AU' },
    { label: 'Germany (DE)', value: 'DE' }
  ];

  form = this.fb.group({
    companyCode: ['', [Validators.required]],
    code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(4), Validators.pattern(/^[A-Za-z0-9]+$/)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    displayName: ['', [Validators.required, Validators.maxLength(200)]],
    addressLineOne: ['', [Validators.required, Validators.maxLength(250)]],
    addressLineTwo: ['', [Validators.maxLength(250)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    stateCode: ['', [Validators.required, Validators.maxLength(20)]],
    countryCode: ['IN', [Validators.required, Validators.maxLength(3)]],
    postalCode: ['', [Validators.required, Validators.maxLength(20)]],
    contact: ['', [Validators.required, Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    isTestWarehouse: [false],
    isActive: [true]
  });

  async ngOnInit() {
    await this.companyService.list();

    if (this.isEditMode && this.companyCode && this.warehouseCode) {
      this.form.get('companyCode')?.disable();
      this.form.get('code')?.disable();
      await this.loadWarehouse(this.companyCode, this.warehouseCode);
    } else {
      if (this.companies().length > 0) {
        this.form.patchValue({ companyCode: this.companies()[0].code });
      }
    }
  }

  async loadWarehouse(companyCode: string, code: string) {
    this.loading.set(true);
    try {
      const wh = await this.warehouseService.get(companyCode, code);
      if (wh) {
        this.currentWarehouse.set(wh);
        this.form.patchValue({
          companyCode: wh.companyCode,
          code: wh.code,
          name: wh.name,
          displayName: wh.displayName,
          addressLineOne: wh.addressLineOne,
          addressLineTwo: wh.addressLineTwo || '',
          city: wh.city,
          stateCode: wh.stateCode,
          countryCode: wh.countryCode,
          postalCode: wh.postalCode,
          contact: wh.contact,
          email: wh.email,
          isTestWarehouse: wh.isTestWarehouse,
          isActive: wh.isActive
        });
      } else {
        this.toast.add({
          severity: 'error',
          summary: 'Not Found',
          detail: `Warehouse [${companyCode} / ${code}] not found.`
        });
        this.cancel();
      }
    } catch (err: any) {
      this.toast.add({
        severity: 'error',
        summary: 'Error',
        detail: err?.message || 'Failed to load warehouse.'
      });
    } finally {
      this.loading.set(false);
    }
  }

  async checkCodeUniqueness() {
    if (this.isEditMode) return;
    const compCode = this.form.get('companyCode')?.value?.trim().toUpperCase();
    const code = this.form.get('code')?.value?.trim().toUpperCase();

    if (!compCode || !code || code.length < 2 || code.length > 4) {
      this.codeAvailability.set('invalid');
      return;
    }

    this.checkingCode.set(true);
    try {
      const exists = await this.warehouseService.checkCodeExists(compCode, code);
      this.codeAvailability.set(exists ? 'taken' : 'available');
    } catch {
      this.codeAvailability.set(null);
    } finally {
      this.checkingCode.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/dashboard/masters/warehouse']);
  }

  async submit() {
    if (!this.canSubmit()) {
      this.toast.add({ severity: 'warn', summary: 'Permission Denied', detail: 'You do not have permission to save warehouses.' });
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill in all required fields properly.' });
      return;
    }

    const raw = this.form.getRawValue();
    const compCode = (this.isEditMode ? this.companyCode : raw.companyCode)?.trim().toUpperCase()!;
    const whCode = (this.isEditMode ? this.warehouseCode : raw.code)?.trim().toUpperCase()!;

    this.saving.set(true);
    try {
      const payload: WarehouseInput = {
        companyCode: compCode,
        code: whCode,
        name: raw.name!.trim(),
        displayName: raw.displayName!.trim(),
        addressLineOne: raw.addressLineOne!.trim(),
        addressLineTwo: raw.addressLineTwo?.trim() || null as any,
        city: raw.city!.trim(),
        stateCode: raw.stateCode!.trim(),
        countryCode: raw.countryCode!.trim().toUpperCase(),
        postalCode: raw.postalCode!.trim(),
        contact: raw.contact!.trim(),
        email: raw.email!.trim(),
        isTestWarehouse: !!raw.isTestWarehouse,
        isActive: !!raw.isActive
      };

      const res = this.isEditMode
        ? await this.warehouseService.update(payload)
        : await this.warehouseService.create(payload);

      if (res.success) {
        this.toast.add({
          severity: 'success',
          summary: this.isEditMode ? 'Warehouse Updated' : 'Warehouse Created',
          detail: res.message
        });
        this.cancel();
      } else {
        this.toast.add({ severity: 'error', summary: 'Save Error', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Failed to save warehouse.' });
    } finally {
      this.saving.set(false);
    }
  }
}
