import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { Store, StoreAuditTrail } from '../models/store.model';

export const GET_STORES = gql`
  query GetStores($companyCode: String) {
    stores(companyCode: $companyCode) {
      sequence
      accountId
      companyCode
      companyName
      code
      name
      displayName
      storeType
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
      isTestStore
      originalIsTestStore
      isActive
      originalIsActive
      dateCreated
      audit {
        sequence
        accountId
        companyCode
        storeCode
        field
        description
        dateModified
        modifiedBy
      }
    }
  }
`;

export const GET_STORE = gql`
  query GetStore($companyCode: String!, $code: String!) {
    store(companyCode: $companyCode, code: $code) {
      sequence
      accountId
      companyCode
      companyName
      code
      name
      displayName
      storeType
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
      isTestStore
      originalIsTestStore
      isActive
      originalIsActive
      dateCreated
      audit {
        sequence
        accountId
        companyCode
        storeCode
        field
        description
        dateModified
        modifiedBy
      }
    }
  }
`;

export const CHECK_STORE_CODE_EXISTS = gql`
  query CheckStoreCodeExists($companyCode: String!, $code: String!) {
    checkStoreCodeExists(companyCode: $companyCode, code: $code)
  }
`;

export const CREATE_STORE = gql`
  mutation CreateStore($input: StoreInput!) {
    createStore(input: $input) {
      success
      message
      storeDetails {
        sequence
        accountId
        companyCode
        companyName
        code
        name
        displayName
        storeType
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
        isTestStore
        originalIsTestStore
        isActive
        originalIsActive
        dateCreated
        audit {
          sequence
          accountId
          companyCode
          storeCode
          field
          description
          dateModified
          modifiedBy
        }
      }
    }
  }
`;

export const UPDATE_STORE = gql`
  mutation UpdateStore($input: StoreInput!) {
    updateStore(input: $input) {
      success
      message
      storeDetails {
        sequence
        accountId
        companyCode
        companyName
        code
        name
        displayName
        storeType
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
        isTestStore
        originalIsTestStore
        isActive
        originalIsActive
        dateCreated
        audit {
          sequence
          accountId
          companyCode
          storeCode
          field
          description
          dateModified
          modifiedBy
        }
      }
    }
  }
`;

export const DELETE_STORE = gql`
  mutation DeleteStore($companyCode: String!, $code: String!) {
    deleteStore(companyCode: $companyCode, code: $code) {
      success
      message
    }
  }
`;

export interface StoreInputApi {
  companyCode: string;
  storeCode: string;
  storeName: string;
  storeDisplayName: string;
  storeType: string;
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
  isTestStore: boolean;
  isActive: boolean;
}

interface StorePayloadApiResponse {
  success: boolean;
  message: string;
  storeDetails?: StoreApiResponse | null;
}

interface StoreApiResponse {
  sequence: number;
  accountId: string;
  companyCode: string;
  companyName?: string | null;
  code: string;
  name: string;
  displayName: string;
  storeType: string;
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
  isTestStore: boolean;
  originalIsTestStore: boolean;
  isActive: boolean;
  originalIsActive: boolean;
  dateCreated: string;
  audit?: StoreAuditTrail[];
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private apollo = inject(Apollo);

  readonly stores = signal<Store[]>([]);
  readonly loading = signal(false);

