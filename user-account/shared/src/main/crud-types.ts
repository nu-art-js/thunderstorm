/*
 * @nu-art/user-account-shared - CrudTypes and BaseDBDefBE for user-account (db-api migration)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {CrudApiDef_Type, DB_Object} from '@nu-art/db-api-shared';
import {CrudApiDef, CrudTypes} from '@nu-art/db-api-shared';
import type {DB_Account, UI_Account} from './_entity/account/types.js';
import {DBDef_Accounts} from './_entity/account/db-def.js';
import type {DB_Session, UI_Session} from './_entity/session/types.js';
import {DBDef_Session} from './_entity/session/db-def.js';
import type {DB_LoginAttempt, UI_LoginAttempt} from './_entity/login-attempts/types.js';
import {DBDef_LoginAttempt} from './_entity/login-attempts/db-def.js';
import type {DB_FailedLoginAttempt, UI_FailedLoginAttempt} from './_entity/failed-login-attempt/types.js';
import {DBDef_FailedLoginAttempt} from './_entity/failed-login-attempt/db-def.js';

// DB-api expects DB_Object with branded _id; user-account uses string _id. Cast for CrudTypes compatibility.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsDBObject<T> = T & DB_Object<any>;
// --- Account ---
const validator_Account = {...DBDef_Accounts.generatedPropsValidator, ...DBDef_Accounts.modifiablePropsValidator};
export type Types_Account = CrudTypes<
	'user-account--accounts',
	AsDBObject<DB_Account>,
	UI_Account,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- merged validators from DBDef don't match ValidatorTypeResolver<UIItem> exactly
	any,
	['_id', 'email']
>;
export const CrudTypes_Account = {
	dbKey: 'user-account--accounts',
	dbItem: undefined as unknown as AsDBObject<DB_Account>,
	uiItem: undefined as unknown as UI_Account,
	validator: validator_Account,
	uniqueKeys: ['_id', 'email'],
} as Types_Account;
export const BaseDBDefBE_Account = {
	...DBDef_Accounts,
	uniqueKeys: ['_id', 'email'] as const,
};
// Types_Account has custom uniqueKeys; cast for runtime. Declare as CrudApiDef_Type<any> so consumer builds don't fail constraint.
export const CrudApiDef_Account: CrudApiDef_Type<any> = CrudApiDef('user-account--accounts', 'v1') as unknown as CrudApiDef_Type<Types_Account>;

// --- Session ---
const validator_Session = {...DBDef_Session.generatedPropsValidator, ...DBDef_Session.modifiablePropsValidator};
export type Types_Session = CrudTypes<
	'user-account--sessions',
	AsDBObject<DB_Session>,
	UI_Session,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- merged validators from DBDef
	any,
	['_id', 'accountId', 'deviceId']
>;
export const CrudTypes_Session = {
	dbKey: 'user-account--sessions',
	dbItem: undefined as unknown as AsDBObject<DB_Session>,
	uiItem: undefined as unknown as UI_Session,
	validator: validator_Session,
	uniqueKeys: ['_id', 'accountId', 'deviceId'],
} as Types_Session;
export const BaseDBDefBE_Session = {
	...DBDef_Session,
	uniqueKeys: ['_id', 'accountId', 'deviceId'] as const,
};
// Types_Session has custom uniqueKeys; cast for runtime. Declare as CrudApiDef_Type<any> so consumer builds don't fail constraint.
export const CrudApiDef_Session: CrudApiDef_Type<any> = CrudApiDef('user-account--sessions', 'v1') as unknown as CrudApiDef_Type<Types_Session>;

// --- LoginAttempt ---
const validator_LoginAttempt = {...DBDef_LoginAttempt.generatedPropsValidator, ...DBDef_LoginAttempt.modifiablePropsValidator};
export type Types_LoginAttempt = CrudTypes<
	'login-attempt',
	AsDBObject<DB_LoginAttempt>,
	UI_LoginAttempt,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- merged validators from DBDef
	any,
	['_id']
>;
export const CrudTypes_LoginAttempt = {
	dbKey: 'login-attempt',
	dbItem: undefined as unknown as AsDBObject<DB_LoginAttempt>,
	uiItem: undefined as unknown as UI_LoginAttempt,
	validator: validator_LoginAttempt,
	uniqueKeys: ['_id'],
} as Types_LoginAttempt;
export const BaseDBDefBE_LoginAttempt = {
	...DBDef_LoginAttempt,
	uniqueKeys: ['_id'] as const,
};
export const CrudApiDef_LoginAttempt = CrudApiDef('login-attempt', 'v1') as unknown as CrudApiDef_Type<Types_LoginAttempt>;

// --- FailedLoginAttempt ---
const validator_FailedLoginAttempt = {...DBDef_FailedLoginAttempt.generatedPropsValidator, ...DBDef_FailedLoginAttempt.modifiablePropsValidator};
export type Types_FailedLoginAttempt = CrudTypes<
	'failed-login-attempt',
	AsDBObject<DB_FailedLoginAttempt>,
	UI_FailedLoginAttempt,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- merged validators from DBDef
	any,
	['_id']
>;
export const CrudTypes_FailedLoginAttempt = {
	dbKey: 'failed-login-attempt',
	dbItem: undefined as unknown as AsDBObject<DB_FailedLoginAttempt>,
	uiItem: undefined as unknown as UI_FailedLoginAttempt,
	validator: validator_FailedLoginAttempt,
	uniqueKeys: ['_id'],
} as Types_FailedLoginAttempt;
export const BaseDBDefBE_FailedLoginAttempt = {
	...DBDef_FailedLoginAttempt,
	uniqueKeys: ['_id'] as const,
};
export const CrudApiDef_FailedLoginAttempt = CrudApiDef('failed-login-attempt', 'v1') as unknown as CrudApiDef_Type<Types_FailedLoginAttempt>;
