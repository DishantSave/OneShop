import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { OrderService } from '../services/order.service';
import { CompanyService } from '../../company/services/company.service';
import { StoreService } from '../../store/services/store.service';
import { WarehouseService } from '../../warehouse/services/warehouse.service';
import { ItemService } from '../../item/services/item.service';
import { Access } from '../../../core/services/access';

@Component({
  selector: 'app-order-master',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ConfirmDialogModule, ToastModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './order-master.html'
})
export class OrderMaster {
  private orderService = inject(OrderService);
  private companyService = inject(CompanyService);
  private storeService = inject(StoreService);
  private warehouseService = inject(WarehouseService);
  private itemService = inject(ItemService);
  private access = inject(Access);

  constructor() {
    this.access.reload();
    this.companyService.list().catch(console.error);
    this.storeService.list().catch(console.error);
    this.warehouseService.list().catch(console.error);
    this.itemService.list().catch(console.error);
    this.orderService.list().catch(console.error);
  }
}
