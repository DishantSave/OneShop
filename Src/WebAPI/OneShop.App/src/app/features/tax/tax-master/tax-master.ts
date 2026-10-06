import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TaxService } from '../services/tax.service';
import { StateTax, StateTaxInput } from '../models/tax.model';

@Component({
  selector: 'app-tax-master',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './tax-master.html'
})
export class TaxMaster implements OnInit {
  private fb = inject(FormBuilder);
  private taxService = inject(TaxService);
  private toast = inject(MessageService);

  loading = this.taxService.loading;
  taxes = this.taxService.taxes;

  searchTerm = signal<string>('');
  showModal = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  saving = signal<boolean>(false);
  taxToDelete = signal<StateTax | null>(null);

  indianStates = [
    { code: 'AP', name: 'Andhra Pradesh' },
    { code: 'AR', name: 'Arunachal Pradesh' },
    { code: 'AS', name: 'Assam' },
    { code: 'BR', name: 'Bihar' },
    { code: 'CG', name: 'Chhattisgarh' },
    { code: 'DL', name: 'Delhi' },
    { code: 'GA', name: 'Goa' },
    { code: 'GJ', name: 'Gujarat' },
    { code: 'HR', name: 'Haryana' },
    { code: 'HP', name: 'Himachal Pradesh' },
    { code: 'JH', name: 'Jharkhand' },
    { code: 'KA', name: 'Karnataka' },
    { code: 'KL', name: 'Kerala' },
    { code: 'MP', name: 'Madhya Pradesh' },
    { code: 'MH', name: 'Maharashtra' },
    { code: 'MN', name: 'Manipur' },
    { code: 'ML', name: 'Meghalaya' },
    { code: 'MZ', name: 'Mizoram' },
    { code: 'NL', name: 'Nagaland' },
    { code: 'OR', name: 'Odisha' },
    { code: 'PB', name: 'Punjab' },
    { code: 'RJ', name: 'Rajasthan' },
    { code: 'SK', name: 'Sikkim' },
    { code: 'TN', name: 'Tamil Nadu' },
    { code: 'TS', name: 'Telangana' },
    { code: 'TR', name: 'Tripura' },
    { code: 'UP', name: 'Uttar Pradesh' },
    { code: 'UK', name: 'Uttarakhand' },
    { code: 'WB', name: 'West Bengal' }
  ];

  form = this.fb.group({
    countryCode: ['IN', Validators.required],
    stateCode: ['', [Validators.required, Validators.maxLength(10)]],
    stateName: ['', [Validators.required, Validators.maxLength(100)]],
    taxRate: [18, [Validators.required, Validators.min(0), Validators.max(100)]],
    taxType: ['GST (9% CGST + 9% SGST)', Validators.required],
    isActive: [true]
  });

  filteredTaxes = computed(() => {
    const list = this.taxes();
    const q = this.searchTerm().toLowerCase().trim();
    if (!q) return list;
    return list.filter(t =>
      t.stateCode.toLowerCase().includes(q) ||
      t.stateName.toLowerCase().includes(q) ||
      t.taxType.toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.taxService.loadTaxes();
  }

  onSelectStatePreset(event: Event) {
    const target = event.target as HTMLSelectElement;
    const code = target.value;
    const match = this.indianStates.find(s => s.code === code);
    if (match) {
      this.form.patchValue({
        stateCode: match.code,
        stateName: match.name
      });
    }
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.form.reset({
      countryCode: 'IN',
      stateCode: '',
      stateName: '',
      taxRate: 18,
      taxType: 'GST (9% CGST + 9% SGST)',
      isActive: true
    });
    this.showModal.set(true);
  }

  openEditModal(tax: StateTax) {
    this.isEditMode.set(true);
    this.form.reset({
      countryCode: tax.countryCode || 'IN',
      stateCode: tax.stateCode,
      stateName: tax.stateName,
      taxRate: tax.taxRate,
      taxType: tax.taxType || 'GST',
      isActive: tax.isActive
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async saveTax() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const input: StateTaxInput = {
      countryCode: raw.countryCode || 'IN',
      stateCode: raw.stateCode!.toUpperCase().trim(),
      stateName: raw.stateName!.trim(),
      taxRate: Number(raw.taxRate),
      taxType: raw.taxType || 'GST',
      isActive: raw.isActive ?? true
    };

    const res = await this.taxService.saveTax(input);
    this.saving.set(false);

    if (res.success) {
      this.toast.add({ severity: 'success', summary: 'Success', detail: res.message });
      this.closeModal();
    } else {
      this.toast.add({ severity: 'error', summary: 'Error', detail: res.message });
    }
  }

  confirmDelete(tax: StateTax) {
    this.taxToDelete.set(tax);
  }

  cancelDelete() {
    this.taxToDelete.set(null);
  }

  async deleteTax() {
    const tax = this.taxToDelete();
    if (!tax) return;

    this.saving.set(true);
    const res = await this.taxService.deleteTax(tax.stateCode, tax.countryCode);
    this.saving.set(false);
    this.taxToDelete.set(null);

    if (res.success) {
      this.toast.add({ severity: 'success', summary: 'Deleted', detail: res.message });
    } else {
      this.toast.add({ severity: 'error', summary: 'Error', detail: res.message });
    }
  }
}
