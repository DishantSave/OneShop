import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Apollo, gql } from 'apollo-angular';
import { inject } from '@angular/core';

export interface CountryDto {
  sequence: number;
  country: string;
  countryCode: string;
  isdCode: string;
  flag?: string;
}

export interface SchemaVersionDto {
  sequence: number;
  company: string;
  product: string;
  version: string;
  isTestMode: boolean;
  description?: string;
  author: string;
  productLogo: string;
  copyright: string;
  dateCreated: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    SelectModule,
    CardModule,
    DialogModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {

  private apollo = inject(Apollo);
  private messageService = inject(MessageService);

  currentStep = 1;

  userName = '';
  password = '';
  confirmPassword = '';
  email = '';
  contact = '';
  country: CountryDto | null = null;
  selectedIsdCode: CountryDto | null = null;
  company = '';

  isCustomerAccount = true;
  isSellerAccount = false;
  isCustomerB2C = true;
  isCustomerB2B = false;
  isTestAccount = false;

  countries: CountryDto[] = [];
  schemaInfo: SchemaVersionDto | null = null;

  isUsernameAvailable: boolean | null = null;

  // Modal OTP States
  showEmailOtpModal = false;
  showContactOtpModal = false;
  emailOtp = '';
  contactOtp = '';
  isEmailVerified = false;
  isContactVerified = false;

  private usernameSubject = new Subject<string>();

  ngOnInit() {
    this.fetchCountries();
    this.fetchSchemaInfo();
    this.setupValidation();
  }

  private fetchCountries() {
    const GET_COUNTRIES_QUERY = gql`
      query {
        countries {
          sequence
          country
          countryCode
          isdCode
          flag
        }
      }
    `;

    this.apollo.watchQuery<{ countries: CountryDto[] }>({
      query: GET_COUNTRIES_QUERY
    }).valueChanges.subscribe({
      next: (result) => {
        this.countries = (result.data?.countries as CountryDto[]) || [];
        if (this.countries.length > 0 && !this.country) {
          this.country = this.countries[0];
          this.selectedIsdCode = this.countries[0];
        }
      },
      error: (err) => {
        console.error('Failed to fetch countries:', err);
        this.countries = [];
      }
    });
  }

  onCountryChange() {
    if (this.country) {
      this.selectedIsdCode = this.country;
    }
  }

  onIsdChange() {
    if (this.selectedIsdCode && this.country !== this.selectedIsdCode) {
      this.country = this.selectedIsdCode;
      this.messageService.add({
        severity: 'warn',
        summary: 'Country Updated',
        detail: `Country automatically updated to ${this.country.country}`,
        life: 3000
      });
    }
  }

  private fetchSchemaInfo() {
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

  private setupValidation() {
    this.usernameSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(async (username) => {
        if (!username || username.length < 3) return null;
        return true;
      })
    ).subscribe(res => this.isUsernameAvailable = res);
  }

  onUsernameInput() {
    this.usernameSubject.next(this.userName);
  }

  onCustomerTypeChange() {
    if (!this.isCustomerB2C && !this.isCustomerB2B) {
      this.isCustomerB2C = true;
    }
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (!this.userName || !this.email || !this.contact || !this.country || !this.selectedIsdCode) {
        this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fill in all required fields before proceeding.', life: 3000 });
        return;
      }
    }
    this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  openEmailOtpModal() {
    if (!this.email) {
      this.messageService.add({ severity: 'warn', summary: 'Missing Info', detail: 'Please enter a valid email address first.', life: 3000 });
      return;
    }

    const SEND_EMAIL_OTP_MUTATION = gql`
      mutation SendEmailOTP($email: String!) {
        sendEmailValidationOTP(email: $email)
      }
    `;

    this.apollo.mutate<{ sendEmailValidationOTPAsync: string }>({
      mutation: SEND_EMAIL_OTP_MUTATION,
      variables: { email: this.email }
    }).subscribe({
      next: (response) => {
        this.showEmailOtpModal = true;
        this.messageService.add({ severity: 'success', summary: 'OTP Sent', detail: 'Verification code sent to your email.', life: 3000 });
      },
      error: (err) => {
        console.error('Failed to send email OTP:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to send email OTP. Please try again.', life: 3000 });
      }
    });
  }

