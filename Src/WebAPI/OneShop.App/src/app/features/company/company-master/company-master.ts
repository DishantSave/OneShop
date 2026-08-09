import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { CompanyService } from '../services/company.service';
import { Access } from '../../../core/services/access';

@Component({
  selector: 'app-company-master',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ConfirmDialogModule, ToastModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './company-master.html'
})
export class CompanyMaster {
  private companyService = inject(CompanyService);
  private access = inject(Access);

  constructor() {
    this.access.reload();

    this.companyService.list().catch(error => {
      console.error('Failed to load companies:', error);
    });
  }
}
