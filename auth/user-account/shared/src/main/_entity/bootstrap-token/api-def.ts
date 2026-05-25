import {BodyApi, HttpMethod} from '@nu-art/api-types';

export type API_BootstrapToken = {
	create: BodyApi<{ token: string }, { label: string; metadata?: Record<string, string> }>;
	revoke: BodyApi<void, {}>;
};

export type ApiDefResolver_BootstrapToken = {
	[K in keyof API_BootstrapToken]: { method: typeof HttpMethod[keyof typeof HttpMethod]; path: string };
};

export const ApiDef_BootstrapToken: ApiDefResolver_BootstrapToken = {
	create: {method: HttpMethod.POST, path: '/v1/auth/bootstrap-token/create'},
	revoke: {method: HttpMethod.POST, path: '/v1/auth/bootstrap-token/revoke'},
};
