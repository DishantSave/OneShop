import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { StoreService } from '../services/store.service';
import { CompanyService } from '../../company/services/company.service';
import { Store } from '../models/store.model';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './store-list.html'
})
export class StoreList implements OnInit {
  private storeService = inject(StoreService);
  private companyService = inject(CompanyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(MessageService);

  loading = this.storeService.loading;
  stores = this.storeService.stores;
  companies = this.companyService.companies;

  searchTerm = signal('');
  selectedCompanyCode = signal<string>('ALL');
  filterMode = signal<'all' | 'active' | 'inactive' | 'test'>('all');
  storeToDelete = signal<Store | null>(null);
  deleteInputText = signal('');
  deleting = signal(false);

  ngOnInit() {
    this.refresh();
  }

  async refresh() {
    try {
      await Promise.all([
        this.companyService.list(),
        this.storeService.list(this.selectedCompanyCode() === 'ALL' ? undefined : this.selectedCompanyCode())
      ]);
    } catch (error: any) {
      console.error('Failed to load stores:', error);
      this.toast.add({
        severity: 'error',
        summary: 'Load Error',
        detail: error?.message || 'Failed to load stores.'
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
        return clean === 'divisionmaster' || clean === 'storemaster';
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

  stats = computed(() => {
    const list = this.stores();
    return {
      total: list.length,
      active: list.filter(s => s.isActive).length,
      inactive: list.filter(s => !s.isActive).length,
      test: list.filter(s => s.isTestStore).length
    };
  });

  filteredStores = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const mode = this.filterMode();
    const compFilter = this.selectedCompanyCode();
    let list = this.stores();

    // Filter by Company dropdown
    if (compFilter && compFilter !== 'ALL') {
      list = list.filter(s => s.companyCode.toUpperCase() === compFilter.toUpperCase());
    }

    // Filter by mode
    if (mode === 'active') {
      list = list.filter(s => s.isActive);
    } else if (mode === 'inactive') {
      list = list.filter(s => !s.isActive);
    } else if (mode === 'test') {
      list = list.filter(s => s.isTestStore);
    }

    // Filter by search query
    if (!term) {
      return list;
    }

    return list.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.displayName.toLowerCase().includes(term) ||
      s.code.toLowerCase().includes(term) ||
      s.companyCode.toLowerCase().includes(term) ||
      (s.companyName && s.companyName.toLowerCase().includes(term)) ||
      s.city.toLowerCase().includes(term) ||
      s.storeType.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term)
    );
  });

  goToNew() {
    if (!this.permissions().canCreate) {
      this.toast.add({
        severity: 'warn',
        summary: 'Not permitted',
        detail: "You don't have permission to create stores."
      });
      return;
    }

    this.router.navigate(['new'], { relativeTo: this.route });
  }

  goToEdit(store: Store) {
    if (!this.permissions().canEdit && !this.permissions().canView) {
      this.toast.add({
        severity: 'warn',
        summary: 'Not permitted',
        detail: "You don't have permission to view or edit this store."
      });
      return;
    }

    this.router.navigate([store.companyCode, store.code], { relativeTo: this.route });
  }

  openDeleteModal(store: Store, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.permissions().canDelete) {
      this.toast.add({
        severity: 'warn',
        summary: 'Not permitted',
        detail: "You don't have permission to delete stores."
      });
      return;
    }

    this.deleteInputText.set('');
    this.storeToDelete.set(store);
  }

  closeDeleteModal() {
    this.storeToDelete.set(null);
    this.deleteInputText.set('');
    this.deleting.set(false);
  }

  async confirmDeleteModal() {
    const store = this.storeToDelete();
    if (!store) return;

    if (this.deleteInputText().trim() !== 'DELETE') {
      this.toast.add({
        severity: 'warn',
        summary: 'Validation Required',
        detail: 'Please type DELETE in uppercase to confirm removal.'
      });
      return;
    }

    this.deleting.set(true);

    try {
      await this.storeService.remove(store.companyCode, store.code, store.name);

      this.toast.add({
        severity: 'success',
        summary: 'Store Deleted',
        detail: `Store [${store.companyCode} / ${store.code} - ${store.name}] was deleted successfully.`
      });

      this.closeDeleteModal();
    } catch (error: any) {
      console.error('Delete store failed:', error);
      this.toast.add({
        severity: 'error',
        summary: 'Delete Failed',
        detail: error?.message || 'Failed to delete store. Please try again.'
      });
    } finally {
      this.deleting.set(false);
    }
  }

  getLogoUrl(logo: string | null | undefined): string {
    if (!logo) return '';
    if (logo.startsWith('data:image/') || logo.startsWith('http://') || logo.startsWith('https://')) {
      return logo;
    }
    return `data:image/png;base64,${logo}`;
  }
}
