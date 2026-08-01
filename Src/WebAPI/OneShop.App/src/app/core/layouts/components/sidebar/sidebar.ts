import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, AvatarModule, ButtonModule],
  templateUrl: './sidebar.html'
})
export class Sidebar {
  @Input() collapsed = false;
  @Input() menuItems: { label: string; route: string; icon: string }[] = [];
  @Input() userAvatar?: string;
  @Input() userName?: string;
  @Input() company?: string;
  @Input() tier: string = 'Basic';

  @Output() logout = new EventEmitter<void>();
}
