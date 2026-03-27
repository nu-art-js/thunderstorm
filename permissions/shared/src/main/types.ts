import {TypedKeyValue} from '@nu-art/ts-common';

export type SessionData_Permissions_Value = {
	scopeEntries: string[]
	roles: { key: string, uiLabel: string }[]
};

export type SessionData_Permissions = TypedKeyValue<'permissions', SessionData_Permissions_Value>
export type SessionData_StrictMode = TypedKeyValue<'strictMode', { isStrictMode: boolean }>
