import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CompanyService } from '../services/company.service';
import { Company, emptyCompany } from '../models/company.model';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule
  ],
  templateUrl: './company-form.html'
})
export class CompanyForm implements OnInit {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(MessageService);

  private codeParam = this.route.snapshot.paramMap.get('code');
  isEditMode = this.codeParam !== null && this.codeParam !== 'new';
  companyCode = this.isEditMode ? this.codeParam?.trim().toUpperCase() ?? null : null;

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
        return String(name).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === 'companymaster';
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
    return this.companyCode ? this.companyService.auditTrailFor(this.companyCode, 50) : [];
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
    code: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(2),
        Validators.pattern(/^[A-Za-z0-9]{2}$/)
      ]
    ],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    displayName: ['', [Validators.required, Validators.maxLength(200)]],
    logo: [''],
    addressLine1: ['', [Validators.required, Validators.maxLength(250)]],
    addressLine2: ['', [Validators.maxLength(250)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    stateCode: ['', [Validators.required, Validators.maxLength(20)]],
    countryCode: ['', [Validators.required]],
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
    currencyCode: ['', [Validators.required]],
    timeZone: ['', [Validators.required]],
    isTestCompany: [false],
    isActive: [true]
  });

  async ngOnInit() {
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
        detail: "You don't have permission to create companies."
      });
      this.cancel();
      return;
    }

    this.form.reset({
      ...emptyCompany(),
      countryCode: 'IN',
      currencyCode: 'INR',
      timeZone: 'Asia/Kolkata',
      isActive: true,
      isTestCompany: false
    });

    this.form.enable();
  }

  private async initializeEditMode() {
    if (!this.companyCode) {
      this.cancel();
      return;
    }

    this.loading.set(true);

    try {
      const existing = await this.companyService.getCompany(this.companyCode);

      if (!existing) {
        this.toast.add({
          severity: 'warn',
          summary: 'Company not found',
          detail: `Company [${this.companyCode}] could not be found.`
        });
        this.cancel();
        return;
      }

      this.form.patchValue({
        code: existing.code,
        name: existing.name,
        displayName: existing.displayName,
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
        isTestCompany: existing.isTestCompany,
        isActive: existing.isActive
      });

      if (existing.logo) {
        this.logoPreview.set(this.getLogoUrl(existing.logo));
      }

      if (this.permissions().canEdit) {
        this.form.enable();
        this.form.get('code')?.disable(); // Code is immutable in edit mode
      } else {
        this.form.disable();
      }
    } catch (error) {
      console.error('Failed to load company details:', error);
      this.toast.add({
        severity: 'error',
        summary: 'Load failed',
        detail: 'Unable to load company details from the server.'
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

    const control = this.form.get('code');
    const rawVal = control?.value?.trim().toUpperCase() || '';
    control?.setValue(rawVal, { emitEvent: false });

    if (rawVal.length !== 2) {
      this.codeAvailability.set(rawVal.length > 0 ? 'invalid' : null);
      return;
    }

    this.checkingCode.set(true);

    try {
      const exists = await this.companyService.checkCodeExists(rawVal);
      if (exists) {
        this.codeAvailability.set('taken');
        control?.setErrors({ codeTaken: true });
      } else {
        this.codeAvailability.set('available');
        if (control?.hasError('codeTaken')) {
          control.setErrors(null);
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
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  async submit() {
    if (!this.canSubmit()) {
      this.toast.add({
        severity: 'warn',
        summary: 'Not permitted',
        detail: "You don't have permission to save companies."
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

    const companyCode = (this.isEditMode ? this.companyCode : raw.code)?.trim().toUpperCase();
    if (!companyCode || companyCode.length !== 2) {
      this.toast.add({
        severity: 'error',
        summary: 'Invalid Code',
        detail: 'Company Code must be exactly 2 alphanumeric characters.'
      });
      return;
    }

    this.saving.set(true);

    const payload: Company = {
      code: companyCode,
      name: raw.name!.trim(),
      displayName: raw.displayName!.trim(),
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
      isTestCompany: raw.isTestCompany ?? false,
      isActive: raw.isActive ?? true
    };

    try {
      await this.companyService.save(payload, !this.isEditMode);

      this.toast.add({
        severity: 'success',
        summary: this.isEditMode ? 'Company Updated' : 'Company Created',
        detail: `Company [${payload.code} - ${payload.name}] was saved successfully.`
      });

      this.cancel();
    } catch (error: any) {
      console.error('Company save failed:', error);
      this.toast.add({
        severity: 'error',
        summary: this.isEditMode ? 'Update Failed' : 'Creation Failed',
        detail: error?.message || 'Failed to save company details. Please try again.'
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