  verifyEmailOtp() {
    if (!this.emailOtp) {
      this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'Please enter the OTP.', life: 3000 });
      return;
    }

    const VALIDATE_EMAIL_OTP_MUTATION = gql`
      mutation ValidateEmailOTP($email: String!, $otp: String!) {
        validateOTPForGivenEmail(email: $email, otp: $otp)
      }
    `;

    this.apollo.mutate<{ validateOTPForGivenEmailAsync: string }>({
      mutation: VALIDATE_EMAIL_OTP_MUTATION,
      variables: { email: this.email, otp: this.emailOtp }
    }).subscribe({
      next: (result) => {
        // Assuming success returns a confirmation string/token or you can check based on response
        this.isEmailVerified = true;
        this.showEmailOtpModal = false;
        this.emailOtp = '';
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Email verified successfully!', life: 3000 });
      },
      error: (err) => {
        console.error('Email OTP validation failed:', err);
        this.messageService.add({ severity: 'error', summary: 'Invalid OTP', detail: 'The OTP entered is incorrect or expired.', life: 3000 });
      }
    });
  }

  openContactOtpModal() {
    if (!this.contact) {
      this.messageService.add({ severity: 'warn', summary: 'Missing Info', detail: 'Please enter a valid contact number first.', life: 3000 });
      return;
    }

    const fullContactNumber = `${this.selectedIsdCode?.isdCode || ''} ${this.contact}`;

    const SEND_CONTACT_OTP_MUTATION = gql`
      mutation SendContactOTP($contactNumber: String!) {
        sendContactValidationOTP(contactNumber: $contactNumber)
      }
    `;

    this.apollo.mutate<{ sendContactValidationOTPAsync: string }>({
      mutation: SEND_CONTACT_OTP_MUTATION,
      variables: { contactNumber: fullContactNumber }
    }).subscribe({
      next: (response) => {
        this.showContactOtpModal = true;
        this.messageService.add({ severity: 'success', summary: 'OTP Sent', detail: 'Verification code sent to your contact number.', life: 3000 });
      },
      error: (err) => {
        console.error('Failed to send contact OTP:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to send contact OTP. Please try again.', life: 3000 });
      }
    });
  }

  verifyContactOtp() {
    if (!this.contactOtp) {
      this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'Please enter the OTP.', life: 3000 });
      return;
    }

    const fullContactNumber = `${this.selectedIsdCode?.isdCode || ''} ${this.contact}`;

    const VALIDATE_CONTACT_OTP_MUTATION = gql`
      mutation ValidateContactOTP($contactNumber: String!, $otp: String!) {
        validateOTPForGivenContact(contactNumber: $contactNumber, otp: $otp)
      }
    `;

    this.apollo.mutate<{ validateOTPForGivenContactAsync: string }>({
      mutation: VALIDATE_CONTACT_OTP_MUTATION,
      variables: { contactNumber: fullContactNumber, otp: this.contactOtp }
    }).subscribe({
      next: (result) => {
        this.isContactVerified = true;
        this.showContactOtpModal = false;
        this.contactOtp = '';
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Contact number verified successfully!', life: 3000 });
      },
      error: (err) => {
        console.error('Contact OTP validation failed:', err);
        this.messageService.add({ severity: 'error', summary: 'Invalid OTP', detail: 'The OTP entered is incorrect or expired.', life: 3000 });
      }
    });
  }

  onSubmit() {
    if (!this.isEmailVerified || !this.isContactVerified) {
      this.messageService.add({ severity: 'error', summary: 'Verification Required', detail: 'Please verify both your email and contact number via OTP.', life: 3000 });
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.messageService.add({ severity: 'error', summary: 'Password Error', detail: 'Passwords do not match!', life: 3000 });
      return;
    }

    const REGISTER_USER_MUTATION = gql`
      mutation RegisterUser($input: RegisterInput!) {
        registerUser(input: $input) {
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

    const inputPayload = {
      userName: this.userName.trim(),
      password: this.password,
      company: this.company ? this.company.trim() : null,
      profilePicture: null,
      email: this.email,
      contact: `${this.selectedIsdCode?.isdCode || ''} ${this.contact}`.trim(),
      country: this.country?.countryCode || '',
      isCustomerAccount: this.isCustomerAccount,
      isSellerAccount: this.isSellerAccount,
      isTestAccount: this.isTestAccount
    };

    this.apollo.mutate<{ registerUser: { success: boolean; message: string; userDetails?: any; accessibleScreens?: any[] } }>({
      mutation: REGISTER_USER_MUTATION,
      variables: { input: inputPayload }
    }).subscribe({
      next: (result) => {
        const response = result.data?.registerUser;
        if (response?.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Registration Successful',
            detail: response.message || 'Account created successfully!',
            life: 4000
          });

          // Save token and user details if needed (e.g., LocalStorage / Session)
          if (response.userDetails?.apiToken) {
            localStorage.setItem('authToken', response.userDetails.apiToken);
            localStorage.setItem('userDetails', JSON.stringify(response.userDetails));
          }

          // Optional: Handle screens accessibility response if redirecting directly
          if (response.accessibleScreens) {
            localStorage.setItem('screenAccess', JSON.stringify(response.accessibleScreens));
          }

          // TODO: Navigate to dashboard or login route
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Registration Failed',
            detail: response?.message || 'An error occurred during registration.',
            life: 4000
          });
        }
      },
      error: (err) => {
        console.error('Registration mutation error:', err);
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
