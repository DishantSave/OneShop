import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { Theme, ThemeType } from '../../core/services/theme';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, ToggleSwitchModule, SelectModule, ButtonModule],
  templateUrl: './settings.html'
})
export class Setting implements OnInit {
  companyName = '';
  email = '';

  notificationOptions = [
    { key: 'opt1', label: 'Option 1', enabled: false },
    { key: 'opt2', label: 'Option 2', enabled: false },
    { key: 'opt3', label: 'Option 3', enabled: false },
    { key: 'opt4', label: 'Option 4', enabled: false },
    { key: 'opt5', label: 'Option 5', enabled: false },
    { key: 'opt6', label: 'Option 6', enabled: false }
  ];

  themes: { key: ThemeType; label: string }[] = [
    { key: 'light-theme', label: 'Light' },
    { key: 'dark-theme', label: 'Dark' },
    { key: 'neonocean-theme', label: 'Neon Ocean' },
    { key: 'solarflare-theme', label: 'Solar Flare' },
    { key: 'sunsetblush-theme', label: 'Sunset Blush' }
  ];

  selectedTheme: ThemeType = 'light-theme';

  constructor(private themeService: Theme) {
    this.themeService.theme$.subscribe(theme => (this.selectedTheme = theme));
  }

  ngOnInit() { }

  changeTheme(theme: ThemeType) {
    this.themeService.setTheme(theme);
  }

  saveChanges() {
    // wire up to your backend save call here
  }
}
