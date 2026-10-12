import {type ApiDefResolver, type BodyApi, HttpMethod} from '@nu-art/api-types';
import type {StripeCheckoutRequest, StripePortalRequest, StripeRedirect} from './types.js';

export type API_Stripe = {
	checkout: BodyApi<StripeRedirect, StripeCheckoutRequest>;
	portal: BodyApi<StripeRedirect, StripePortalRequest>;
	/** Called by Stripe only. Must be in the app's openApis (it is authenticated by its signature). */
	webhook: BodyApi<{ received: true }, unknown>;
};

export const ApiDef_Stripe: ApiDefResolver<API_Stripe> = {
	checkout: {method: HttpMethod.POST, path: '/v1/stripe/checkout'},
	portal: {method: HttpMethod.POST, path: '/v1/stripe/portal'},
	webhook: {method: HttpMethod.POST, path: '/v1/stripe/webhook'},
};
