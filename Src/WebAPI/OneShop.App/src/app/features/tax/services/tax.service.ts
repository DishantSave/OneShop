import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { StateTax, StateTaxInput } from '../models/tax.model';

export const GET_STATE_TAXES = gql`
  query GetStateTaxes($countryCode: String) {
    stateTaxes(countryCode: $countryCode) {
      sequence
      accountId
      countryCode
      stateCode
      stateName
      taxRate
      taxType
      isActive
      dateCreated
      dateModified
      createdBy
    }
  }
`;

export const GET_STATE_TAX_BY_CODE = gql`
  query GetStateTaxByCode($stateCode: String!, $countryCode: String) {
    stateTaxByCode(stateCode: $stateCode, countryCode: $countryCode) {
      sequence
      accountId
      countryCode
      stateCode
      stateName
      taxRate
      taxType
      isActive
    }
  }
`;

export const SAVE_STATE_TAX = gql`
  mutation SaveStateTax($input: StateTaxInput!) {
    saveStateTax(input: $input) {
      success
      message
      taxDetails {
        stateCode
        stateName
        taxRate
        taxType
        isActive
      }
    }
  }
`;

export const DELETE_STATE_TAX = gql`
  mutation DeleteStateTax($stateCode: String!, $countryCode: String) {
    deleteStateTax(stateCode: $stateCode, countryCode: $countryCode) {
      success
      message
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class TaxService {
  private apollo = inject(Apollo);

  taxes = signal<StateTax[]>([]);
  loading = signal<boolean>(false);

  constructor() {
    this.loadTaxes();
  }

  async loadTaxes(countryCode: string = 'IN'): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.apollo.query<{ stateTaxes: StateTax[] }>({
          query: GET_STATE_TAXES,
          variables: { countryCode },
          fetchPolicy: 'network-only'
        })
      );
      this.taxes.set(res.data?.stateTaxes || []);
    } catch (err) {
      console.error('Failed to load state taxes:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async getTaxByState(stateCode: string, countryCode: string = 'IN'): Promise<StateTax | null> {
    try {
      const res = await firstValueFrom(
        this.apollo.query<{ stateTaxByCode: StateTax | null }>({
          query: GET_STATE_TAX_BY_CODE,
          variables: { stateCode, countryCode },
          fetchPolicy: 'network-only'
        })
      );
      return res.data?.stateTaxByCode || null;
    } catch (err) {
      console.error('Failed to fetch tax by state:', err);
      return null;
    }
  }

  async saveTax(input: StateTaxInput): Promise<{ success: boolean; message: string }> {
    try {
      const res = await firstValueFrom(
        this.apollo.mutate<{ saveStateTax: { success: boolean; message: string } }>({
          mutation: SAVE_STATE_TAX,
          variables: { input }
        })
      );
      await this.loadTaxes(input.countryCode || 'IN');
      return res.data?.saveStateTax || { success: false, message: 'No response' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error saving state tax' };
    }
  }

  async deleteTax(stateCode: string, countryCode: string = 'IN'): Promise<{ success: boolean; message: string }> {
    try {
      const res = await firstValueFrom(
        this.apollo.mutate<{ deleteStateTax: { success: boolean; message: string } }>({
          mutation: DELETE_STATE_TAX,
          variables: { stateCode, countryCode }
        })
      );
      await this.loadTaxes(countryCode);
      return res.data?.deleteStateTax || { success: false, message: 'No response' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error deleting state tax' };
    }
  }
}
