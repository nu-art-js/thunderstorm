import {Dispatcher, UniqueId} from '@nu-art/ts-common';


export type ServiceAccountCredentials = {
	serviceAccount: {
		email: string
		accountId?: string
		token?: string
	}
}

export type DefaultDef_ServiceAccount = {
	moduleName: string
	email: string,
	description?: string,
	ttl?: number;
	groupIds?: UniqueId[]
}


export interface RequiresServiceAccount {
	__requiresServiceAccount(): DefaultDef_ServiceAccount | DefaultDef_ServiceAccount[];
}

export const dispatcher_collectServiceAccounts = new Dispatcher<RequiresServiceAccount, '__requiresServiceAccount'>('__requiresServiceAccount');
