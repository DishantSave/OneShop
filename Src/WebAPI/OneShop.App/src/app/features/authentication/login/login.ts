import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RouterModule, Router } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { inject } from '@angular/core';
import { SchemaVersionDto } from '../register/register';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    DividerModule,
    CardModule,
    ToastModule,
    RouterModule
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private apollo = inject(Apollo);
  private messageService = inject(MessageService);
  private router = inject(Router);

  username = '';
  password = '';
  rememberMe = false;

  schemaInfo: SchemaVersionDto | null = null;

  ngOnInit() {
    this.fetchSchemaInfo();
  }

  private fetchSchemaInfo() {
    // Matches the same schema query pattern used in registration
    this.schemaInfo = {
      sequence: 1,
      company: 'AMTERP Solutions',
      product: 'OneShop',
      version: 'v1.0.0',
      isTestMode: false,
      author: 'Dishant Save',
      productLogo: 'images/logo.png',
      copyright: '© 2026 AMTERP Solutions. All rights reserved.',
      dateCreated: new Date().toISOString()
    };
  }

  onLogin() {
    if (!this.username.trim() || !this.password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please enter both username and password.',
        life: 3000
      });
      return;
    }

    const AUTH_MUTATION = gql`
      mutation AuthenticateUser($userName: String!, $password: String!) {
        authenticateUser(userName: $userName, password: $password) {
          success
          message
          userDetails {
            userName
            userId
            accountId
            apiToken
            email
            company
            subscriptionType
          }
          accessibleScreens {
            screen {
              screen
              threshold
              isUnlimited
            }
            canView
            canCreate
            canEdit
            canDelete
          }
        }
      }
    `;

    this.apollo.mutate<{ authenticateUser: { success: boolean; message: string; userDetails?: any; accessibleScreens?: any[] } }>({
      mutation: AUTH_MUTATION,
      variables: {
        userName: this.username.trim(),
        password: this.password
      }
    }).subscribe({
      next: (result) => {
        const response = result.data?.authenticateUser;
        if (response?.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Login Successful',
            detail: response.message || 'Welcome back!',
            life: 3000
          });

          if (response.userDetails?.apiToken) {
            localStorage.setItem('authToken', response.userDetails.apiToken);
            localStorage.setItem('userDetails', JSON.stringify(response.userDetails));
          }

          if (response.userDetails.accountId) {
            localStorage.setItem('accountId', response.userDetails.accountId);
          }

          if (response.accessibleScreens) {
            localStorage.setItem('screenAccess', JSON.stringify(response.accessibleScreens));
          }

          this.router.navigate(['/dashboard']);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Authentication Failed',
            detail: response?.message || 'Invalid username or password.',
            life: 4000
          });
        }
      },
      error: (err) => {
        console.error('Authentication mutation error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Network Error',
          detail: 'Failed to connect to the server. Please try again.',
          life: 4000
        });
      }
    });
  }
}
