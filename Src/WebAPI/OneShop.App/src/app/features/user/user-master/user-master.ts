import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { UserService } from '../services/user.service';
import { Access } from '../../../core/services/access';

@Component({
  selector: 'app-user-master',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ConfirmDialogModule, ToastModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './user-master.html'
})
export class UserMaster {
  private userService = inject(UserService);
  private access = inject(Access);

  constructor() {
    this.access.reload();
    this.userService.list().catch(err => {
      console.error('Failed to preload sub-accounts:', err);
    });
  }
}
