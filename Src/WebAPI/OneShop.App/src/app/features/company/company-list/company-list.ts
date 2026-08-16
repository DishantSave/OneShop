import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CompanyService } from '../services/company.service';
import { Company } from '../models/company.model';
import { Access } from '../../../core/services/access';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-list.html'
})
export class CompanyList {
  private companyService = inject(CompanyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(MessageService);
  private access = inject(Access);

  loading = this.companyService.loading;
  searchTerm = signal('');
  companies = this.companyService.companies;

  companyToDelete = signal<Company | null>(null);
  deleteInputText = signal('');

  permissions = computed(() => {
    const raw = localStorage.getItem('screenAccess');

    if (!raw) {
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true
      };
    }

    try {
      const screens: any[] = JSON.parse(raw);
      const entry = screens.find(s => {
        const name =
          s?.screen?.screen ??
          s?.screen?.name ??
          s?.screenName ??
          '';

        return String(name)
          .replace(/[^a-zA-Z0-9]/g, '')
          .toLowerCase() === 'companymaster';
      });

      if (!entry) {
        return {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true
        };
      }

      return {
        canView: !!entry.canView,
        canCreate: !!entry.canCreate,
        canEdit: !!entry.canEdit,
        canDelete: !!entry.canDelete
      };

    } catch {
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true
      };
    }
  });

  filteredCompanies = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.companies();

    if (!term) {
      return list;
    }

    if (term === 'active') {
      return list.filter(c => c.isActive);
    }

    if (term === 'inactive') {
      return list.filter(c => !c.isActive);
    }

    if (term === 'test' || term === 'sandbox') {
      return list.filter(c => c.isTestCompany);
    }

    return list.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.displayName.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term)
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

    this.router.navigate(['new'], {
      relativeTo: this.route
    });
  }

  goToEdit(company: Company) {

    if (!this.permissions().canEdit) {
      this.toast.add({
        severity: 'warn',
        summary: 'Not permitted',
        detail: "You don't have permission to edit companies."
      });

      return;
    }

    this.router.navigate([company.code], {
      relativeTo: this.route
    });
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
  }

  async confirmDeleteModal() {
    const company = this.companyToDelete();

    if (!company) {
      return;
    }

    if (this.deleteInputText().trim() !== 'DELETE') {
      this.toast.add({
        severity: 'warn',
        summary: 'Validation failed',
        detail: 'You must type DELETE to confirm.'
      });

      return;
    }

    try {

      await this.companyService.remove(
        company.code,
        company.name
      );

      this.toast.add({
        severity: 'info',
        summary: 'Company deleted',
        detail: company.name
      });

      this.closeDeleteModal();
    } catch {

      this.toast.add({
        severity: 'error',
        summary: 'Delete failed',
        detail: 'Please try again.'
      });
    }
  }

  getLogoUrl(
    logo: string | null | undefined
  ): string {

    if (!logo) {
      return '';
    }

    if (logo.startsWith('data:image/')) {
      return logo;
    }

    if (
      logo.startsWith('http://') ||
      logo.startsWith('https://')
    ) {
      return logo;
    }

    return `data:image/png;base64,${logo}`;
  }
}
