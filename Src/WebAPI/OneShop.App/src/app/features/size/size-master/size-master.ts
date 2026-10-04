import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SizeService } from '../services/size.service';
import { CompanyService } from '../../company/services/company.service';
import { Size, SizeInput } from '../models/size.model';

@Component({
  selector: 'app-size-master',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './size-master.html'
})
export class SizeMaster implements OnInit {
  private fb = inject(FormBuilder);
  private sizeService = inject(SizeService);
  private companyService = inject(CompanyService);
  private toast = inject(MessageService);

  loading = this.sizeService.loading;
  sizes = this.sizeService.sizes;
  companies = this.companyService.companies;

  selectedCompanyCode = signal<string>('');
  searchTerm = signal<string>('');
  showModal = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  saving = signal<boolean>(false);
  sizeToDelete = signal<Size | null>(null);
  selectedAuditSize = signal<Size | null>(null);

  form = this.fb.group({
    companyCode: ['', Validators.required],
    code: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    sortOrder: [0, [Validators.required]],
    isActive: [true]
  });

  permissions = computed(() => {
    const raw = localStorage.getItem('screenAccess');
    if (!raw) return { canView: true, canCreate: true, canEdit: true, canDelete: true };
    try {
      const screens: any[] = JSON.parse(raw);
      const entry = screens.find(s => {
        const name = s?.screen?.screen ?? s?.screen?.name ?? s?.screenName ?? '';
        const clean = String(name).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return clean === 'companymaster' || clean === 'items' || clean === 'sizemaster';
      });
      if (!entry) return { canView: true, canCreate: true, canEdit: true, canDelete: true };
      return { canView: !!entry.canView, canCreate: !!entry.canCreate, canEdit: !!entry.canEdit, canDelete: !!entry.canDelete };
    } catch {
      return { canView: true, canCreate: true, canEdit: true, canDelete: true };
    }
  });

  filteredSizes = computed(() => {
    let list = this.sizes();
    const comp = this.selectedCompanyCode();
    if (comp) {
      list = list.filter(s => s.companyCode.toUpperCase() === comp.toUpperCase());
    }
    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term)
      );
    }
    return list;
  });

  async ngOnInit() {
    await this.companyService.list();
    if (this.companies().length > 0) {
      this.selectedCompanyCode.set(this.companies()[0].code);
      await this.refresh();
    }
  }

  async onCompanyChange(code: string) {
    this.selectedCompanyCode.set(code);
    await this.refresh();
  }

  async refresh() {
    try {
      await this.sizeService.list(this.selectedCompanyCode() || undefined);
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Load Error', detail: err?.message || 'Failed to load sizes.' });
    }
  }

  openCreateModal() {
    this.isEditMode.set(false);
    const highestSort = this.sizes().length > 0 ? Math.max(...this.sizes().map(s => s.sortOrder)) + 1 : 1;
    this.form.reset({
      companyCode: this.selectedCompanyCode(),
      code: '',
      name: '',
      sortOrder: highestSort,
      isActive: true
    });
    this.form.get('code')?.enable();
    this.form.get('companyCode')?.enable();
    this.showModal.set(true);
  }

  openEditModal(s: Size) {
    this.isEditMode.set(true);
    this.form.reset({
      companyCode: s.companyCode,
      code: s.code,
      name: s.name,
      sortOrder: s.sortOrder,
      isActive: s.isActive
    });
    this.form.get('code')?.disable();
    this.form.get('companyCode')?.disable();
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  viewAudit(s: Size) {
    this.selectedAuditSize.set(s);
  }

  closeAudit() {
    this.selectedAuditSize.set(null);
  }

  confirmDelete(s: Size) {
    this.sizeToDelete.set(s);
  }

  cancelDelete() {
    this.sizeToDelete.set(null);
  }

  async executeDelete() {
    const s = this.sizeToDelete();
    if (!s) return;
    try {
      const res = await this.sizeService.delete(s.companyCode, s.code);
      if (res.success) {
        this.toast.add({ severity: 'success', summary: 'Deleted', detail: `Size ${s.name} deleted.` });
        this.cancelDelete();
      } else {
        this.toast.add({ severity: 'error', summary: 'Delete Failed', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Failed to delete size.' });
    }
  }

  async saveSize() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill in all required fields properly.' });
      return;
    }

    const raw = this.form.getRawValue();
    const payload: SizeInput = {
      companyCode: raw.companyCode!.trim().toUpperCase(),
      code: raw.code!.trim().toUpperCase(),
      name: raw.name!.trim(),
      sortOrder: Number(raw.sortOrder) || 0,
      isActive: !!raw.isActive
    };

    this.saving.set(true);
    try {
      const res = this.isEditMode()
        ? await this.sizeService.update(payload)
        : await this.sizeService.create(payload);

      if (res.success) {
        this.toast.add({ severity: 'success', summary: this.isEditMode() ? 'Size Updated' : 'Size Created', detail: res.message });
        this.closeModal();
      } else {
        this.toast.add({ severity: 'error', summary: 'Save Error', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Failed to save size.' });
    } finally {
      this.saving.set(false);
    }
  }
}
