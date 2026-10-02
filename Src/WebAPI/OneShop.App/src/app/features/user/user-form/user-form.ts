import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UserService } from '../services/user.service';
import {
  ALL_SUBACCOUNT_SCREENS,
  ScreenDefinition,
  SubAccount,
  SubAccountAuditTrail,
  SubAccountScreenAccess,
  TEAM_PRESETS,
  TeamPreset
} from '../models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './user-form.html'
})
export class UserForm implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(MessageService);

  private userNameParam = this.route.snapshot.paramMap.get('userName');
  isEditMode = this.userNameParam !== null && this.userNameParam !== 'new';
  targetUserName = this.isEditMode ? this.userNameParam?.trim() ?? null : null;

  saving = signal(false);
  loading = signal(false);
  checkingUserName = signal(false);
  userNameAvailability = signal<'available' | 'taken' | 'invalid' | null>(null);

  screens: ScreenDefinition[] = ALL_SUBACCOUNT_SCREENS;
  teamPresets: TeamPreset[] = TEAM_PRESETS;
  selectedPresetId = signal<string | null>(null);

  activeTab = signal<'profile' | 'permissions' | 'audit'>('profile');

  screenPermissions = signal<Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>>({});
  auditTrail = signal<SubAccountAuditTrail[]>([]);

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

  departmentOptions = [
    'Sales',
    'BI & Analytics',
    'Finance',
    'Customer Support',
    'Warehouse',
    'Operations',
    'Marketing',
    'Information Technology'
  ];

  form: FormGroup = this.fb.group({
    userName: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9._-]+$/)
      ]
    ],
    password: [''],
    designation: ['', [Validators.maxLength(100)]],
    department: ['Sales'],
    company: [''],
    profilePicture: [''],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    contact: ['', [Validators.required, Validators.pattern(/^[+0-9\s\-()]{10,20}$/)]],
    country: ['IN', [Validators.required]],
    isTestAccount: [false],
    isActive: [true]
  });

  ngOnInit() {
    this.initScreenPermissions();

    if (this.isEditMode && this.targetUserName) {
      this.loadUser(this.targetUserName);
    } else {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.form.get('password')?.updateValueAndValidity();
      this.applyPreset('sales');
    }
  }

  private initScreenPermissions() {
    const initial: Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }> = {};
    for (const sc of this.screens) {
      initial[sc.name] = {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false
      };
    }
    this.screenPermissions.set(initial);
  }

  async loadUser(userName: string) {
    this.loading.set(true);

    // If already available in client memory, pre-populate immediately
    const existing = this.userService.users().find(u => u.userName.toUpperCase() === userName.toUpperCase());
    if (existing) {
      this.populateUser(existing);
    }

    try {
      const user = await this.userService.getByUserName(userName);
      if (user) {
        this.populateUser(user);
      } else if (!existing) {
        this.toast.add({
          severity: 'error',
          summary: 'Not Found',
          detail: `Sub-account '${userName}' could not be found.`
        });
        this.navigateBack();
        return;
      }
    } catch (err: any) {
      console.error('Failed to load user:', err);
      if (!existing) {
        this.toast.add({
          severity: 'error',
          summary: 'Load Error',
          detail: err?.message || 'Failed to load sub-account details.'
        });
      }
    } finally {
      this.loading.set(false);
    }
  }

  private populateUser(user: SubAccount) {
    this.form.patchValue({
      userName: user.userName,
      designation: user.designation || '',
      department: user.department || 'Sales',
      company: user.company || '',
      profilePicture: user.profilePicture || '',
      email: user.email,
      contact: user.contact,
      country: user.country || 'IN',
      isTestAccount: user.isTestAccount,
      isActive: user.isActive
    });

    const normalize = (k: string) => (k || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const perms: Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }> = {};
    for (const sc of this.screens) {
      const found = (user.screenAccess || []).find(p => normalize(p.screenName) === normalize(sc.name));
      perms[sc.name] = {
        canView: found ? found.canView : false,
        canCreate: found ? found.canCreate : false,
        canEdit: found ? found.canEdit : false,
        canDelete: found ? found.canDelete : false
      };
    }
    this.screenPermissions.set(perms);
    this.auditTrail.set(user.auditTrail || user.audit || []);

    const matchedPreset = this.teamPresets.find(p => p.department.toLowerCase() === (user.department || '').toLowerCase());
    if (matchedPreset) {
      this.selectedPresetId.set(matchedPreset.id);
    }
  }

  applyPreset(presetId: string) {
    const preset = this.teamPresets.find(p => p.id === presetId);
    if (!preset) return;

    this.selectedPresetId.set(presetId);
    this.form.patchValue({ department: preset.department });

    const current = { ...this.screenPermissions() };
    for (const sc of this.screens) {
      const perm = preset.defaultPermissions.find(p => p.screenName.toLowerCase() === sc.name.toLowerCase());
      if (perm) {
        current[sc.name] = {
          canView: perm.canView,
          canCreate: perm.canCreate,
          canEdit: perm.canEdit,
          canDelete: perm.canDelete
        };
      } else {
        current[sc.name] = { canView: false, canCreate: false, canEdit: false, canDelete: false };
      }
    }
    this.screenPermissions.set(current);

    this.toast.add({
      severity: 'info',
      summary: 'Preset Applied',
      detail: `Configured permissions for ${preset.name}.`,
      life: 2500
    });
  }

  grantAllPermissions() {
    this.selectedPresetId.set('custom');
    const updated: Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }> = {};
    for (const sc of this.screens) {
      updated[sc.name] = { canView: true, canCreate: true, canEdit: true, canDelete: true };
    }
    this.screenPermissions.set(updated);
  }

  clearAllPermissions() {
    this.selectedPresetId.set('custom');
    const updated: Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }> = {};
    for (const sc of this.screens) {
      updated[sc.name] = { canView: false, canCreate: false, canEdit: false, canDelete: false };
    }
    this.screenPermissions.set(updated);
  }

  toggleScreenMaster(screenName: string) {
    this.selectedPresetId.set('custom');
    const current = { ...this.screenPermissions() };
    const cur = current[screenName];
    const enableAll = !(cur.canView && cur.canCreate && cur.canEdit && cur.canDelete);

    current[screenName] = {
      canView: enableAll,
      canCreate: enableAll,
      canEdit: enableAll,
      canDelete: enableAll
    };
    this.screenPermissions.set(current);
  }

  togglePermission(screenName: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') {
    this.selectedPresetId.set('custom');
    const current = { ...this.screenPermissions() };
    const cur = { ...current[screenName] };

    cur[action] = !cur[action];

    if (action === 'canView' && !cur.canView) {
      cur.canCreate = false;
      cur.canEdit = false;
      cur.canDelete = false;
    }
    if ((action === 'canCreate' || action === 'canEdit' || action === 'canDelete') && cur[action]) {
      cur.canView = true;
    }

    current[screenName] = cur;
    this.screenPermissions.set(current);
  }

  async checkUserNameUniqueness() {
    if (this.isEditMode) return;
    const ctrl = this.form.get('userName');
    if (!ctrl || ctrl.invalid) {
      this.userNameAvailability.set(null);
      return;
    }

    const val = ctrl.value?.trim();
    if (!val || val.length < 3) {
      this.userNameAvailability.set('invalid');
      return;
    }

    this.checkingUserName.set(true);
    try {
      const exists = await this.userService.checkUserNameExists(val);
      this.userNameAvailability.set(exists ? 'taken' : 'available');
    } catch {
      this.userNameAvailability.set(null);
    } finally {
      this.checkingUserName.set(false);
    }
  }

  enabledScreensCount = computed(() => {
    const perms = this.screenPermissions();
    return Object.values(perms).filter(p => p.canView).length;
  });

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.add({
        severity: 'warn',
        summary: 'Validation Required',
        detail: 'Please complete all required fields correctly.'
      });
      return;
    }

    if (!this.isEditMode && this.userNameAvailability() === 'taken') {
      this.toast.add({
        severity: 'error',
        summary: 'Username Taken',
        detail: 'This username is already taken. Please choose another.'
      });
      return;
    }

    this.saving.set(true);
    try {
      const formVal = this.form.getRawValue();
      const perms = this.screenPermissions();

      const screenAccessInput: SubAccountScreenAccess[] = Object.keys(perms).map(screenName => ({
        screenName,
        canView: perms[screenName].canView,
        canCreate: perms[screenName].canCreate,
        canEdit: perms[screenName].canEdit,
        canDelete: perms[screenName].canDelete
      }));

      const input = {
        userName: formVal.userName.trim(),
        password: formVal.password?.trim() ? formVal.password.trim() : null,
        designation: formVal.designation?.trim() || null,
        department: formVal.department?.trim() || null,
        company: formVal.company?.trim() || '',
        profilePicture: formVal.profilePicture?.trim() || null,
        email: formVal.email.trim(),
        contact: formVal.contact.trim(),
        country: formVal.country.trim().toUpperCase(),
        isTestAccount: !!formVal.isTestAccount,
        isActive: !!formVal.isActive,
        screenAccess: screenAccessInput
      };

      if (!this.isEditMode) {
        const res = await this.userService.create(input);
        if (res.success) {
          this.toast.add({
            severity: 'success',
            summary: 'Created',
            detail: `Sub-account '${input.userName}' created successfully.`
          });
          this.navigateBack();
        } else {
          this.toast.add({
            severity: 'error',
            summary: 'Creation Failed',
            detail: res.message || 'Unable to create sub-account.'
          });
        }
      } else {
        const res = await this.userService.update(input);
        if (res.success) {
          this.toast.add({
            severity: 'success',
            summary: 'Updated',
            detail: `Sub-account '${input.userName}' updated successfully.`
          });
          this.navigateBack();
        } else {
          this.toast.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: res.message || 'Unable to update sub-account.'
          });
        }
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      this.toast.add({
        severity: 'error',
        summary: 'Error',
        detail: err?.message || 'An error occurred while saving.'
      });
    } finally {
      this.saving.set(false);
    }
  }

  navigateBack() {
    this.router.navigate(['/dashboard/users']);
  }
}
