import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { Size, SizeInput } from '../models/size.model';

export const GET_SIZES = gql`
  query GetSizes($companyCode: String) {
    sizes(companyCode: $companyCode) {
      sequence
      accountId
      companyCode
      companyName
      code
      name
      sortOrder
      isActive
      dateCreated
      audit {
        sequence
        accountId
        companyCode
        sizeCode
        field
        description
        dateModified
        modifiedBy
      }
    }
  }
`;

export const CHECK_SIZE_CODE_EXISTS = gql`
  query CheckSizeCodeExists($companyCode: String!, $code: String!) {
    checkSizeCodeExists(companyCode: $companyCode, code: $code)
  }
`;

export const CREATE_SIZE = gql`
  mutation CreateSize($input: SizeInput!) {
    createSize(input: $input) {
      success
      message
      sizeDetails {
        code
        name
      }
    }
  }
`;

export const UPDATE_SIZE = gql`
  mutation UpdateSize($input: SizeInput!) {
    updateSize(input: $input) {
      success
      message
      sizeDetails {
        code
        name
      }
    }
  }
`;

export const DELETE_SIZE = gql`
  mutation DeleteSize($companyCode: String!, $code: String!) {
    deleteSize(companyCode: $companyCode, code: $code) {
      success
      message
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class SizeService {
  private apollo = inject(Apollo);

  sizes = signal<Size[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  async list(companyCode?: string): Promise<Size[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await firstValueFrom(
        this.apollo.query<{ sizes: Size[] }>({
          query: GET_SIZES,
          variables: { companyCode: companyCode || null },
          fetchPolicy: 'network-only'
        })
      );

      const items = result?.data?.sizes ?? [];
      this.sizes.set(items);
      return items;
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch sizes.';
      this.error.set(msg);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async checkCodeExists(companyCode: string, code: string): Promise<boolean> {
    const result = await firstValueFrom(
      this.apollo.query<{ checkSizeCodeExists: boolean }>({
        query: CHECK_SIZE_CODE_EXISTS,
        variables: { companyCode, code },
        fetchPolicy: 'network-only'
      })
    );
    return !!result?.data?.checkSizeCodeExists;
  }

  async create(input: SizeInput): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ createSize: { success: boolean; message: string } }>({
        mutation: CREATE_SIZE,
        variables: { input }
      })
    );

    const payload = result?.data?.createSize ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      await this.list(input.companyCode);
    }
    return payload;
  }

  async update(input: SizeInput): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ updateSize: { success: boolean; message: string } }>({
        mutation: UPDATE_SIZE,
        variables: { input }
      })
    );

    const payload = result?.data?.updateSize ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      await this.list(input.companyCode);
    }
    return payload;
  }

  async delete(companyCode: string, code: string): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ deleteSize: { success: boolean; message: string } }>({
        mutation: DELETE_SIZE,
        variables: { companyCode, code }
      })
    );

    const payload = result?.data?.deleteSize ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      this.sizes.update(prev =>
        prev.filter(s => !(s.companyCode.toUpperCase() === companyCode.toUpperCase() && s.code.toUpperCase() === code.toUpperCase()))
      );
    }
    return payload;
  }
}
