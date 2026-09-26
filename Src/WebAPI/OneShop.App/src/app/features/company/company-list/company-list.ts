import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CompanyService } from '../services/company.service';
import { Company } from '../models/company.model';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-list.html'
})
export class CompanyList implements OnInit {
  private companyService = inject(CompanyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(MessageService);

  loading = this.companyService.loading;
  companies = this.companyService.companies;

  searchTerm = signal('');
  filterMode = signal<'all' | 'active' | 'inactive' | 'test'>('all');
  companyToDelete = signal<Company | null>(null);
  deleteInputText = signal('');
  deleting = signal(false);

  ngOnInit() {
    this.refresh();
  }

  async refresh() {
    try {
      await this.companyService.list();
    } catch (error: any) {
      console.error('Failed to load companies:', error);
      this.toast.add({
        severity: 'error',
        summary: 'Load Error',
        detail: error?.message || 'Failed to load companies.'
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
        return String(name).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === 'companymaster';
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
    const list = this.companies();
    return {
      total: list.length,
      active: list.filter(c => c.isActive).length,
      inactive: list.filter(c => !c.isActive).length,
      test: list.filter(c => c.isTestCompany).length
    };
  });

  filteredCompanies = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const mode = this.filterMode();
    let list = this.companies();

    // Filter by mode
    if (mode === 'active') {
      list = list.filter(c => c.isActive);
    } else if (mode === 'inactive') {
      list = list.filter(c => !c.isActive);
    } else if (mode === 'test') {
      list = list.filter(c => c.isTestCompany);
    }

    // Filter by search query
    if (!term) {
      return list;
    }

    return list.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.displayName.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term) ||
      c.countryCode.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });

  goToNew() {
    if (!this.permissions().canCreate) {
      this.toast.add({
        severity: 'warn',
        summary: 'Not permitted',
        detail: "You don't have permission to create companies."
      });
      return;
    }

    this.router.navigate(['new'], { relativeTo: this.route });
  }

  goToEdit(company: Company) {
    if (!this.permissions().canEdit && !this.permissions().canView) {
      this.toast.add({
        severity: 'warn',
        summary: 'Not permitted',
        detail: "You don't have permission to view or edit this company."
      });
      return;
    }

    this.router.navigate([company.code], { relativeTo: this.route });
  }

  openDeleteModal(company: Company, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.permissions().canDelete) {
      this.toast.add({
        severity: 'warn',
        summary: 'Not permitted',
        detail: "You don't have permission to delete companies."
      });
      return;
    }

    this.deleteInputText.set('');
    this.companyToDelete.set(company);
  }

  closeDeleteModal() {
    this.companyToDelete.set(null);
    this.deleteInputText.set('');
    this.deleting.set(false);
  }

  async confirmDeleteModal() {
    const company = this.companyToDelete();
    if (!company) return;

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
      await this.companyService.remove(company.code, company.name);

      this.toast.add({
        severity: 'success',
        summary: 'Company Deleted',
        detail: `Company [${company.code} - ${company.name}] was deleted successfully.`
      });

      this.closeDeleteModal();
    } catch (error: any) {
      console.error('Delete company failed:', error);
      this.toast.add({
        severity: 'error',
        summary: 'Delete Failed',
        detail: error?.message || 'Failed to delete company. Please try again.'
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
