import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Theme, ThemeType } from '../../core/services/theme';
import { AddressService } from './services/address.service';
import { UserAddress, UserAddressInput } from './models/address.model';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ToggleSwitchModule,
    SelectModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './settings.html'
})
export class Setting implements OnInit {
  private themeService = inject(Theme);
  public addressService = inject(AddressService);
  private fb = inject(FormBuilder);
  private toast = inject(MessageService);

  companyName = '';
  email = '';

  // Address signals
  addresses = this.addressService.addresses;
  loadingAddresses = this.addressService.loading;
  showAddressModal = signal<boolean>(false);
  isEditAddressMode = signal<boolean>(false);
  savingAddress = signal<boolean>(false);
  addressToDelete = signal<UserAddress | null>(null);

  addressForm = this.fb.group({
    addressId: [''],
    addressType: ['Office', Validators.required],
    contactName: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    addressLine1: ['', Validators.required],
    addressLine2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    postalCode: ['', Validators.required],
    country: ['India', Validators.required],
    isDefault: [false]
  });

  notificationOptions = [
    { key: 'opt1', label: 'Order Confirmation', enabled: true },
    { key: 'opt2', label: 'Dispatch & Shipping Alerts', enabled: true },
    { key: 'opt3', label: 'Inventory Low Stock', enabled: false },
    { key: 'opt4', label: 'Payment Receipts', enabled: true },
    { key: 'opt5', label: 'Customer Reviews', enabled: false },
    { key: 'opt6', label: 'Weekly Summary', enabled: false }
  ];

  themes: { key: ThemeType; label: string }[] = [
    { key: 'light-theme', label: 'Light' },
    { key: 'dark-theme', label: 'Dark' },
    { key: 'neonocean-theme', label: 'Neon Ocean' },
    { key: 'solarflare-theme', label: 'Solar Flare' },
    { key: 'sunsetblush-theme', label: 'Sunset Blush' }
  ];

  selectedTheme: ThemeType = 'light-theme';

  constructor() {
    this.themeService.theme$.subscribe(theme => (this.selectedTheme = theme));
  }

  ngOnInit() {
    this.addressService.loadAddresses();
    const userStr = localStorage.getItem('userDetails');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        this.companyName = u.company || u.companyName || '';
        this.email = u.email || '';
      } catch {}
    }
  }

  changeTheme(theme: ThemeType) {
    this.themeService.setTheme(theme);
  }

  saveChanges() {
    this.toast.add({ severity: 'success', summary: 'Saved', detail: 'General preferences updated.' });
  }

  openAddAddressModal() {
    this.isEditAddressMode.set(false);
    this.addressForm.reset({
      addressId: '',
      addressType: 'Office',
      contactName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: this.addresses().length === 0
    });
    this.showAddressModal.set(true);
  }

  openEditAddressModal(addr: UserAddress) {
    this.isEditAddressMode.set(true);
    this.addressForm.reset({
      addressId: addr.addressId,
      addressType: addr.addressType,
      contactName: addr.contactName,
      phone: addr.phone || '',
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country || 'India',
      isDefault: addr.isDefault
    });
    this.showAddressModal.set(true);
  }

  closeAddressModal() {
    this.showAddressModal.set(false);
  }

  async saveAddress() {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.savingAddress.set(true);
    const raw = this.addressForm.getRawValue();
    const input: UserAddressInput = {
      addressId: raw.addressId ? raw.addressId.trim() : undefined,
      addressType: raw.addressType || 'Office',
      contactName: raw.contactName!.trim(),
      phone: raw.phone?.trim(),
      addressLine1: raw.addressLine1!.trim(),
      addressLine2: raw.addressLine2?.trim(),
      city: raw.city!.trim(),
      state: raw.state!.trim(),
      postalCode: raw.postalCode!.trim(),
      country: raw.country?.trim() || 'India',
      isDefault: raw.isDefault ?? false
    };

    const res = await this.addressService.saveAddress(input);
    this.savingAddress.set(false);

    if (res.success) {
      this.toast.add({ severity: 'success', summary: 'Success', detail: res.message });
      this.closeAddressModal();
    } else {
      this.toast.add({ severity: 'error', summary: 'Error', detail: res.message });
    }
  }

  confirmDeleteAddress(addr: UserAddress) {
    this.addressToDelete.set(addr);
  }

  cancelDeleteAddress() {
    this.addressToDelete.set(null);
  }

  async deleteAddress() {
    const addr = this.addressToDelete();
    if (!addr) return;

    this.savingAddress.set(true);
    const res = await this.addressService.deleteAddress(addr.addressId);
    this.savingAddress.set(false);
    this.addressToDelete.set(null);

    if (res.success) {
      this.toast.add({ severity: 'success', summary: 'Deleted', detail: res.message });
    } else {
      this.toast.add({ severity: 'error', summary: 'Error', detail: res.message });
    }
  }

  async setAsDefault(addr: UserAddress) {
    const res = await this.addressService.setDefault(addr.addressId);
    if (res.success) {
      this.toast.add({ severity: 'success', summary: 'Updated', detail: `${addr.addressType} set as default address.` });
    } else {
      this.toast.add({ severity: 'error', summary: 'Error', detail: res.message });
    }
  }
}
