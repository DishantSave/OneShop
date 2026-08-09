import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Account {

  getAccountId(): string | null {
    return localStorage.getItem('accountId');
  }

  getUserDetails(): any | null {
    const raw = localStorage.getItem('userDetails');

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem('accountId');
    localStorage.removeItem('userDetails');
    localStorage.removeItem('authToken');
    localStorage.removeItem('screenAccess');
  }
}
