import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UserService } from '../services/user.service';
import { SubAccount } from '../models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.html'
})
export class UserList implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(MessageService);

  loading = this.userService.loading;
  users = this.userService.users;

  searchTerm = signal('');
  selectedDepartment = signal<string>('ALL');
  filterStatus = signal<'all' | 'active' | 'inactive' | 'test'>('all');

  userToDelete = signal<SubAccount | null>(null);
  deleteInputText = signal('');
  deleting = signal(false);

  departmentList = [
    'ALL',
    'Sales',
    'BI & Analytics',
    'Finance',
    'Customer Support',
    'Warehouse',
    'Operations'
  ];

  ngOnInit() {
    this.refresh();
  }

  async refresh() {
    try {
      await this.userService.list();
    } catch (error: any) {
      console.error('Failed to load sub-accounts:', error);
      this.toast.add({
        severity: 'error',
        summary: 'Load Error',
        detail: error?.message || 'Failed to load sub-accounts.'
      });
    }
  }

  filteredUsers = computed(() => {
    let list = this.users();
    const search = this.searchTerm().trim().toLowerCase();
    const dept = this.selectedDepartment();
    const status = this.filterStatus();

    if (dept !== 'ALL') {
      list = list.filter(u => (u.department || '').toLowerCase() === dept.toLowerCase());
    }

    if (status === 'active') {
      list = list.filter(u => u.isActive);
    } else if (status === 'inactive') {
      list = list.filter(u => !u.isActive);
    } else if (status === 'test') {
      list = list.filter(u => u.isTestAccount);
    }

    if (search) {
      list = list.filter(u =>
        u.userName.toLowerCase().includes(search) ||
        (u.designation && u.designation.toLowerCase().includes(search)) ||
        (u.department && u.department.toLowerCase().includes(search)) ||
        u.email.toLowerCase().includes(search) ||
        u.contact.toLowerCase().includes(search) ||
        (u.company && u.company.toLowerCase().includes(search))
      );
    }

    return list;
  });

  stats = computed(() => {
    const all = this.users();
    const active = all.filter(u => u.isActive).length;
    const inactive = all.filter(u => !u.isActive).length;
    const test = all.filter(u => u.isTestAccount).length;
    const depts = new Set(all.map(u => u.department).filter(Boolean)).size;

    return {
      total: all.length,
      active,
      inactive,
      test,
      departmentsCount: depts
    };
  });

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/[\s._-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getDepartmentBadgeColor(dept: string | null): { bg: string; text: string; border: string } {
    const d = (dept || '').toLowerCase();
    if (d.includes('sales')) {
      return { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.25)' };
    }
    if (d.includes('bi') || d.includes('analytics')) {
      return { bg: 'rgba(99, 102, 241, 0.12)', text: '#6366f1', border: 'rgba(99, 102, 241, 0.25)' };
    }
    if (d.includes('finance')) {
      return { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)' };
    }
    if (d.includes('support')) {
      return { bg: 'rgba(14, 165, 233, 0.12)', text: '#0ea5e9', border: 'rgba(14, 165, 233, 0.25)' };
    }
    if (d.includes('warehouse')) {
      return { bg: 'rgba(249, 115, 22, 0.12)', text: '#f97316', border: 'rgba(249, 115, 22, 0.25)' };
    }
    return { bg: 'rgba(139, 92, 246, 0.12)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.25)' };
  }

  getAccessibleScreensCount(user: SubAccount): number {
    return (user.screenAccess || []).filter(s => s.canView).length;
  }

  getAccessibleScreenNames(user: SubAccount): string[] {
    return (user.screenAccess || []).filter(s => s.canView).map(s => s.screenName);
  }

  navigateToCreate() {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  navigateToEdit(user: SubAccount) {
    this.router.navigate([user.userName], { relativeTo: this.route });
  }

  openDeleteModal(user: SubAccount, event: Event) {
    event.stopPropagation();
    this.userToDelete.set(user);
    this.deleteInputText.set('');
  }

  closeDeleteModal() {
    this.userToDelete.set(null);
    this.deleteInputText.set('');
  }

  async confirmDelete() {
    const user = this.userToDelete();
    if (!user) return;

    this.deleting.set(true);
    try {
      const res = await this.userService.delete(user.userName);
      if (res.success) {
        this.toast.add({
          severity: 'success',
          summary: 'Deleted',
          detail: `User ${user.userName} has been removed successfully.`
        });
        this.closeDeleteModal();
      } else {
        this.toast.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: res.message || 'Unable to delete user.'
        });
      }
    } catch (err: any) {
      this.toast.add({
        severity: 'error',
        summary: 'Error',
        detail: err?.message || 'Error occurred while deleting user.'
      });
    } finally {
      this.deleting.set(false);
    }
  }
}
