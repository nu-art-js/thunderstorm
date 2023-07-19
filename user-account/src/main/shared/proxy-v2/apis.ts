import {UniqueId} from '@nu-art/ts-common';
import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/thunderstorm';

export type RequestBody_CreateAccountToken = { serviceAccountId: UniqueId, ttl: number };
export type ResponseBody_CreateAccountToken = { token: string };

export type ApiStruct_ProxyServiceAccount = {
	vv1: {
		createAccountToken: BodyApi<ResponseBody_CreateAccountToken, RequestBody_CreateAccountToken>,
	},
}

export const ApiDef_ProxyServiceAccount: ApiDefResolver<ApiStruct_ProxyServiceAccount> = {
	vv1: {
		createAccountToken: {method: HttpMethod.POST, path: '/v1/service-account/create-token'},
	}
};
