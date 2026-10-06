import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { PromoService } from '../services/promo.service';
import { PromoCode, PromoCodeInput } from '../models/promo.model';

@Component({
  selector: 'app-promo-master',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './promo-master.html'
})
export class PromoMaster implements OnInit {
  private fb = inject(FormBuilder);
  private promoService = inject(PromoService);
  private toast = inject(MessageService);

  loading = this.promoService.loading;
  promoCodes = this.promoService.promoCodes;

  searchTerm = signal<string>('');
  showModal = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  saving = signal<boolean>(false);
  promoToDelete = signal<PromoCode | null>(null);

  form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
    description: [''],
    discountType: ['Percentage', Validators.required],
    discountValue: [10, [Validators.required, Validators.min(0.01)]],
    minOrderAmount: [0, [Validators.min(0)]],
    maxDiscountAmount: [null as number | null],
    validFrom: [''],
    validUntil: [''],
    usageLimit: [0, [Validators.min(0)]],
    isActive: [true]
  });

  filteredPromos = computed(() => {
    const list = this.promoCodes();
    const q = this.searchTerm().toLowerCase().trim();
    if (!q) return list;
    return list.filter(p =>
      p.code.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  ngOnInit() {
    this.promoService.loadPromoCodes();
  }

  openAddModal() {
    this.isEditMode.set(false);
    const now = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(now.getFullYear() + 1);

    this.form.reset({
      code: '',
      description: '',
      discountType: 'Percentage',
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscountAmount: null,
      validFrom: now.toISOString().slice(0, 10),
      validUntil: oneYearLater.toISOString().slice(0, 10),
      usageLimit: 0,
      isActive: true
    });
    this.showModal.set(true);
  }

  openEditModal(promo: PromoCode) {
    this.isEditMode.set(true);
    this.form.reset({
      code: promo.code,
      description: promo.description || '',
      discountType: promo.discountType || 'Percentage',
      discountValue: promo.discountValue,
      minOrderAmount: promo.minOrderAmount || 0,
      maxDiscountAmount: promo.maxDiscountAmount ?? null,
      validFrom: promo.validFrom ? promo.validFrom.slice(0, 10) : '',
      validUntil: promo.validUntil ? promo.validUntil.slice(0, 10) : '',
      usageLimit: promo.usageLimit || 0,
      isActive: promo.isActive
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async savePromo() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const input: PromoCodeInput = {
      code: raw.code!.toUpperCase().trim(),
      description: raw.description?.trim(),
      discountType: raw.discountType || 'Percentage',
      discountValue: Number(raw.discountValue),
      minOrderAmount: Number(raw.minOrderAmount || 0),
      maxDiscountAmount: raw.maxDiscountAmount ? Number(raw.maxDiscountAmount) : undefined,
      validFrom: raw.validFrom ? new Date(raw.validFrom).toISOString() : undefined,
      validUntil: raw.validUntil ? new Date(raw.validUntil).toISOString() : undefined,
      usageLimit: Number(raw.usageLimit || 0),
      isActive: raw.isActive ?? true
    };

    const res = await this.promoService.savePromo(input);
    this.saving.set(false);

    if (res.success) {
      this.toast.add({ severity: 'success', summary: 'Success', detail: res.message });
      this.closeModal();
    } else {
      this.toast.add({ severity: 'error', summary: 'Error', detail: res.message });
    }
  }

  confirmDelete(promo: PromoCode) {
    this.promoToDelete.set(promo);
  }

  cancelDelete() {
    this.promoToDelete.set(null);
  }

  async deletePromo() {
    const promo = this.promoToDelete();
    if (!promo) return;

    this.saving.set(true);
    const res = await this.promoService.deletePromo(promo.code);
    this.saving.set(false);
    this.promoToDelete.set(null);

    if (res.success) {
      this.toast.add({ severity: 'success', summary: 'Deleted', detail: res.message });
    } else {
      this.toast.add({ severity: 'error', summary: 'Error', detail: res.message });
    }
  }
}
