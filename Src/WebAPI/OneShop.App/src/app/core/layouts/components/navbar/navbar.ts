import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Theme, ThemeType } from '../../../../core/services/theme';
import { CartService } from '../../../../features/orders/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html'
})
export class Navbar implements OnInit, OnDestroy {
  private themeService = inject(Theme);
  public cartService = inject(CartService);
  private themeSub?: Subscription;

  cartCount = this.cartService.cartCount;

  @Input() tabItems: { label: string; route: string }[] = [];
  @Input() logoUrl?: string;

  @Output() toggleSidebar = new EventEmitter<void>();

  openCart() {
    this.cartService.openDrawer();
  }

  currentTheme: ThemeType = 'light-theme';

  private themeLogos: Record<ThemeType, string> = {
    'light-theme': 'images/logo-light.png',
    'dark-theme': 'images/logo-dark.png',
    'neonocean-theme': 'images/logo-neonocean.png',
    'solarflare-theme': 'images/logo-solarflare.png',
    'sunsetblush-theme': 'images/logo-sunsetblush.png'
  };

  ngOnInit() {
    this.themeSub = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnDestroy() {
    this.themeSub?.unsubscribe();
  }

  get resolvedLogo(): string {
    return this.logoUrl || this.themeLogos[this.currentTheme];
  }
}
