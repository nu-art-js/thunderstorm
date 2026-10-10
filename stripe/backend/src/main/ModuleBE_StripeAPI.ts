import {HttpCodes} from '@nu-art/api-types';
import {ApiHandler, MemKey_HttpRequest} from '@nu-art/http-server';
import {ApiDef_Stripe, type API_Stripe} from '@nu-art/stripe-shared';
import {Module} from '@nu-art/ts-common';
import {ModuleBE_Stripe} from './ModuleBE_Stripe.js';

/** The raw request body. Signature verification needs the exact bytes Stripe sent. */
export const rawRequestBody = (request: { rawBody?: unknown; body?: unknown }): Buffer | string | undefined => {
	if (Buffer.isBuffer(request.rawBody) || typeof request.rawBody === 'string')
		return request.rawBody;

	if (Buffer.isBuffer(request.body) || typeof request.body === 'string')
		return request.body;

	return undefined;
};

export class ModuleBE_StripeAPI_Class
	extends Module {

	@ApiHandler(ApiDef_Stripe.checkout)
	async checkout(body: API_Stripe['checkout']['Body']): Promise<API_Stripe['checkout']['Response']> {
		return ModuleBE_Stripe.createCheckoutSession(body);
	}

	@ApiHandler(ApiDef_Stripe.portal)
	async portal(body: API_Stripe['portal']['Body']): Promise<API_Stripe['portal']['Response']> {
		return ModuleBE_Stripe.createPortalSession(body);
	}

	@ApiHandler(ApiDef_Stripe.webhook)
	async webhook(_body: unknown): Promise<API_Stripe['webhook']['Response']> {
		const request = MemKey_HttpRequest.get();
		const raw = rawRequestBody(request as never);
		if (raw === undefined)
			throw HttpCodes._5XX.SERVICE_UNAVAILABLE('Raw body unavailable', 'The server parsed the webhook body; Stripe signatures need the raw bytes (req.rawBody)');

		const signature = request.headers['stripe-signature'];
		await ModuleBE_Stripe.handleWebhook(raw, Array.isArray(signature) ? signature[0] : signature);
		return {received: true};
	}
}

export const ModuleBE_StripeAPI = new ModuleBE_StripeAPI_Class();
