import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { WarehouseService } from '../services/warehouse.service';
import { CompanyService } from '../../company/services/company.service';
import { Access } from '../../../core/services/access';

@Component({
  selector: 'app-warehouse-master',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ConfirmDialogModule, ToastModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './warehouse-master.html'
})
export class WarehouseMaster {
  private warehouseService = inject(WarehouseService);
  private companyService = inject(CompanyService);
  private access = inject(Access);

  constructor() {
    this.access.reload();

    this.companyService.list().catch(err => {
      console.error('Failed to preload companies:', err);
    });

    this.warehouseService.list().catch(error => {
      console.error('Failed to load warehouses:', error);
    });
  }
}
