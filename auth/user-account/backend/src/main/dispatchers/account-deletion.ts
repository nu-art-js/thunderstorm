import {asDispatchKey, GraphDispatcher} from '@nu-art/ts-common';
import type {DB_Account} from '@nu-art/user-account-shared';

export interface OnAccountDeleted {
	__onAccountDeleted: (account: DB_Account) => Promise<void>;
}

export interface OnAccountPreDelete {
	__onAccountPreDelete: (account: DB_Account) => Promise<void>;
}

/*
 * Account delete graphs live here so Session (and other listeners) can decorate
 * without importing ModuleBE_AccountDB — that cycle hits TDZ on @OnDispatch.
 *
 *   pre-delete: org-purge
 *   deleted:    sessions, permissions, oauth, password leftovers
 */
export const DispatchKey_AccountOrgPurge = asDispatchKey('delete.account.org-purge');
export const DispatchKey_AccountSessions = asDispatchKey('delete.account.sessions');
export const DispatchKey_AccountPermissions = asDispatchKey('delete.account.permissions');
export const DispatchKey_AccountOAuthGrants = asDispatchKey('delete.account.oauth-grants');
export const DispatchKey_AccountOAuthTokens = asDispatchKey('delete.account.oauth-tokens');
export const DispatchKey_AccountFailedLogins = asDispatchKey('delete.account.failed-logins');
export const DispatchKey_AccountLoginAttempts = asDispatchKey('delete.account.login-attempts');
export const DispatchKey_AccountPasswordCredentials = asDispatchKey('delete.account.password-credentials');
export const DispatchKey_AccountPasswordResetTokens = asDispatchKey('delete.account.password-reset-tokens');

export const graph_OnAccountPreDelete = new GraphDispatcher<OnAccountPreDelete, '__onAccountPreDelete'>('__onAccountPreDelete');
export const graph_OnAccountDeleted = new GraphDispatcher<OnAccountDeleted, '__onAccountDeleted'>('__onAccountDeleted');
