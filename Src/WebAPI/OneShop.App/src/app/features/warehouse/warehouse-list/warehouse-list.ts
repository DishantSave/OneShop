import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { WarehouseService } from '../services/warehouse.service';
import { CompanyService } from '../../company/services/company.service';
import { Warehouse } from '../models/warehouse.model';

@Component({
  selector: 'app-warehouse-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './warehouse-list.html'
})
export class WarehouseList implements OnInit {
  private warehouseService = inject(WarehouseService);
  private companyService = inject(CompanyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(MessageService);

  loading = this.warehouseService.loading;
  warehouses = this.warehouseService.warehouses;
  companies = this.companyService.companies;

  searchTerm = signal('');
  selectedCompanyCode = signal<string>('ALL');
  filterMode = signal<'all' | 'active' | 'inactive' | 'test'>('all');
  warehouseToDelete = signal<Warehouse | null>(null);
  deleteInputText = signal('');
  deleting = signal(false);

  ngOnInit() {
    this.refresh();
  }

  async refresh() {
    try {
      await Promise.all([
        this.companyService.list(),
        this.warehouseService.list(this.selectedCompanyCode() === 'ALL' ? undefined : this.selectedCompanyCode())
      ]);
    } catch (error: any) {
      console.error('Failed to load warehouses:', error);
      this.toast.add({
        severity: 'error',
        summary: 'Load Error',
        detail: error?.message || 'Failed to load warehouses.'
      });
    }
  }

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
        return clean === 'companymaster' || clean === 'divisionmaster' || clean === 'warehousemaster';
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

  filteredWarehouses = computed(() => {
    let list = this.warehouses();

    const comp = this.selectedCompanyCode();
    if (comp !== 'ALL') {
      list = list.filter(w => w.companyCode.toUpperCase() === comp.toUpperCase());
    }

    const mode = this.filterMode();
    if (mode === 'active') {
      list = list.filter(w => w.isActive && !w.isTestWarehouse);
    } else if (mode === 'inactive') {
      list = list.filter(w => !w.isActive);
    } else if (mode === 'test') {
      list = list.filter(w => w.isTestWarehouse);
    }

    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      list = list.filter(w =>
        w.name.toLowerCase().includes(term) ||
        w.code.toLowerCase().includes(term) ||
        w.displayName.toLowerCase().includes(term) ||
        w.city.toLowerCase().includes(term) ||
        w.companyCode.toLowerCase().includes(term)
      );
    }

    return list;
  });

  stats = computed(() => {
    const all = this.warehouses();
    return {
      total: all.length,
      active: all.filter(w => w.isActive).length,
      inactive: all.filter(w => !w.isActive).length,
      test: all.filter(w => w.isTestWarehouse).length
    };
  });

  openCreate() {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  editWarehouse(w: Warehouse) {
    this.router.navigate([w.companyCode, w.code], { relativeTo: this.route });
  }

  confirmDelete(w: Warehouse) {
    this.warehouseToDelete.set(w);
    this.deleteInputText.set('');
  }

  cancelDelete() {
    this.warehouseToDelete.set(null);
    this.deleteInputText.set('');
  }

  async executeDelete() {
    const target = this.warehouseToDelete();
    if (!target) return;

    if (this.deleteInputText().trim() !== target.name.trim()) {
      this.toast.add({
        severity: 'warn',
        summary: 'Name Mismatch',
        detail: 'Please type the exact warehouse name to confirm deletion.'
      });
      return;
    }

    this.deleting.set(true);
    try {
      const res = await this.warehouseService.delete(target.companyCode, target.code);
      if (res.success) {
        this.toast.add({
          severity: 'success',
          summary: 'Deleted',
          detail: res.message || `Warehouse ${target.name} deleted.`
        });
        this.cancelDelete();
      } else {
        this.toast.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: res.message
        });
      }
    } catch (err: any) {
      this.toast.add({
        severity: 'error',
        summary: 'Error',
        detail: err?.message || 'Failed to delete warehouse.'
      });
    } finally {
      this.deleting.set(false);
    }
  }
}
