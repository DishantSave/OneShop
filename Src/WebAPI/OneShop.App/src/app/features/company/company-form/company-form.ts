import { Component, computed, inject, signal } from '@angular/core';
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
export class CompanyForm {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(MessageService);

  saving = signal(false);
  logoPreview = signal<string | null>(null);

  private codeParam =
    this.route.snapshot.paramMap.get('code');

  isEditMode =
    this.codeParam !== null &&
    this.codeParam !== 'new';

  companyCode =
    this.isEditMode
      ? this.codeParam
      : null;

  permissions = computed(() => {
    const raw = localStorage.getItem('screenAccess');

    if (!raw) {
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true
      };
    }

    try {
      const screens: any[] = JSON.parse(raw);
      const entry = screens.find(s => {

        const name =
          s?.screen?.screen ??
          s?.screen?.name ??
          s?.screenName ??
          '';

        return String(name)
          .replace(/[^a-zA-Z0-9]/g, '')
          .toLowerCase() === 'companymaster';
      });

      if (!entry) {
        return {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true
        };
      }

      return {
        canView: !!entry.canView,
        canCreate: !!entry.canCreate,
        canEdit: !!entry.canEdit,
        canDelete: !!entry.canDelete
      };
    } catch {
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true
      };
    }
  });

  canSubmit = computed(() =>
    !this.isEditMode
      ? this.permissions().canCreate
      : this.permissions().canEdit
  );

  auditTrail = computed(() => {

    return this.companyCode
      ? this.companyService.auditTrailFor(
        this.companyCode,
        20
      )
      : [];
  });

  countryOptions = [
    { label: 'India', value: 'IN' },
    { label: 'United States', value: 'US' },
    { label: 'United Kingdom', value: 'UK' },
    { label: 'United Arab Emirates', value: 'AE' },
    { label: 'Singapore', value: 'SG' }
  ];

  currencyOptions = [
    { label: 'INR — Indian Rupee', value: 'INR' },
    { label: 'USD — US Dollar', value: 'USD' },
    { label: 'GBP — British Pound', value: 'GBP' },
    { label: 'AED — UAE Dirham', value: 'AED' },
    { label: 'SGD — Singapore Dollar', value: 'SGD' }
  ];

  timeZoneOptions = [
    {
      label: 'Asia/Kolkata (IST)',
      value: 'Asia/Kolkata'
    },
    {
      label: 'America/Los_Angeles (PST)',
      value: 'America/Los_Angeles'
    },
    {
      label: 'America/New_York (EST)',
      value: 'America/New_York'
    },
    {
      label: 'Europe/London (GMT)',
      value: 'Europe/London'
    },
    {
      label: 'Asia/Dubai (GST)',
      value: 'Asia/Dubai'
    },
    {
      label: 'Asia/Singapore (SGT)',
      value: 'Asia/Singapore'
    }
  ];

  form = this.fb.group({
    code: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(2)
      ]
    ],

    name: [
      '',
      [
        Validators.required,
        Validators.maxLength(200)
      ]
    ],

    displayName: [
      '',
      [
        Validators.required,
        Validators.maxLength(200)
      ]
    ],

    logoUrl: [
      '',
      [
        Validators.maxLength(500)
      ]
    ],

    addressLine1: [
      '',
      [
        Validators.required,
        Validators.maxLength(250)
      ]
    ],

    addressLine2: [
      '',
      [
        Validators.maxLength(250)
      ]
    ],

    city: [
      '',
      [
        Validators.required,
        Validators.maxLength(100)
      ]
    ],

    stateCode: [
      '',
      [
        Validators.required,
        Validators.maxLength(20)
      ]
    ],

    countryCode: [
      '',
      [
        Validators.required
      ]
    ],

    postalCode: [
      '',
      [
        Validators.required,
        Validators.maxLength(20)
      ]
    ],

    contact: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(20)
      ]
    ],

    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(200)
      ]
    ],

    website: [
      '',
      [
        Validators.maxLength(250)
      ]
    ],
    currencyCode: [''],
    timeZone: [''],
    isTestCompany: [false],
    isActive: [true]
  });

  constructor() {
    if (!this.isEditMode) {
      if (!this.permissions().canCreate) {
        this.toast.add({
          severity: 'warn',
          summary: 'Not permitted',
          detail:
            "You don't have permission to create companies."
        });

        this.cancel();
        return;
      }

      this.form.reset({
        ...emptyCompany(),
        isActive: true,
        isTestCompany: false
      });

      this.form.enable();

    } else {

      const existing =
        this.companyService.getByCode(
          this.companyCode!
        );

      if (!existing) {

        this.toast.add({
          severity: 'warn',
          summary: 'Company not found',
          detail: this.companyCode!
        });

        this.cancel();
        return;
      }

      this.form.reset(existing);

      if (existing.logo) {
        this.logoPreview.set(
          existing.logo
        );
      }

      if (this.permissions().canEdit) {
        this.form.enable();
        this.form.get('code')!.disable();
      } else {
        this.form.disable();
      }
    }
  }

  fieldInvalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control &&
      control.invalid &&
      (control.touched || control.dirty);
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
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.logoPreview.set(result);
      this.form.patchValue({ logoUrl: result });
    };
    reader.readAsDataURL(file);
  }

  onUrlInput(event: any) {
    const url = event.target.value.trim();
    this.logoPreview.set(url ? url : null);
  }

  clearLogo() {
    this.logoPreview.set(null);
    this.form.patchValue({ logoUrl: '' });
  }

  cancel() {
    this.router.navigate(
      ['../'],
      {
        relativeTo: this.route
      }
    );
  }

  async submit() {
    if (!this.canSubmit()) {
      this.toast.add({
        severity: 'warn',
        summary: 'Not permitted',
        detail:
          "You don't have permission to do that."
      });
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.add({
        severity: 'warn',
        summary: 'Check the form',
        detail:
          'Some required fields are missing or invalid.'
      });

      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      ...raw,
      code: raw.code!.toUpperCase()
    } as Company;

    try {
      await this.companyService.save(
        payload,
        !this.isEditMode
      );

      this.toast.add({
        severity: 'success',
        summary: this.isEditMode
          ? 'Company updated'
          : 'Company created',
        detail: payload.name
      });

      this.cancel();
    } catch {
      this.toast.add({
        severity: 'error',
        summary: 'Save failed',
        detail: 'Please try again.'
      });
    } finally {
      this.saving.set(false);
    }
  }
}
