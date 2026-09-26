import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { StoreService } from '../services/store.service';
import { CompanyService } from '../../company/services/company.service';
import { Access } from '../../../core/services/access';

@Component({
  selector: 'app-store-master',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ConfirmDialogModule, ToastModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './store-master.html'
})
export class StoreMaster {
  private storeService = inject(StoreService);
  private companyService = inject(CompanyService);
  private access = inject(Access);

  constructor() {
    this.access.reload();

    this.companyService.list().catch(err => {
      console.error('Failed to preload companies:', err);
    });

    this.storeService.list().catch(error => {
      console.error('Failed to load stores:', error);
    });
  }
}
