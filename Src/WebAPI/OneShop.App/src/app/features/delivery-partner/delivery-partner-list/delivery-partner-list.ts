import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DeliveryPartnerService } from '../services/delivery-partner.service';
import { CompanyService } from '../../company/services/company.service';
import { Access } from '../../../core/services/access';
import { DeliveryPartner, DeliveryPartnerInput } from '../../orders/models/order.model';

@Component({
  selector: 'app-delivery-partner-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './delivery-partner-list.html'
})
export class DeliveryPartnerList implements OnInit {
  private partnerService = inject(DeliveryPartnerService);
  private companyService = inject(CompanyService);
  private access = inject(Access);
  private fb = inject(FormBuilder);

  partners = this.partnerService.partners;
  loading = this.partnerService.loading;
  companies = this.companyService.companies;

  selectedCompany = signal<string>('');
  selectedChannel = signal<string>('');

  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingSequence = signal<number | null>(null);
  submitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  partnerForm = this.fb.group({
    companyCode: ['', [Validators.required]],
    partnerName: ['', [Validators.required, Validators.minLength(2)]],
    channel: ['B2C', [Validators.required]],
    itemCategory: ['ALL'],
    baseShippingRate: [5.00, [Validators.required, Validators.min(0)]],
    perItemShippingRate: [1.00, [Validators.required, Validators.min(0)]],
    freeShippingThreshold: [500.00, [Validators.required, Validators.min(0)]],
    estimatedDays: [3, [Validators.required, Validators.min(1)]],
    isDefault: [true],
    isActive: [true]
  });

  async ngOnInit() {
    await this.companyService.list();
    if (this.companies().length > 0) {
      this.selectedCompany.set(this.companies()[0].code);
      this.partnerForm.patchValue({ companyCode: this.companies()[0].code });
    }
    await this.loadPartners();
  }

  async loadPartners() {
    await this.partnerService.list(this.selectedCompany() || undefined, this.selectedChannel() || undefined);
  }

  onCompanyFilterChange(comp: string) {
    this.selectedCompany.set(comp);
    this.loadPartners();
  }

  onChannelFilterChange(channel: string) {
    this.selectedChannel.set(channel);
    this.loadPartners();
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.editingSequence.set(null);
    this.errorMessage.set(null);
    this.partnerForm.reset({
      companyCode: this.selectedCompany() || (this.companies()[0]?.code ?? ''),
      partnerName: '',
      channel: 'B2C',
      itemCategory: 'ALL',
      baseShippingRate: 5.00,
      perItemShippingRate: 1.00,
      freeShippingThreshold: 500.00,
      estimatedDays: 3,
      isDefault: false,
      isActive: true
    });
    this.showModal.set(true);
  }

  openEditModal(p: DeliveryPartner) {
    this.isEditing.set(true);
    this.editingSequence.set(p.sequence);
    this.errorMessage.set(null);
    this.partnerForm.patchValue({
      companyCode: p.companyCode,
      partnerName: p.partnerName,
      channel: p.channel,
      itemCategory: p.itemCategory || 'ALL',
      baseShippingRate: p.baseShippingRate,
      perItemShippingRate: p.perItemShippingRate,
      freeShippingThreshold: p.freeShippingThreshold,
      estimatedDays: p.estimatedDays,
      isDefault: p.isDefault,
      isActive: p.isActive
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.errorMessage.set(null);
  }

  async savePartner() {
    if (this.partnerForm.invalid) {
      this.partnerForm.markAllAsTouched();
      return;
    }

    const val = this.partnerForm.getRawValue();
    const input: DeliveryPartnerInput = {
      sequence: this.isEditing() ? (this.editingSequence() ?? undefined) : undefined,
      companyCode: val.companyCode!.trim().toUpperCase(),
      partnerName: val.partnerName!.trim(),
      channel: val.channel!,
      itemCategory: val.itemCategory?.trim() || 'ALL',
      baseShippingRate: Number(val.baseShippingRate || 0),
      perItemShippingRate: Number(val.perItemShippingRate || 0),
      freeShippingThreshold: Number(val.freeShippingThreshold || 500),
      estimatedDays: Number(val.estimatedDays || 3),
      isDefault: !!val.isDefault,
      isActive: !!val.isActive
    };

    this.submitting.set(true);
    this.errorMessage.set(null);

    const res = await this.partnerService.save(input);
    this.submitting.set(false);

    if (res.success) {
      this.successMessage.set(res.message);
      setTimeout(() => this.successMessage.set(null), 4000);
      this.closeModal();
      await this.loadPartners();
    } else {
      this.errorMessage.set(res.message);
    }
  }

  async deletePartner(p: DeliveryPartner) {
    if (!confirm(`Are you sure you want to delete delivery partner "${p.partnerName}" (${p.companyCode})?`)) {
      return;
    }

    const res = await this.partnerService.delete(p.sequence, p.companyCode);
    if (res.success) {
      this.successMessage.set(res.message);
      setTimeout(() => this.successMessage.set(null), 4000);
      await this.loadPartners();
    } else {
      alert(res.message);
    }
  }
}
