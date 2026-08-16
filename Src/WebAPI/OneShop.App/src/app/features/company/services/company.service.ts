import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { Company, CompanyAuditTrail } from '../models/company.model';

const GET_COMPANIES = gql`
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

@Injectable({
  providedIn: 'root'
})
export class CompanyService {

  private apollo = inject(Apollo);

  readonly companies = signal<Company[]>([]);

  readonly loading = signal(false);

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

      const apiCompanies = result?.data?.companies ?? [];

      const companies = apiCompanies.map(company =>
        this.mapCompany(company)
      );

      this.companies.set(companies);

      return companies;

    } finally {
      this.loading.set(false);
    }
  }

  async save(company: Company, isNew: boolean): Promise<Company> {
    throw new Error('Company save mutation is not implemented yet.');
  }

  async remove(code: string, name: string): Promise<void> {
    throw new Error('Company delete mutation is not implemented yet.');
  }

  getByCode(code: string): Company | undefined {
    return this.companies().find(
      company => company.code === code
    );
  }

  auditTrailFor(
    code: string,
    limit = 20
  ): CompanyAuditTrail[] {

    const company = this.companies().find(
      c => c.code === code
    );

    return company?.audit?.slice(0, limit) ?? [];
  }

  private mapCompany(company: CompanyApiResponse): Company {
    return {
      sequence: company.sequence,
      accountId: company.accountId,
      code: company.code,
      name: company.name,
      displayName: company.displayName,

      // GraphQL names → Angular model names
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

interface CompanyApiResponse {
  sequence: number;
  accountId: string;
  code: string;
  name: string;
  displayName: string;

  addressLineOne: string;
  addressLineTwo: string;

  city: string;
  stateCode: string;
  countryCode: string;
  postalCode: string;
  contact: string;
  email: string;
  website: string;
  logo: string | null;
  currencyCode: string;
  timeZone: string;
  isTestCompany: boolean;
  isActive: boolean;
  dateCreated: string;

  audit: CompanyAuditTrail[];
}
