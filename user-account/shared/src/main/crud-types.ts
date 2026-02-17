/*
 * @nu-art/user-account-shared - CrudTypes and BaseDBDefBE for user-account (db-api migration)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {CrudApiDef_Type} from '@nu-art/db-api-shared';
import {CrudApiDef} from '@nu-art/db-api-shared';
import type {AccountCrudTypes} from './_entity/account/types.js';
import {DBDef_Accounts} from './_entity/account/db-def.js';
import type {SessionCrudTypes} from './_entity/session/types.js';
import {DBDef_Session} from './_entity/session/db-def.js';
import type {LoginAttemptCrudTypes} from './_entity/login-attempts/types.js';
import {DBDef_LoginAttempt} from './_entity/login-attempts/db-def.js';
import type {FailedLoginAttemptCrudTypes} from './_entity/failed-login-attempt/types.js';
import {DBDef_FailedLoginAttempt} from './_entity/failed-login-attempt/db-def.js';

// --- Account ---
export type Types_Account = AccountCrudTypes;
const validator_Account = {...DBDef_Accounts.generatedPropsValidator, ...DBDef_Accounts.modifiablePropsValidator};
export const CrudTypes_Account = {
	dbKey: DBDef_Accounts.dbKey,
	dbItem: undefined as unknown as AccountCrudTypes['dbItem'],
	uiItem: undefined as unknown as AccountCrudTypes['uiItem'],
	validator: validator_Account,
	uniqueKeys: (DBDef_Accounts.uniqueKeys ?? ['_id']) as AccountCrudTypes['uniqueKeys'],
	editableType: undefined as unknown as AccountCrudTypes['editableType'],
} as AccountCrudTypes;
export const BaseDBDefBE_Account = {
	...DBDef_Accounts,
	uniqueKeys: DBDef_Accounts.uniqueKeys ?? ['_id'],
};
export const CrudApiDef_Account: CrudApiDef_Type<AccountCrudTypes> = CrudApiDef('user-account--accounts', 'v1') as CrudApiDef_Type<AccountCrudTypes>;

// --- Session ---
export type Types_Session = SessionCrudTypes;
const validator_Session = {...DBDef_Session.generatedPropsValidator, ...DBDef_Session.modifiablePropsValidator};
export const CrudTypes_Session = {
	dbKey: DBDef_Session.dbKey,
	dbItem: undefined as unknown as SessionCrudTypes['dbItem'],
	uiItem: undefined as unknown as SessionCrudTypes['uiItem'],
	validator: validator_Session,
	uniqueKeys: (DBDef_Session.uniqueKeys ?? ['_id']) as SessionCrudTypes['uniqueKeys'],
	editableType: undefined as unknown as SessionCrudTypes['editableType'],
} as SessionCrudTypes;
export const BaseDBDefBE_Session = {
	...DBDef_Session,
	uniqueKeys: DBDef_Session.uniqueKeys ?? ['_id'],
};
export const CrudApiDef_Session: CrudApiDef_Type<SessionCrudTypes> = CrudApiDef('user-account--sessions', 'v1') as CrudApiDef_Type<SessionCrudTypes>;

// --- LoginAttempt ---
export type Types_LoginAttempt = LoginAttemptCrudTypes;
const validator_LoginAttempt = {...DBDef_LoginAttempt.generatedPropsValidator, ...DBDef_LoginAttempt.modifiablePropsValidator};
export const CrudTypes_LoginAttempt = {
	dbKey: DBDef_LoginAttempt.dbKey,
	dbItem: undefined as unknown as LoginAttemptCrudTypes['dbItem'],
	uiItem: undefined as unknown as LoginAttemptCrudTypes['uiItem'],
	validator: validator_LoginAttempt,
	uniqueKeys: (DBDef_LoginAttempt.uniqueKeys ?? ['_id']) as LoginAttemptCrudTypes['uniqueKeys'],
	editableType: undefined as unknown as LoginAttemptCrudTypes['editableType'],
} as LoginAttemptCrudTypes;
export const BaseDBDefBE_LoginAttempt = {
	...DBDef_LoginAttempt,
	uniqueKeys: DBDef_LoginAttempt.uniqueKeys ?? ['_id'],
};
export const CrudApiDef_LoginAttempt: CrudApiDef_Type<LoginAttemptCrudTypes> = CrudApiDef('login-attempt', 'v1') as CrudApiDef_Type<LoginAttemptCrudTypes>;

// --- FailedLoginAttempt ---
export type Types_FailedLoginAttempt = FailedLoginAttemptCrudTypes;
const validator_FailedLoginAttempt = {...DBDef_FailedLoginAttempt.generatedPropsValidator, ...DBDef_FailedLoginAttempt.modifiablePropsValidator};
export const CrudTypes_FailedLoginAttempt = {
	dbKey: DBDef_FailedLoginAttempt.dbKey,
	dbItem: undefined as unknown as FailedLoginAttemptCrudTypes['dbItem'],
	uiItem: undefined as unknown as FailedLoginAttemptCrudTypes['uiItem'],
	validator: validator_FailedLoginAttempt,
	uniqueKeys: (DBDef_FailedLoginAttempt.uniqueKeys ?? ['_id']) as FailedLoginAttemptCrudTypes['uniqueKeys'],
	editableType: undefined as unknown as FailedLoginAttemptCrudTypes['editableType'],
} as FailedLoginAttemptCrudTypes;
export const BaseDBDefBE_FailedLoginAttempt = {
	...DBDef_FailedLoginAttempt,
	uniqueKeys: DBDef_FailedLoginAttempt.uniqueKeys ?? ['_id'],
};
export const CrudApiDef_FailedLoginAttempt: CrudApiDef_Type<FailedLoginAttemptCrudTypes> = CrudApiDef('failed-login-attempt', 'v1') as CrudApiDef_Type<FailedLoginAttemptCrudTypes>;
