import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { Collection, CollectionInput } from '../models/item.model';

export const GET_COLLECTIONS = gql`
  query GetCollections($companyCode: String, $channel: String) {
    collections(companyCode: $companyCode, channel: $channel) {
      sequence
      accountId
      companyCode
      companyName
      code
      name
      description
      season
      channel
      bannerImage
      isActive
      dateCreated
      items {
        sequence
        collectionCode
        itemNumber
        sizeCode
        sizeName
        itemName
        itemDisplayName
        category
        salesChannel
        b2cPrice
        b2bPrice
        b2bMinQuantity
        sortOrder
      }
    }
  }
`;

export const CREATE_COLLECTION = gql`
  mutation CreateCollection($input: CollectionInput!) {
    createCollection(input: $input) {
      success
      message
      collectionDetails {
        code
        name
      }
    }
  }
`;

export const UPDATE_COLLECTION = gql`
  mutation UpdateCollection($input: CollectionInput!) {
    updateCollection(input: $input) {
      success
      message
      collectionDetails {
        code
        name
      }
    }
  }
`;

export const DELETE_COLLECTION = gql`
  mutation DeleteCollection($companyCode: String!, $code: String!) {
    deleteCollection(companyCode: $companyCode, code: $code) {
      success
      message
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private apollo = inject(Apollo);

  collections = signal<Collection[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  async list(companyCode?: string, channel?: string): Promise<Collection[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await firstValueFrom(
        this.apollo.query<{ collections: Collection[] }>({
          query: GET_COLLECTIONS,
          variables: { companyCode: companyCode || null, channel: channel || null },
          fetchPolicy: 'network-only'
        })
      );

      const items = result?.data?.collections ?? [];
      this.collections.set(items);
      return items;
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch collections.';
      this.error.set(msg);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async create(input: CollectionInput): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ createCollection: { success: boolean; message: string } }>({
        mutation: CREATE_COLLECTION,
        variables: { input }
      })
    );

    const payload = result?.data?.createCollection ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      await this.list(input.companyCode);
    }
    return payload;
  }

  async update(input: CollectionInput): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ updateCollection: { success: boolean; message: string } }>({
        mutation: UPDATE_COLLECTION,
        variables: { input }
      })
    );

    const payload = result?.data?.updateCollection ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      await this.list(input.companyCode);
    }
    return payload;
  }

  async delete(companyCode: string, code: string): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ deleteCollection: { success: boolean; message: string } }>({
        mutation: DELETE_COLLECTION,
        variables: { companyCode, code }
      })
    );

    const payload = result?.data?.deleteCollection ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      this.collections.update(prev =>
        prev.filter(c => !(c.companyCode.toUpperCase() === companyCode.toUpperCase() && c.code.toUpperCase() === code.toUpperCase()))
      );
    }
    return payload;
  }
}
