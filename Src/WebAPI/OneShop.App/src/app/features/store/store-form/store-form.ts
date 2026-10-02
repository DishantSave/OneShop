import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { StoreService } from '../services/store.service';
import { CompanyService } from '../../company/services/company.service';
import { Store, emptyStore } from '../models/store.model';

@Component({
  selector: 'app-store-form',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule
  ],
  templateUrl: './store-form.html'
})
export class StoreForm implements OnInit {
  private fb = inject(FormBuilder);
  private storeService = inject(StoreService);
  private companyService = inject(CompanyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(MessageService);

  private companyCodeParam = this.route.snapshot.paramMap.get('companyCode');
  private codeParam = this.route.snapshot.paramMap.get('code');

  isEditMode = this.codeParam !== null && this.codeParam !== 'new' && this.companyCodeParam !== null;
  companyCode = this.isEditMode ? this.companyCodeParam?.trim().toUpperCase() ?? null : null;
  storeCode = this.isEditMode ? this.codeParam?.trim().toUpperCase() ?? null : null;

  companies = this.companyService.companies;

  saving = signal(false);
  loading = signal(false);
  logoPreview = signal<string | null>(null);
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
        return clean === 'divisionmaster' || clean === 'storemaster';
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

  auditTrail = computed(() => {
    if (!this.companyCode || !this.storeCode) return [];
    return this.storeService.auditTrailFor(this.companyCode, this.storeCode, 50);
  });

  selectedCompany = computed(() => {
    const code = this.form.get('companyCode')?.value?.trim().toUpperCase();
    if (!code) return null;
    return this.companies().find(c => c.code.toUpperCase() === code) ?? null;
  });

  storeTypeOptions = [
    { label: 'Physical Store / Retail Branch', value: 'Physical' },
    { label: 'Online Storefront / eCommerce', value: 'Online' },
    { label: 'Factory / Retail Outlet', value: 'Outlet' },
    { label: 'Warehouse / Fulfillment Hub', value: 'Warehouse' },
    { label: 'Pop-up / Event Kiosk', value: 'Pop-up' }
  ];

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

  currencyOptions = [
    { label: 'INR — Indian Rupee', value: 'INR' },
    { label: 'USD — US Dollar', value: 'USD' },
    { label: 'EUR — Euro', value: 'EUR' },
    { label: 'GBP — British Pound', value: 'GBP' },
    { label: 'AED — UAE Dirham', value: 'AED' },
    { label: 'SGD — Singapore Dollar', value: 'SGD' },
    { label: 'CAD — Canadian Dollar', value: 'CAD' },
    { label: 'AUD — Australian Dollar', value: 'AUD' }
  ];

  timeZoneOptions = [
    { label: 'Asia/Kolkata (IST, UTC+05:30)', value: 'Asia/Kolkata' },
    { label: 'America/New_York (EST, UTC-05:00)', value: 'America/New_York' },
    { label: 'America/Chicago (CST, UTC-06:00)', value: 'America/Chicago' },
    { label: 'America/Denver (MST, UTC-07:00)', value: 'America/Denver' },
    { label: 'America/Los_Angeles (PST, UTC-08:00)', value: 'America/Los_Angeles' },
    { label: 'Europe/London (GMT/BST, UTC+00:00)', value: 'Europe/London' },
    { label: 'Europe/Berlin (CET, UTC+01:00)', value: 'Europe/Berlin' },
    { label: 'Asia/Dubai (GST, UTC+04:00)', value: 'Asia/Dubai' },
    { label: 'Asia/Singapore (SGT, UTC+08:00)', value: 'Asia/Singapore' },
    { label: 'Asia/Tokyo (JST, UTC+09:00)', value: 'Asia/Tokyo' },
    { label: 'Australia/Sydney (AEST, UTC+10:00)', value: 'Australia/Sydney' },
    { label: 'UTC (Coordinated Universal Time)', value: 'UTC' }
  ];

  form = this.fb.group({
    companyCode: ['', [Validators.required]],
    code: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(4),
        Validators.pattern(/^[A-Za-z0-9]{2,4}$/)
      ]
    ],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    displayName: ['', [Validators.required, Validators.maxLength(200)]],
    storeType: ['Physical', [Validators.required]],
    logo: [''],
    addressLine1: ['', [Validators.required, Validators.maxLength(250)]],
    addressLine2: ['', [Validators.maxLength(250)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    stateCode: ['', [Validators.required, Validators.maxLength(20)]],
    countryCode: ['IN', [Validators.required]],
    postalCode: ['', [Validators.required, Validators.maxLength(20)]],
    contact: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(20),
        Validators.pattern(/^[+0-9\s\-()]{10,20}$/)
      ]
    ],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    website: ['', [Validators.maxLength(250)]],
    currencyCode: ['INR', [Validators.required]],
    timeZone: ['Asia/Kolkata', [Validators.required]],
    isTestStore: [false],
    isActive: [true]
  });

  async ngOnInit() {
    // Ensure company list is loaded for dropdown selection
    if (this.companies().length === 0) {
      await this.companyService.list();
    }

    if (!this.isEditMode) {
      this.initializeCreateMode();
      return;
    }

    await this.initializeEditMode();
  }

  private initializeCreateMode() {
    if (!this.permissions().canCreate) {
      this.toast.add({
        severity: 'warn',
        summary: 'Not permitted',
        detail: "You don't have permission to create stores."
      });
      this.cancel();
      return;
    }

    const defaultCompany = this.companies().length > 0 ? this.companies()[0].code : '';

    this.form.reset({
      ...emptyStore(),
      companyCode: defaultCompany,
      storeType: 'Physical',
      countryCode: 'IN',
      currencyCode: 'INR',
      timeZone: 'Asia/Kolkata',
      isActive: true,
      isTestStore: false
    });

    this.form.enable();
  }

  private async initializeEditMode() {
    if (!this.companyCode || !this.storeCode) {
      this.cancel();
      return;
    }

    this.loading.set(true);

    try {
      const existing = await this.storeService.getStore(this.companyCode, this.storeCode);

      if (!existing) {
        this.toast.add({
          severity: 'warn',
          summary: 'Store not found',
          detail: `Store [${this.companyCode} / ${this.storeCode}] could not be found.`
        });
        this.cancel();
        return;
      }

      this.form.patchValue({
        companyCode: existing.companyCode,
        code: existing.code,
        name: existing.name,
        displayName: existing.displayName,
        storeType: existing.storeType || 'Physical',
        logo: existing.logo ?? '',
        addressLine1: existing.addressLine1,
        addressLine2: existing.addressLine2 ?? '',
        city: existing.city,
        stateCode: existing.stateCode,
        countryCode: existing.countryCode,
        postalCode: existing.postalCode,
        contact: existing.contact,
        email: existing.email,
        website: existing.website ?? '',
        currencyCode: existing.currencyCode ?? 'INR',
        timeZone: existing.timeZone ?? 'Asia/Kolkata',
        isTestStore: existing.isTestStore,
        isActive: existing.isActive
      });

      if (existing.logo) {
        this.logoPreview.set(this.getLogoUrl(existing.logo));
      }

      if (this.permissions().canEdit) {
        this.form.enable();
        // Crucial requirement: Company and Store Code are locked / disabled in Edit mode
        this.form.get('companyCode')?.disable();
        this.form.get('code')?.disable();
      } else {
        this.form.disable();
      }
    } catch (error) {
      console.error('Failed to load store details:', error);
      this.toast.add({
        severity: 'error',
        summary: 'Load failed',
        detail: 'Unable to load store details from the server.'
      });
      this.cancel();
    } finally {
      this.loading.set(false);
    }
  }

  fieldInvalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  async onCodeBlur() {
    if (this.isEditMode) return;

    const companyCodeControl = this.form.get('companyCode');
    const storeCodeControl = this.form.get('code');

    const rawCompany = companyCodeControl?.value?.trim().toUpperCase() || '';
    const rawStore = storeCodeControl?.value?.trim().toUpperCase() || '';

    storeCodeControl?.setValue(rawStore, { emitEvent: false });

    if (!rawCompany) {
      this.codeAvailability.set(null);
      return;
    }

    if (rawStore.length < 2 || rawStore.length > 4) {
      this.codeAvailability.set(rawStore.length > 0 ? 'invalid' : null);
      return;
    }

    this.checkingCode.set(true);

    try {
      const exists = await this.storeService.checkCodeExists(rawCompany, rawStore);
      if (exists) {
        this.codeAvailability.set('taken');
        storeCodeControl?.setErrors({ codeTaken: true });
      } else {
        this.codeAvailability.set('available');
        if (storeCodeControl?.hasError('codeTaken')) {
          storeCodeControl.setErrors(null);
        }
      }
    } finally {
      this.checkingCode.set(false);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.toast.add({
        severity: 'warn',
        summary: 'Invalid file',
        detail: 'Please upload an image file (PNG, JPG, SVG, WebP).'
      });
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      this.toast.add({
        severity: 'warn',
        summary: 'File too large',
        detail: 'Please upload an image smaller than 2MB.'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.logoPreview.set(result);
      this.form.patchValue({ logo: result });
      this.form.get('logo')?.markAsDirty();
    };
    reader.readAsDataURL(file);
  }

  onUrlInput(event: any) {
    const url = event.target.value.trim();
    this.logoPreview.set(url ? url : null);
  }

  clearLogo() {
    this.logoPreview.set(null);
    this.form.patchValue({ logo: '' });
    this.form.get('logo')?.markAsDirty();
  }

  cancel() {
    this.router.navigate(['/dashboard/masters/store']);
  }

  async submit() {
    if (!this.canSubmit()) {
      this.toast.add({
        severity: 'warn',
        summary: 'Not permitted',
        detail: "You don't have permission to save stores."
      });
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.add({
        severity: 'warn',
        summary: 'Form incomplete',
        detail: 'Please check highlighted fields and fix errors before submitting.'
      });
      return;
    }

    const raw = this.form.getRawValue();

    const companyCode = (this.isEditMode ? this.companyCode : raw.companyCode)?.trim().toUpperCase();
    const storeCode = (this.isEditMode ? this.storeCode : raw.code)?.trim().toUpperCase();

    if (!companyCode) {
      this.toast.add({
        severity: 'error',
        summary: 'Missing Company',
        detail: 'Please select a Company.'
      });
      return;
    }

    if (!storeCode || storeCode.length < 2 || storeCode.length > 4) {
      this.toast.add({
        severity: 'error',
        summary: 'Invalid Code',
        detail: 'Store Code must be between 2 and 4 alphanumeric characters.'
      });
      return;
    }

    this.saving.set(true);

    const payload: Store = {
      companyCode,
      code: storeCode,
      name: raw.name!.trim(),
      displayName: raw.displayName!.trim(),
      storeType: raw.storeType!.trim(),
      addressLine1: raw.addressLine1!.trim(),
      addressLine2: raw.addressLine2?.trim() || null,
      city: raw.city!.trim(),
      stateCode: raw.stateCode!.trim(),
      countryCode: raw.countryCode!.trim().toUpperCase(),
      postalCode: raw.postalCode!.trim(),
      contact: raw.contact!.trim(),
      email: raw.email!.trim(),
      website: raw.website?.trim() || null,
      logo: raw.logo?.trim() || null,
      currencyCode: raw.currencyCode?.trim() || 'INR',
      timeZone: raw.timeZone?.trim() || 'Asia/Kolkata',
      isTestStore: raw.isTestStore ?? false,
      isActive: raw.isActive ?? true
    };

    try {
      await this.storeService.save(payload, !this.isEditMode);

      this.toast.add({
        severity: 'success',
        summary: this.isEditMode ? 'Store Updated' : 'Store Created',
        detail: `Store [${payload.companyCode} / ${payload.code} - ${payload.name}] was saved successfully.`
      });

      this.cancel();
    } catch (error: any) {
      console.error('Store save failed:', error);
      this.toast.add({
        severity: 'error',
        summary: this.isEditMode ? 'Update Failed' : 'Creation Failed',
        detail: error?.message || 'Failed to save store details. Please try again.'
      });
    } finally {
      this.saving.set(false);
    }
  }

  getLogoUrl(logo: string | null | undefined): string | null {
    if (!logo) return null;
    if (logo.startsWith('data:image/') || logo.startsWith('http://') || logo.startsWith('https://')) {
      return logo;
    }
    return `data:image/png;base64,${logo}`;
  }

  getFieldList(field: string | null | undefined): string[] {
    if (!field) return [];
    return field.split(',').map(f => f.trim()).filter(Boolean);
  }
}
