import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InventoryService } from '../services/inventory.service';
import { CompanyService } from '../../company/services/company.service';
import { Access } from '../../../core/services/access';

@Component({
  selector: 'app-inventory-master',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ConfirmDialogModule, ToastModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './inventory-master.html'
})
export class InventoryMaster {
  private inventoryService = inject(InventoryService);
  private companyService = inject(CompanyService);
  private access = inject(Access);

  constructor() {
    this.access.reload();
    this.companyService.list().catch(console.error);
    this.inventoryService.list().catch(console.error);
  }
}
