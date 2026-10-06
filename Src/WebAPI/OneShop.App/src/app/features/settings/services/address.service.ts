import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { UserAddress, UserAddressInput } from '../models/address.model';

export const GET_USER_ADDRESSES = gql`
  query GetUserAddresses {
    userAddresses {
      sequence
      accountId
      userName
      addressId
      addressType
      contactName
      phone
      addressLine1
      addressLine2
      city
      state
      postalCode
      country
      isDefault
      dateCreated
    }
  }
`;

export const SAVE_USER_ADDRESS = gql`
  mutation SaveUserAddress($input: UserAddressInput!) {
    saveUserAddress(input: $input) {
      success
      message
      addressDetails {
        addressId
        addressType
        contactName
        city
        state
        isDefault
      }
    }
  }
`;

export const DELETE_USER_ADDRESS = gql`
  mutation DeleteUserAddress($addressId: String!) {
    deleteUserAddress(addressId: $addressId) {
      success
      message
    }
  }
`;

export const SET_DEFAULT_ADDRESS = gql`
  mutation SetDefaultAddress($addressId: String!) {
    setDefaultAddress(addressId: $addressId) {
      success
      message
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apollo = inject(Apollo);

  addresses = signal<UserAddress[]>([]);
  loading = signal<boolean>(false);

  constructor() {
    this.loadAddresses();
  }

  async loadAddresses(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.apollo.query<{ userAddresses: UserAddress[] }>({
          query: GET_USER_ADDRESSES,
          fetchPolicy: 'network-only'
        })
      );
      this.addresses.set(res.data?.userAddresses || []);
    } catch (err) {
      console.error('Failed to load user addresses:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async saveAddress(input: UserAddressInput): Promise<{ success: boolean; message: string }> {
    try {
      const res = await firstValueFrom(
        this.apollo.mutate<{ saveUserAddress: { success: boolean; message: string } }>({
          mutation: SAVE_USER_ADDRESS,
          variables: { input }
        })
      );
      await this.loadAddresses();
      return res.data?.saveUserAddress || { success: false, message: 'No response' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error saving address' };
    }
  }

  async deleteAddress(addressId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await firstValueFrom(
        this.apollo.mutate<{ deleteUserAddress: { success: boolean; message: string } }>({
          mutation: DELETE_USER_ADDRESS,
          variables: { addressId }
        })
      );
      await this.loadAddresses();
      return res.data?.deleteUserAddress || { success: false, message: 'No response' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error deleting address' };
    }
  }

  async setDefault(addressId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await firstValueFrom(
        this.apollo.mutate<{ setDefaultAddress: { success: boolean; message: string } }>({
          mutation: SET_DEFAULT_ADDRESS,
          variables: { addressId }
        })
      );
      await this.loadAddresses();
      return res.data?.setDefaultAddress || { success: false, message: 'No response' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error setting default address' };
    }
  }
}
