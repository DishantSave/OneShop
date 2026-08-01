import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html'
})
export class Navbar {
  @Input() tabItems: { label: string; route: string }[] = [];
  @Input() logoUrl?: string;

  @Output() toggleSidebar = new EventEmitter<void>();
}
