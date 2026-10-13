import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { NotificationService } from '../../../../features/notifications/services/notification.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, AvatarModule, ButtonModule],
  templateUrl: './sidebar.html'
})
export class Sidebar {
  private notifService = inject(NotificationService);
  unreadNotifs = this.notifService.unreadCount;

  @Input() collapsed = false;
  @Input() menuItems: { label: string; route: string; icon: string; badge?: number }[] = [];
  @Input() userAvatar?: string;
  @Input() userName?: string;
  @Input() company?: string;
  @Input() tier: string = 'Basic';

  @Output() logout = new EventEmitter<void>();
}
