import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { Inventory, InventoryInput, BatchInventoryAdjustmentInput } from '../models/inventory.model';

export const GET_INVENTORY = gql`
  query GetInventory($companyCode: String, $locationType: String, $locationCode: String, $itemNumber: String) {
    inventory(companyCode: $companyCode, locationType: $locationType, locationCode: $locationCode, itemNumber: $itemNumber) {
      sequence
      accountId
      companyCode
      companyName
      itemNumber
      itemName
      itemDisplayName
      colourCode
      colourName
      colourHex
      sizeCode
      sizeName
      locationType
      locationCode
      locationName
      quantityOnHand
      allocatedQuantity
      availableQuantity
      reorderLevel
      dateModified
    }
  }
`;

export const GET_INVENTORY_RECORD = gql`
  query GetInventoryRecord($companyCode: String!, $itemNumber: String!, $colourCode: String!, $sizeCode: String!, $locationType: String!, $locationCode: String!) {
    inventoryRecord(
      companyCode: $companyCode,
      itemNumber: $itemNumber,
      colourCode: $colourCode,
      sizeCode: $sizeCode,
      locationType: $locationType,
      locationCode: $locationCode
    ) {
      sequence
      companyCode
      itemNumber
      itemName
      colourCode
      sizeCode
      locationType
      locationCode
      locationName
      quantityOnHand
      allocatedQuantity
      availableQuantity
      reorderLevel
      dateModified
      audit {
        sequence
        field
        description
        dateModified
        modifiedBy
      }
    }
  }
`;

export const UPSERT_INVENTORY = gql`
  mutation UpsertInventory($input: InventoryInput!) {
    upsertInventory(input: $input) {
      success
      message
    }
  }
`;

export const ADJUST_INVENTORY = gql`
  mutation AdjustInventory($input: BatchInventoryAdjustmentInput!) {
    adjustInventory(input: $input) {
      success
      message
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apollo = inject(Apollo);

  inventory = signal<Inventory[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  async list(companyCode?: string, locationType?: string, locationCode?: string, itemNumber?: string): Promise<Inventory[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await firstValueFrom(
        this.apollo.query<{ inventory: Inventory[] }>({
          query: GET_INVENTORY,
          variables: {
            companyCode: companyCode || null,
            locationType: locationType || null,
            locationCode: locationCode || null,
            itemNumber: itemNumber || null
          },
          fetchPolicy: 'network-only'
        })
      );

      const items = result?.data?.inventory ?? [];
      this.inventory.set(items);
      return items;
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch inventory.';
      this.error.set(msg);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async getRecord(companyCode: string, itemNumber: string, colourCode: string, sizeCode: string, locationType: string, locationCode: string): Promise<Inventory | null> {
    try {
      const result = await firstValueFrom(
        this.apollo.query<{ inventoryRecord: Inventory | null }>({
          query: GET_INVENTORY_RECORD,
          variables: { companyCode, itemNumber, colourCode, sizeCode, locationType, locationCode },
          fetchPolicy: 'network-only'
        })
      );
      return result?.data?.inventoryRecord ?? null;
    } catch (err) {
      console.error('Failed to get inventory record:', err);
      return null;
    }
  }

  async upsert(input: InventoryInput): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ upsertInventory: { success: boolean; message: string } }>({
        mutation: UPSERT_INVENTORY,
        variables: { input }
      })
    );

    const payload = result?.data?.upsertInventory ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      await this.list(input.companyCode, input.locationType, input.locationCode);
    }
    return payload;
  }

  async adjust(input: BatchInventoryAdjustmentInput): Promise<{ success: boolean; message: string }> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ adjustInventory: { success: boolean; message: string } }>({
        mutation: ADJUST_INVENTORY,
        variables: { input }
      })
    );

    const payload = result?.data?.adjustInventory ?? { success: false, message: 'No response from server.' };
    if (payload.success) {
      await this.list(input.companyCode, input.locationType, input.locationCode);
    }
    return payload;
  }
}