  /**
   * Fetch all stores for the tenant (optionally filtered by company)
   */
  async list(companyCode?: string): Promise<Store[]> {
    this.loading.set(true);

    try {
      const result = await firstValueFrom(
        this.apollo.query<{
          stores: StoreApiResponse[];
        }>({
          query: GET_STORES,
          variables: { companyCode: companyCode || null },
          fetchPolicy: 'network-only'
        })
      );

      const list = (result?.data?.stores ?? []).map(s => this.mapStore(s));
      this.stores.set(list);
      return list;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Fetch a single store by companyCode and storeCode (with audit trail)
   */
  async getStore(companyCode: string, code: string): Promise<Store | null> {
    if (!companyCode || !code) return null;

    try {
      const result = await firstValueFrom(
        this.apollo.query<{
          store: StoreApiResponse | null;
        }>({
          query: GET_STORE,
          variables: {
            companyCode: companyCode.trim().toUpperCase(),
            code: code.trim().toUpperCase()
          },
          fetchPolicy: 'network-only'
        })
      );

      const raw = result?.data?.store;
      if (!raw) return null;

      const mapped = this.mapStore(raw);
      this.upsertStore(mapped);
      return mapped;
    } catch (err) {
      console.error(`Failed to fetch store [${companyCode}:${code}]:`, err);
      return this.getByCode(companyCode, code) ?? null;
    }
  }

  /**
   * Check if a store code is already taken in the specified company
   */
  async checkCodeExists(companyCode: string, code: string): Promise<boolean> {
    if (!companyCode || !code || code.trim().length < 2) return false;

    try {
      const result = await firstValueFrom(
        this.apollo.query<{
          checkStoreCodeExists: boolean;
        }>({
          query: CHECK_STORE_CODE_EXISTS,
          variables: {
            companyCode: companyCode.trim().toUpperCase(),
            code: code.trim().toUpperCase()
          },
          fetchPolicy: 'network-only'
        })
      );

      return !!result?.data?.checkStoreCodeExists;
    } catch (err) {
      console.error('Failed to check store code existence:', err);
      return this.stores().some(
        s => s.companyCode.toUpperCase() === companyCode.trim().toUpperCase() &&
             s.code.toUpperCase() === code.trim().toUpperCase()
      );
    }
  }

  /**
   * Save (Create or Update) a store
   */
  async save(store: Store, isNew: boolean): Promise<Store> {
    const input = this.mapStoreToInput(store);

    const result = await firstValueFrom(
      this.apollo.mutate<{
        createStore?: StorePayloadApiResponse;
        updateStore?: StorePayloadApiResponse;
      }>({
        mutation: isNew ? CREATE_STORE : UPDATE_STORE,
        variables: { input }
      })
    );

    const payload = isNew ? result.data?.createStore : result.data?.updateStore;

    if (!payload) {
      throw new Error('The server did not return a response for the store save operation.');
    }

    if (!payload.success) {
      throw new Error(payload.message || 'Unable to save store details.');
    }

    let savedStore: Store;

    if (payload.storeDetails) {
      savedStore = this.mapStore(payload.storeDetails);
    } else {
      const reloaded = await this.getStore(store.companyCode, store.code);
      if (!reloaded) {
        throw new Error(payload.message || 'Store was saved but could not be reloaded.');
      }
      savedStore = reloaded;
    }

    this.upsertStore(savedStore);
    return savedStore;
  }

  /**
   * Delete a store by company code and store code
   */
  async remove(companyCode: string, code: string, name?: string): Promise<void> {
    const cCode = companyCode.trim().toUpperCase();
    const sCode = code.trim().toUpperCase();

    const result = await firstValueFrom(
      this.apollo.mutate<{
        deleteStore?: StorePayloadApiResponse;
      }>({
        mutation: DELETE_STORE,
        variables: { companyCode: cCode, code: sCode }
      })
    );

    const payload = result.data?.deleteStore;

    if (!payload) {
      throw new Error('The server did not return a response for the delete operation.');
    }

    if (!payload.success) {
      throw new Error(payload.message || `Unable to delete store ${name ?? sCode}.`);
    }

    this.stores.update(list => list.filter(
      s => !(s.companyCode.toUpperCase() === cCode && s.code.toUpperCase() === sCode)
    ));
  }

  getByCode(companyCode: string, code: string): Store | undefined {
    return this.stores().find(
      s => s.companyCode.toUpperCase() === companyCode.trim().toUpperCase() &&
           s.code.toUpperCase() === code.trim().toUpperCase()
    );
  }

  auditTrailFor(companyCode: string, code: string, limit = 50): StoreAuditTrail[] {
    const store = this.getByCode(companyCode, code);
    const trail = store?.audit ?? [];
    return [...trail]
      .sort((a, b) => new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime())
      .slice(0, limit);
  }

  private upsertStore(store: Store): void {
    this.stores.update(list => {
      const idx = list.findIndex(
        s => s.companyCode.toUpperCase() === store.companyCode.toUpperCase() &&
             s.code.toUpperCase() === store.code.toUpperCase()
      );
      if (idx === -1) {
        return [store, ...list];
      }
      return list.map((item, i) => (i === idx ? store : item));
    });
  }

  private mapStoreToInput(store: Store): StoreInputApi {
    return {
      companyCode: store.companyCode.trim().toUpperCase(),
      storeCode: store.code.trim().toUpperCase(),
      storeName: store.name.trim(),
      storeDisplayName: store.displayName.trim(),
      storeType: store.storeType?.toString().trim() || 'Physical',
      addressLineOne: store.addressLine1.trim(),
      addressLineTwo: store.addressLine2?.trim() || null,
      city: store.city.trim(),
      stateCode: store.stateCode.trim(),
      countryCode: store.countryCode.trim().toUpperCase(),
      postalCode: store.postalCode.trim(),
      contact: store.contact.trim(),
      email: store.email.trim(),
      website: store.website?.trim() || null,
      logo: store.logo?.trim() || null,
      currencyCode: store.currencyCode?.trim() || '',
      timeZone: store.timeZone?.trim() || '',
      isTestStore: !!store.isTestStore,
      isActive: store.isActive ?? true
    };
  }

  private mapStore(store: StoreApiResponse): Store {
    return {
      sequence: store.sequence,
      accountId: store.accountId,
      companyCode: store.companyCode,
      companyName: store.companyName,
      code: store.code,
      name: store.name,
      displayName: store.displayName,
      storeType: store.storeType || 'Physical',
      addressLine1: store.addressLineOne,
      addressLine2: store.addressLineTwo,
      city: store.city,
      stateCode: store.stateCode,
      countryCode: store.countryCode,
      postalCode: store.postalCode,
      contact: store.contact,
      email: store.email,
      website: store.website,
      logo: store.logo,
      currencyCode: store.currencyCode,
      timeZone: store.timeZone,
      isTestStore: store.isTestStore,
      originalIsTestStore: store.originalIsTestStore,
      isActive: store.isActive,
      originalIsActive: store.originalIsActive,
      dateCreated: store.dateCreated,
      audit: store.audit ?? []
    };
  }
}
