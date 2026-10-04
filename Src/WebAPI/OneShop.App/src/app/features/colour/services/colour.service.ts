import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { Colour, ColourInput } from '../models/colour.model';

export const GET_COLOURS = gql`
  query GetColours($companyCode: String) {
    colours(companyCode: $companyCode) {
      sequence
      accountId
      companyCode
      companyName
      code
      name
      hexCode
      isActive
      dateCreated
      audit {
        sequence
        accountId
        companyCode
        colourCode
        field
        description
        dateModified
        modifiedBy
      }
    }
  }
`;

export const CHECK_COLOUR_CODE_EXISTS = gql`
  query CheckColourCodeExists($companyCode: String!, $code: String!) {
    checkColourCodeExists(companyCode: $companyCode, code: $code)
  }
`;

export const CREATE_COLOUR = gql`
  mutation CreateColour($input: ColourInput!) {
    createColour(input: $input) {
      success
      message
      colourDetails {
        code
        name
      }
    }
  }
`;

export const UPDATE_COLOUR = gql`
  mutation UpdateColour($input: ColourInput!) {
    updateColour(input: $input) {
      success
      message
      colourDetails {
        code
        name
      }
    }
  }
`;

export const DELETE_COLOUR = gql`
  mutation DeleteColour($companyCode: String!, $code: String!) {
    deleteColour(companyCode: $companyCode, code: $code) {
      success
      message
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class ColourService {
  private apollo = inject(Apollo);

  colours = signal<Colour[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  async list(companyCode?: string): Promise<Colour[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await firstValueFrom(
        this.apollo.query<{ colours: Colour[] }>({
          query: GET_COLOURS,
          variables: { companyCode: companyCode || null },
          fetchPolicy: 'network-only'
        })
      );

      const items = result?.data?.colours ?? [];
      this.colours.set(items);
      return items;
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch colours.';
      this.error.set(msg);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async checkCodeExists(companyCode: string, code: string): Promise<boolean> {
    const result = await firstValueFrom(
      this.apollo.query<{ checkColourCodeExists: boolean }>({
        query: CHECK_COLOUR_CODE_EXISTS,
        variables: { companyCode, code },
        fetchPolicy: 'network-only'
      })
    );
    return !!result?.data?.checkColourCodeExists;
  }

  async create(input: ColourInput): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ createColour: { success: boolean; message: string } }>({
        mutation: CREATE_COLOUR,
        variables: { input }
      })
    );

    const payload = result?.data?.createColour ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      await this.list(input.companyCode);
    }
    return payload;
  }

  async update(input: ColourInput): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ updateColour: { success: boolean; message: string } }>({
        mutation: UPDATE_COLOUR,
        variables: { input }
      })
    );

    const payload = result?.data?.updateColour ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      await this.list(input.companyCode);
    }
    return payload;
  }

  async delete(companyCode: string, code: string): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ deleteColour: { success: boolean; message: string } }>({
        mutation: DELETE_COLOUR,
        variables: { companyCode, code }
      })
    );

    const payload = result?.data?.deleteColour ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      this.colours.update(prev =>
        prev.filter(c => !(c.companyCode.toUpperCase() === companyCode.toUpperCase() && c.code.toUpperCase() === code.toUpperCase()))
      );
    }
    return payload;
  }
}
