import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { Warehouse, WarehouseInput } from '../models/warehouse.model';

export const GET_WAREHOUSES = gql`
  query GetWarehouses($companyCode: String) {
    warehouses(companyCode: $companyCode) {
      sequence
      accountId
      companyCode
      companyName
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
      isTestWarehouse
      isActive
      dateCreated
      audit {
        sequence
        accountId
        companyCode
        warehouseCode
        field
        description
        dateModified
        modifiedBy
      }
    }
  }
`;

export const GET_WAREHOUSE = gql`
  query GetWarehouse($companyCode: String!, $code: String!) {
    warehouse(companyCode: $companyCode, code: $code) {
      sequence
      accountId
      companyCode
      companyName
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
      isTestWarehouse
      isActive
      dateCreated
      audit {
        sequence
        accountId
        companyCode
        warehouseCode
        field
        description
        dateModified
        modifiedBy
      }
    }
  }
`;

export const CHECK_WAREHOUSE_CODE_EXISTS = gql`
  query CheckWarehouseCodeExists($companyCode: String!, $code: String!) {
    checkWarehouseCodeExists(companyCode: $companyCode, code: $code)
  }
`;

export const CREATE_WAREHOUSE = gql`
  mutation CreateWarehouse($input: WarehouseInput!) {
    createWarehouse(input: $input) {
      success
      message
      warehouseDetails {
        code
        name
      }
    }
  }
`;

export const UPDATE_WAREHOUSE = gql`
  mutation UpdateWarehouse($input: WarehouseInput!) {
    updateWarehouse(input: $input) {
      success
      message
      warehouseDetails {
        code
        name
      }
    }
  }
`;

export const DELETE_WAREHOUSE = gql`
  mutation DeleteWarehouse($companyCode: String!, $code: String!) {
    deleteWarehouse(companyCode: $companyCode, code: $code) {
      success
      message
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {
  private apollo = inject(Apollo);

  warehouses = signal<Warehouse[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  async list(companyCode?: string): Promise<Warehouse[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await firstValueFrom(
        this.apollo.query<{ warehouses: Warehouse[] }>({
          query: GET_WAREHOUSES,
          variables: { companyCode: companyCode || null },
          fetchPolicy: 'network-only'
        })
      );

      const items = result?.data?.warehouses ?? [];
      this.warehouses.set(items);
      return items;
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch warehouses.';
      this.error.set(msg);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async get(companyCode: string, code: string): Promise<Warehouse | null> {
    const cached = this.warehouses().find(
      w => w.companyCode.toUpperCase() === companyCode.toUpperCase() && w.code.toUpperCase() === code.toUpperCase()
    );
    if (cached?.audit && cached.audit.length > 0) {
      return cached;
    }

    try {
      const result = await firstValueFrom(
        this.apollo.query<{ warehouse: Warehouse | null }>({
          query: GET_WAREHOUSE,
          variables: { companyCode, code },
          fetchPolicy: 'network-only'
        })
      );

      return result?.data?.warehouse ?? null;
    } catch (err: any) {
      console.error('Failed to get warehouse details:', err);
      return cached ?? null;
    }
  }

  async checkCodeExists(companyCode: string, code: string): Promise<boolean> {
    const result = await firstValueFrom(
      this.apollo.query<{ checkWarehouseCodeExists: boolean }>({
        query: CHECK_WAREHOUSE_CODE_EXISTS,
        variables: { companyCode, code },
        fetchPolicy: 'network-only'
      })
    );
    return !!result?.data?.checkWarehouseCodeExists;
  }

  async create(input: WarehouseInput): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ createWarehouse: { success: boolean; message: string } }>({
        mutation: CREATE_WAREHOUSE,
        variables: { input }
      })
    );

    const payload = result?.data?.createWarehouse ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      await this.list();
    }
    return payload;
  }

  async update(input: WarehouseInput): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ updateWarehouse: { success: boolean; message: string } }>({
        mutation: UPDATE_WAREHOUSE,
        variables: { input }
      })
    );

    const payload = result?.data?.updateWarehouse ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      await this.list();
    }
    return payload;
  }

  async delete(companyCode: string, code: string): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ deleteWarehouse: { success: boolean; message: string } }>({
        mutation: DELETE_WAREHOUSE,
        variables: { companyCode, code }
      })
    );

    const payload = result?.data?.deleteWarehouse ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      this.warehouses.update(prev =>
        prev.filter(w => !(w.companyCode.toUpperCase() === companyCode.toUpperCase() && w.code.toUpperCase() === code.toUpperCase()))
      );
    }
    return payload;
  }
}
