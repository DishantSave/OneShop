import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { SubAccount, SubAccountAuditTrail } from '../models/user.model';

const GET_SUB_ACCOUNTS = gql`
  query GetSubAccounts {
    subAccounts {
      sequence
      userName
      accountId
      subUserId
      designation
      department
      isCustomerAccount
      isSellerAccount
      company
      profilePicture
      email
      contact
      country
      isTestAccount
      isActive
      dateCreated
      dateModified
      screenAccess {
        screenName
        canView
        canCreate
        canEdit
        canDelete
      }
    }
  }
`;

const GET_SUB_ACCOUNT_BY_USER_NAME = gql`
  query GetSubAccount($userName: String!) {
    subAccount(userName: $userName) {
      sequence
      userName
      accountId
      subUserId
      designation
      department
      isCustomerAccount
      isSellerAccount
      company
      profilePicture
      email
      contact
      country
      isTestAccount
      isActive
      dateCreated
      dateModified
      screenAccess {
        screenName
        canView
        canCreate
        canEdit
        canDelete
      }
      audit {
        sequence
        userName
        field
        description
        dateModified
        modifiedBy
      }
    }
  }
`;

const CHECK_SUB_ACCOUNT_USERNAME_EXISTS = gql`
  query CheckSubAccountUserNameExists($userName: String!) {
    checkSubAccountUserNameExists(userName: $userName)
  }
`;

const CREATE_SUB_ACCOUNT = gql`
  mutation CreateSubAccount($input: SubAccountInput!) {
    createSubAccount(input: $input) {
      success
      message
      userDetails {
        sequence
        userName
        accountId
        subUserId
        designation
        department
        isCustomerAccount
        isSellerAccount
        company
        profilePicture
        email
        contact
        country
        isTestAccount
        isActive
        dateCreated
        dateModified
        screenAccess {
          screenName
          canView
          canCreate
          canEdit
          canDelete
        }
      }
    }
  }
`;

const UPDATE_SUB_ACCOUNT = gql`
  mutation UpdateSubAccount($input: SubAccountInput!) {
    updateSubAccount(input: $input) {
      success
      message
      userDetails {
        sequence
        userName
        accountId
        subUserId
        designation
        department
        isCustomerAccount
        isSellerAccount
        company
        profilePicture
        email
        contact
        country
        isTestAccount
        isActive
        dateCreated
        dateModified
        screenAccess {
          screenName
          canView
          canCreate
          canEdit
          canDelete
        }
      }
    }
  }
`;

const DELETE_SUB_ACCOUNT = gql`
  mutation DeleteSubAccount($userName: String!) {
    deleteSubAccount(userName: $userName) {
      success
      message
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class UserService {
  private apollo = inject(Apollo);

  users = signal<SubAccount[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  async list(): Promise<SubAccount[]> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.apollo.query<{ subAccounts: SubAccount[] }>({
          query: GET_SUB_ACCOUNTS,
          fetchPolicy: 'network-only'
        })
      );
      const data = res.data?.subAccounts ?? [];
      this.users.set(data);
      return data;
    } catch (err: any) {
      this.error.set(err?.message ?? 'Failed to load sub-accounts.');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async getByUserName(userName: string): Promise<SubAccount | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.apollo.query<{ subAccount: SubAccount | null }>({
          query: GET_SUB_ACCOUNT_BY_USER_NAME,
          variables: { userName },
          fetchPolicy: 'network-only'
        })
      );
      const user = res.data?.subAccount ?? null;
      if (user) {
        if (user.audit && !user.auditTrail) {
          user.auditTrail = user.audit;
        }
        this.users.update(list => {
          const idx = list.findIndex(u => u.userName.toUpperCase() === userName.toUpperCase());
          if (idx >= 0) {
            const next = [...list];
            next[idx] = user;
            return next;
          }
          return [...list, user];
        });
      }
      return user;
    } catch (err: any) {
      console.warn('Network error loading sub-account, checking memory cache:', err);
      const cached = this.users().find(u => u.userName.toUpperCase() === userName.toUpperCase());
      if (cached) {
        return cached;
      }
      this.error.set(err?.message ?? 'Failed to load sub-account details.');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async checkUserNameExists(userName: string): Promise<boolean> {
    try {
      const res = await firstValueFrom(
        this.apollo.query<{ checkSubAccountUserNameExists: boolean }>({
          query: CHECK_SUB_ACCOUNT_USERNAME_EXISTS,
          variables: { userName },
          fetchPolicy: 'network-only'
        })
      );
      return !!res.data?.checkSubAccountUserNameExists;
    } catch {
      return false;
    }
  }

  async create(input: any): Promise<{ success: boolean; message: string; subAccount?: SubAccount }> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.apollo.mutate<{ createSubAccount: { success: boolean; message: string; userDetails?: SubAccount } }>({
          mutation: CREATE_SUB_ACCOUNT,
          variables: { input }
        })
      );
      const payload = res.data?.createSubAccount;
      const account = payload?.userDetails;
      if (payload?.success && account) {
        this.users.update(list => [account, ...list]);
      }
      return {
        success: !!payload?.success,
        message: payload?.message ?? 'No response received.',
        subAccount: account
      };
    } catch (err: any) {
      this.error.set(err?.message ?? 'Failed to create sub-account.');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async update(input: any): Promise<{ success: boolean; message: string; subAccount?: SubAccount }> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.apollo.mutate<{ updateSubAccount: { success: boolean; message: string; userDetails?: SubAccount } }>({
          mutation: UPDATE_SUB_ACCOUNT,
          variables: { input }
        })
      );
      const payload = res.data?.updateSubAccount;
      const account = payload?.userDetails;
      if (payload?.success && account) {
        this.users.update(list => {
          const idx = list.findIndex(u => u.userName.toUpperCase() === account.userName.toUpperCase());
          if (idx >= 0) {
            const next = [...list];
            next[idx] = account;
            return next;
          }
          return [account, ...list];
        });
      }
      return {
        success: !!payload?.success,
        message: payload?.message ?? 'No response received.',
        subAccount: account
      };
    } catch (err: any) {
      this.error.set(err?.message ?? 'Failed to update sub-account.');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async delete(userName: string): Promise<{ success: boolean; message: string }> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.apollo.mutate<{ deleteSubAccount: { success: boolean; message: string } }>({
          mutation: DELETE_SUB_ACCOUNT,
          variables: { userName }
        })
      );
      const payload = res.data?.deleteSubAccount;
      if (payload?.success) {
        this.users.update(list => list.filter(u => u.userName.toUpperCase() !== userName.toUpperCase()));
      }
      return payload ?? { success: false, message: 'No response received.' };
    } catch (err: any) {
      this.error.set(err?.message ?? 'Failed to delete sub-account.');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  auditTrailFor(userName: string): SubAccountAuditTrail[] {
    const user = this.users().find(u => u.userName.toUpperCase() === userName.toUpperCase());
    return user?.auditTrail ?? [];
  }
}
