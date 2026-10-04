import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ColourService } from '../services/colour.service';
import { CompanyService } from '../../company/services/company.service';
import { Colour, ColourInput } from '../models/colour.model';

@Component({
  selector: 'app-colour-master',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './colour-master.html'
})
export class ColourMaster implements OnInit {
  private fb = inject(FormBuilder);
  private colourService = inject(ColourService);
  private companyService = inject(CompanyService);
  private toast = inject(MessageService);

  loading = this.colourService.loading;
  colours = this.colourService.colours;
  companies = this.companyService.companies;

  selectedCompanyCode = signal<string>('');
  searchTerm = signal<string>('');
  showModal = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  saving = signal<boolean>(false);
  colourToDelete = signal<Colour | null>(null);
  selectedAuditColour = signal<Colour | null>(null);

  currentColorHex = signal<string>('#2563eb');

  presetColors = [
    { name: 'Black', hex: '#000000' },
    { name: 'Charcoal', hex: '#334155' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Navy Blue', hex: '#1e3a8a' },
    { name: 'Royal Blue', hex: '#2563eb' },
    { name: 'Sky Blue', hex: '#0ea5e9' },
    { name: 'Teal', hex: '#0d9488' },
    { name: 'Emerald', hex: '#059669' },
    { name: 'Amber Gold', hex: '#d97706' },
    { name: 'Coral Red', hex: '#ea580c' },
    { name: 'Crimson', hex: '#dc2626' },
    { name: 'Burgundy', hex: '#881337' },
    { name: 'Purple', hex: '#7c3aed' },
    { name: 'Rose Pink', hex: '#db2777' },
    { name: 'Khaki Beige', hex: '#d4b996' }
  ];

  form = this.fb.group({
    companyCode: ['', Validators.required],
    code: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    hexCode: ['#2563eb', [Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)]],
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
        return clean === 'companymaster' || clean === 'items' || clean === 'colourmaster';
      });
      if (!entry) return { canView: true, canCreate: true, canEdit: true, canDelete: true };
      return { canView: !!entry.canView, canCreate: !!entry.canCreate, canEdit: !!entry.canEdit, canDelete: !!entry.canDelete };
    } catch {
      return { canView: true, canCreate: true, canEdit: true, canDelete: true };
    }
  });

  filteredColours = computed(() => {
    let list = this.colours();
    const comp = this.selectedCompanyCode();
    if (comp) {
      list = list.filter(c => c.companyCode.toUpperCase() === comp.toUpperCase());
    }
    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term) ||
        (c.hexCode && c.hexCode.toLowerCase().includes(term))
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
      await this.colourService.list(this.selectedCompanyCode() || undefined);
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Load Error', detail: err?.message || 'Failed to load colours.' });
    }
  }

  onColorPickerInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    this.currentColorHex.set(val);
    this.form.get('hexCode')?.setValue(val);
  }

  onHexTextInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let raw = input.value.trim();
    if (raw && !raw.startsWith('#')) {
      raw = '#' + raw;
    }
    this.form.get('hexCode')?.setValue(raw);

    if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
      this.currentColorHex.set(raw.toLowerCase());
    } else if (/^#[0-9A-Fa-f]{3}$/.test(raw)) {
      const r = raw[1], g = raw[2], b = raw[3];
      this.currentColorHex.set(`#${r}${r}${g}${g}${b}${b}`.toLowerCase());
    }
  }

  selectPresetColor(hex: string) {
    this.currentColorHex.set(hex.toLowerCase());
    this.form.get('hexCode')?.setValue(hex);
  }

  private normalizeHex(hex: string | null | undefined): string {
    if (!hex) return '#2563eb';
    let clean = hex.trim();
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) return clean.toLowerCase();
    if (/^#[0-9A-Fa-f]{3}$/.test(clean)) {
      const r = clean[1], g = clean[2], b = clean[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return '#2563eb';
  }

  openCreateModal() {
    this.isEditMode.set(false);
    const defaultHex = '#2563eb';
    this.currentColorHex.set(defaultHex);
    this.form.reset({
      companyCode: this.selectedCompanyCode(),
      code: '',
      name: '',
      hexCode: defaultHex,
      isActive: true
    });
    this.form.get('code')?.enable();
    this.form.get('companyCode')?.enable();
    this.showModal.set(true);
  }

  openEditModal(c: Colour) {
    this.isEditMode.set(true);
    const hex = this.normalizeHex(c.hexCode);
    this.currentColorHex.set(hex);
    this.form.reset({
      companyCode: c.companyCode,
      code: c.code,
      name: c.name,
      hexCode: c.hexCode || hex,
      isActive: c.isActive
    });
    this.form.get('code')?.disable();
    this.form.get('companyCode')?.disable();
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  viewAudit(c: Colour) {
    this.selectedAuditColour.set(c);
  }

  closeAudit() {
    this.selectedAuditColour.set(null);
  }

  confirmDelete(c: Colour) {
    this.colourToDelete.set(c);
  }

  cancelDelete() {
    this.colourToDelete.set(null);
  }

  async executeDelete() {
    const c = this.colourToDelete();
    if (!c) return;
    try {
      const res = await this.colourService.delete(c.companyCode, c.code);
      if (res.success) {
        this.toast.add({ severity: 'success', summary: 'Deleted', detail: `Colour ${c.name} deleted.` });
        this.cancelDelete();
      } else {
        this.toast.add({ severity: 'error', summary: 'Delete Failed', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Failed to delete colour.' });
    }
  }

  async saveColour() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill in all required fields properly.' });
      return;
    }

    const raw = this.form.getRawValue();
    const payload: ColourInput = {
      companyCode: raw.companyCode!.trim().toUpperCase(),
      code: raw.code!.trim().toUpperCase(),
      name: raw.name!.trim(),
      hexCode: raw.hexCode?.trim() || undefined,
      isActive: !!raw.isActive
    };

    this.saving.set(true);
    try {
      const res = this.isEditMode()
        ? await this.colourService.update(payload)
        : await this.colourService.create(payload);

      if (res.success) {
        this.toast.add({ severity: 'success', summary: this.isEditMode() ? 'Colour Updated' : 'Colour Created', detail: res.message });
        this.closeModal();
      } else {
        this.toast.add({ severity: 'error', summary: 'Save Error', detail: res.message });
      }
    } catch (err: any) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: err?.message || 'Failed to save colour.' });
    } finally {
      this.saving.set(false);
    }
  }
}
