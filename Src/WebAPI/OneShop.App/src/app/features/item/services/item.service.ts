import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { Item, ItemInput } from '../models/item.model';

export const GET_ITEMS = gql`
  query GetItems($companyCode: String, $salesChannel: String) {
    items(companyCode: $companyCode, salesChannel: $salesChannel) {
      sequence
      accountId
      companyCode
      companyName
      itemNumber
      name
      displayName
      description
      category
      salesChannel
      b2cPrice
      b2cCompareAtPrice
      b2bPrice
      b2bMinQuantity
      unitOfMeasure
      season
      brand
      tags
      images
      isActive
      dateCreated
      variants {
        sequence
        colourCode
        colourName
        colourHex
        sizeCode
        sizeName
        sku
        barcode
        additionalPrice
        isActive
      }
      audit {
        sequence
        itemNumber
        field
        description
        dateModified
        modifiedBy
      }
    }
  }
`;

export const GET_ITEM = gql`
  query GetItem($companyCode: String!, $itemNumber: String!) {
    item(companyCode: $companyCode, itemNumber: $itemNumber) {
      sequence
      accountId
      companyCode
      companyName
      itemNumber
      name
      displayName
      description
      category
      salesChannel
      b2cPrice
      b2cCompareAtPrice
      b2bPrice
      b2bMinQuantity
      unitOfMeasure
      season
      brand
      tags
      images
      isActive
      dateCreated
      variants {
        sequence
        colourCode
        colourName
        colourHex
        sizeCode
        sizeName
        sku
        barcode
        additionalPrice
        isActive
      }
      audit {
        sequence
        itemNumber
        field
        description
        dateModified
        modifiedBy
      }
    }
  }
`;

export const CHECK_ITEM_NUMBER_EXISTS = gql`
  query CheckItemNumberExists($companyCode: String!, $itemNumber: String!) {
    checkItemNumberExists(companyCode: $companyCode, itemNumber: $itemNumber)
  }
`;

export const CREATE_ITEM = gql`
  mutation CreateItem($input: ItemInput!) {
    createItem(input: $input) {
      success
      message
      itemDetails {
        itemNumber
        name
      }
    }
  }
`;

export const UPDATE_ITEM = gql`
  mutation UpdateItem($input: ItemInput!) {
    updateItem(input: $input) {
      success
      message
      itemDetails {
        itemNumber
        name
      }
    }
  }
`;

export const DELETE_ITEM = gql`
  mutation DeleteItem($companyCode: String!, $itemNumber: String!) {
    deleteItem(companyCode: $companyCode, itemNumber: $itemNumber) {
      success
      message
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private apollo = inject(Apollo);

  items = signal<Item[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  async list(companyCode?: string, salesChannel?: string): Promise<Item[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await firstValueFrom(
        this.apollo.query<{ items: Item[] }>({
          query: GET_ITEMS,
          variables: { companyCode: companyCode || null, salesChannel: salesChannel || null },
          fetchPolicy: 'network-only'
        })
      );

      const list = result?.data?.items ?? [];
      this.items.set(list);
      return list;
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch items.';
      this.error.set(msg);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async get(companyCode: string, itemNumber: string): Promise<Item | null> {
    const cached = this.items().find(
      i => i.companyCode.toUpperCase() === companyCode.toUpperCase() && i.itemNumber.toUpperCase() === itemNumber.toUpperCase()
    );
    if (cached?.variants && cached.variants.length > 0 && cached?.audit && cached.audit.length > 0) {
      return cached;
    }

    try {
      const result = await firstValueFrom(
        this.apollo.query<{ item: Item | null }>({
          query: GET_ITEM,
          variables: { companyCode, itemNumber },
          fetchPolicy: 'network-only'
        })
      );

      return result?.data?.item ?? null;
    } catch (err: any) {
      console.error('Failed to get item details:', err);
      return cached ?? null;
    }
  }

  async checkNumberExists(companyCode: string, itemNumber: string): Promise<boolean> {
    const result = await firstValueFrom(
      this.apollo.query<{ checkItemNumberExists: boolean }>({
        query: CHECK_ITEM_NUMBER_EXISTS,
        variables: { companyCode, itemNumber },
        fetchPolicy: 'network-only'
      })
    );
    return !!result?.data?.checkItemNumberExists;
  }

  async create(input: ItemInput): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ createItem: { success: boolean; message: string } }>({
        mutation: CREATE_ITEM,
        variables: { input }
      })
    );

    const payload = result?.data?.createItem ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      await this.list(input.companyCode);
    }
    return payload;
  }

  async update(input: ItemInput): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ updateItem: { success: boolean; message: string } }>({
        mutation: UPDATE_ITEM,
        variables: { input }
      })
    );

    const payload = result?.data?.updateItem ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      await this.list(input.companyCode);
    }
    return payload;
  }

  async delete(companyCode: string, itemNumber: string): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ deleteItem: { success: boolean; message: string } }>({
        mutation: DELETE_ITEM,
        variables: { companyCode, itemNumber }
      })
    );

    const payload = result?.data?.deleteItem ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      this.items.update(prev =>
        prev.filter(i => !(i.companyCode.toUpperCase() === companyCode.toUpperCase() && i.itemNumber.toUpperCase() === itemNumber.toUpperCase()))
      );
    }
    return payload;
  }
}
