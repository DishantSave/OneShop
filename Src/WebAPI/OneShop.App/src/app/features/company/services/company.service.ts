import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { Company, CompanyAuditTrail } from '../models/company.model';

export const GET_COMPANIES = gql`
  query GetCompanies {
    companies {
      sequence
      accountId
      code
      name
      displayName
      addressLineOne
      addressLineTwo
      city
      stateCode
      countryCode
      postalCode
      contact
      email
      website
      logo
      currencyCode
      timeZone
      isTestCompany
      isActive
      dateCreated
      audit {
        sequence
        accountId
        code
        field
        description
        dateModified
        modifiedBy
      }
    }
  }
`;

export const GET_COMPANY = gql`
  query GetCompany($code: String!) {
    company(code: $code) {
      sequence
      accountId
      code
      name
      displayName
      addressLineOne
      addressLineTwo
      city
      stateCode
      countryCode
      postalCode
      contact
      email
      website
      logo
      currencyCode
      timeZone
      isTestCompany
      isActive
      dateCreated
      audit {
        sequence
        accountId
        code
        field
        description
        dateModified
        modifiedBy
      }
    }
  }
`;

export const CHECK_COMPANY_CODE_EXISTS = gql`
  query CheckCompanyCodeExists($code: String!) {
    checkCompanyCodeExists(code: $code)
  }
`;

export const CREATE_COMPANY = gql`
  mutation CreateCompany($input: CompanyInput!) {
    createCompany(input: $input) {
      success
      message
      companyDetails {
        sequence
        accountId
        code
        name
        displayName
        addressLineOne
        addressLineTwo
        city
        stateCode
        countryCode
        postalCode
        contact
        email
        website
        logo
        currencyCode
        timeZone
        isTestCompany
        isActive
        dateCreated
        audit {
          sequence
          accountId
          code
          field
          description
          dateModified
          modifiedBy
        }
      }
    }
  }
`;

export const UPDATE_COMPANY = gql`
  mutation UpdateCompany($input: CompanyInput!) {
    updateCompany(input: $input) {
      success
      message
      companyDetails {
        sequence
        accountId
        code
        name
        displayName
        addressLineOne
        addressLineTwo
        city
        stateCode
        countryCode
        postalCode
        contact
        email
        website
        logo
        currencyCode
        timeZone
        isTestCompany
        isActive
        dateCreated
        audit {
          sequence
          accountId
          code
          field
          description
          dateModified
          modifiedBy
        }
      }
    }
  }
`;

export const DELETE_COMPANY = gql`
  mutation DeleteCompany($code: String!) {
    deleteCompany(code: $code) {
      success
      message
    }
  }
`;

export interface CompanyInputApi {
  companyCode: string;
  companyName: string;
  companyDisplayName: string;
  addressLineOne: string;
  addressLineTwo?: string | null;
  city: string;
  stateCode: string;
  countryCode: string;
  postalCode: string;
  contact: string;
  email: string;
  website?: string | null;
  logo?: string | null;
  currencyCode: string;
  timeZone: string;
  isTestCompany: boolean;
  isActive: boolean;
}

interface CompanyPayloadApiResponse {
  success: boolean;
  message: string;
  companyDetails?: CompanyApiResponse | null;
}

interface CompanyApiResponse {
  sequence: number;
  accountId: string;
  code: string;
  name: string;
  displayName: string;
  addressLineOne: string;
  addressLineTwo: string | null;
  city: string;
  stateCode: string;
  countryCode: string;
  postalCode: string;
  contact: string;
  email: string;
  website: string | null;
  logo: string | null;
  currencyCode: string;
  timeZone: string;
  isTestCompany: boolean;
  isActive: boolean;
  dateCreated: string;
  audit?: CompanyAuditTrail[];
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apollo = inject(Apollo);

  readonly companies = signal<Company[]>([]);
  readonly loading = signal(false);

