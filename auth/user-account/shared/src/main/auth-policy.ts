import {ApiDefResolver, HttpMethod, QueryApi} from '@nu-art/api-types';

export type AuthMethodStatus = {
	enabled: boolean;
	canRegister?: boolean;
};

export type Response_AuthPolicy = {
	canRegister: boolean;
	methods: { [methodKey: string]: AuthMethodStatus };
};

export type API_AuthPolicy = {
	getPolicy: QueryApi<Response_AuthPolicy>;
};

export const ApiDef_AuthPolicy: ApiDefResolver<API_AuthPolicy> = {
	getPolicy: {method: HttpMethod.GET, path: '/v1/auth/policy'},
};
