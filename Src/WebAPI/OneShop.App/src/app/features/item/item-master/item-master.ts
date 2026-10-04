import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ItemService } from '../services/item.service';
import { CompanyService } from '../../company/services/company.service';
import { Access } from '../../../core/services/access';

@Component({
  selector: 'app-item-master',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ConfirmDialogModule, ToastModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './item-master.html'
})
export class ItemMaster {
  private itemService = inject(ItemService);
  private companyService = inject(CompanyService);
  private access = inject(Access);

  constructor() {
    this.access.reload();
    this.companyService.list().catch(console.error);
    this.itemService.list().catch(console.error);
  }
}
