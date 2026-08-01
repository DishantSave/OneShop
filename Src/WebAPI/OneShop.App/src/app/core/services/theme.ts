import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeType =
  | 'light-theme'
  | 'dark-theme'
  | 'neonocean-theme'
  | 'solarflare-theme'
  | 'sunsetblush-theme';

@Injectable({
  providedIn: 'root'
})
export class Theme {
  private currentTheme = 'light-theme';
  private themeSubject = new BehaviorSubject<ThemeType>('light-theme');

  theme$ = this.themeSubject.asObservable();

  constructor() {
    this.loadSavedTheme();
  }

  setTheme(theme: ThemeType) {
    this.currentTheme = theme;
    localStorage.setItem('app-theme', theme);
    this.applyThemeToBody(theme);
    this.themeSubject.next(theme);
  }

  getCurrentTheme(): string {
    return this.currentTheme;
  }

  private loadSavedTheme() {
    const savedTheme = localStorage.getItem('app-theme') as ThemeType;
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('light-theme');
    }
  }

  private applyThemeToBody(theme: string) {
    if (typeof document !== 'undefined') {
      const body = document.body;
      // Remove all theme classes
      body.classList.remove(
        'light-theme',
        'dark-theme',
        'neonocean-theme',
        'solarflare-theme',
        'sunsetblush-theme'
      );
      // Add the active theme class
      body.classList.add(theme);
    }
  }
}