  /**
   * Fetch all companies for the current tenant account
   */
  async list(): Promise<Company[]> {
    this.loading.set(true);

    try {
      const result = await firstValueFrom(
        this.apollo.query<{
          companies: CompanyApiResponse[];
        }>({
          query: GET_COMPANIES,
          fetchPolicy: 'network-only'
        })
      );

      const list = (result?.data?.companies ?? []).map(c => this.mapCompany(c));
      this.companies.set(list);
      return list;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Fetch a single company by code (including full audit trail)
   */
  async getCompany(code: string): Promise<Company | null> {
    if (!code) return null;

    try {
      const result = await firstValueFrom(
        this.apollo.query<{
          company: CompanyApiResponse | null;
        }>({
          query: GET_COMPANY,
          variables: { code: code.trim().toUpperCase() },
          fetchPolicy: 'network-only'
        })
      );

      const raw = result?.data?.company;
      if (!raw) return null;

      const mapped = this.mapCompany(raw);
      this.upsertCompany(mapped);
      return mapped;
    } catch (err) {
      console.error(`Failed to fetch company [${code}]:`, err);
      // Fallback to in-memory if available
      return this.getByCode(code) ?? null;
    }
  }

  /**
   * Check if a 2-character company code is already in use
   */
  async checkCodeExists(code: string): Promise<boolean> {
    if (!code || code.trim().length !== 2) return false;

    try {
      const result = await firstValueFrom(
        this.apollo.query<{
          checkCompanyCodeExists: boolean;
        }>({
          query: CHECK_COMPANY_CODE_EXISTS,
          variables: { code: code.trim().toUpperCase() },
          fetchPolicy: 'network-only'
        })
      );

      return !!result?.data?.checkCompanyCodeExists;
    } catch (err) {
      console.error('Failed to check company code existence:', err);
      // Local fallback
      return this.companies().some(
        c => c.code.toUpperCase() === code.trim().toUpperCase()
      );
    }
  }

  /**
   * Save (Create or Update) a company
   */
  async save(company: Company, isNew: boolean): Promise<Company> {
    const input = this.mapCompanyToInput(company);

    const result = await firstValueFrom(
      this.apollo.mutate<{
        createCompany?: CompanyPayloadApiResponse;
        updateCompany?: CompanyPayloadApiResponse;
      }>({
        mutation: isNew ? CREATE_COMPANY : UPDATE_COMPANY,
        variables: { input }
      })
    );

    const payload = isNew ? result.data?.createCompany : result.data?.updateCompany;

    if (!payload) {
      throw new Error('The server did not return a response for the company save operation.');
    }

    if (!payload.success) {
      throw new Error(payload.message || 'Unable to save company details.');
    }

    let savedCompany: Company;

    if (payload.companyDetails) {
      savedCompany = this.mapCompany(payload.companyDetails);
    } else {
      // Re-fetch to get latest state
      const reloaded = await this.getCompany(company.code);
      if (!reloaded) {
        throw new Error(payload.message || 'Company was saved but could not be reloaded.');
      }
      savedCompany = reloaded;
    }

    this.upsertCompany(savedCompany);
    return savedCompany;
  }

  /**
   * Delete a company by code
   */
  async remove(code: string, name?: string): Promise<void> {
    const cleanCode = code.trim().toUpperCase();

    const result = await firstValueFrom(
      this.apollo.mutate<{
        deleteCompany?: CompanyPayloadApiResponse;
      }>({
        mutation: DELETE_COMPANY,
        variables: { code: cleanCode }
      })
    );

    const payload = result.data?.deleteCompany;

    if (!payload) {
      throw new Error('The server did not return a response for the delete operation.');
    }

    if (!payload.success) {
      throw new Error(payload.message || `Unable to delete company ${name ?? cleanCode}.`);
    }

    this.companies.update(list => list.filter(c => c.code.toUpperCase() !== cleanCode));
  }

  /**
   * Synchronous lookup from memory
   */
  getByCode(code: string): Company | undefined {
    return this.companies().find(
      c => c.code.toUpperCase() === code.trim().toUpperCase()
    );
  }

  /**
   * Retrieve audit trail for a company, newest first
   */
  auditTrailFor(code: string, limit = 50): CompanyAuditTrail[] {
    const company = this.getByCode(code);
    const trail = company?.audit ?? [];
    return [...trail]
      .sort((a, b) => new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime())
      .slice(0, limit);
  }

  private upsertCompany(company: Company): void {
    this.companies.update(list => {
      const idx = list.findIndex(c => c.code.toUpperCase() === company.code.toUpperCase());
      if (idx === -1) {
        return [company, ...list];
      }
      return list.map((item, i) => (i === idx ? company : item));
    });
  }

  private mapCompanyToInput(company: Company): CompanyInputApi {
    return {
      companyCode: company.code.trim().toUpperCase(),
      companyName: company.name.trim(),
      companyDisplayName: company.displayName.trim(),
      addressLineOne: company.addressLine1.trim(),
      addressLineTwo: company.addressLine2?.trim() || null,
      city: company.city.trim(),
      stateCode: company.stateCode.trim(),
      countryCode: company.countryCode.trim().toUpperCase(),
      postalCode: company.postalCode.trim(),
      contact: company.contact.trim(),
      email: company.email.trim(),
      website: company.website?.trim() || null,
      logo: company.logo?.trim() || null,
      currencyCode: company.currencyCode?.trim() || '',
      timeZone: company.timeZone?.trim() || '',
      isTestCompany: !!company.isTestCompany,
      isActive: company.isActive ?? true
    };
  }

  private mapCompany(company: CompanyApiResponse): Company {
    return {
      sequence: company.sequence,
      accountId: company.accountId,
      code: company.code,
      name: company.name,
      displayName: company.displayName,
      addressLine1: company.addressLineOne,
      addressLine2: company.addressLineTwo,
      city: company.city,
      stateCode: company.stateCode,
      countryCode: company.countryCode,
      postalCode: company.postalCode,
      contact: company.contact,
      email: company.email,
      website: company.website,
      logo: company.logo,
      currencyCode: company.currencyCode,
      timeZone: company.timeZone,
      isTestCompany: company.isTestCompany,
      isActive: company.isActive,
      dateCreated: company.dateCreated,
      audit: company.audit ?? []
    };
  }
}
