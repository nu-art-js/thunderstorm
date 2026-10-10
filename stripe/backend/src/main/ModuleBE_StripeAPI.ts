import {HttpCodes} from '@nu-art/api-types';
import {ApiHandler, MemKey_HttpRequest} from '@nu-art/http-server';
import {ApiDef_Stripe, type API_Stripe} from '@nu-art/stripe-shared';
import {Module} from '@nu-art/ts-common';
import {ModuleBE_Stripe} from './ModuleBE_Stripe.js';

/** Stripe events are small; anything larger is refused before it is buffered. */
export const StripeWebhookMaxBytes = 1024 * 1024;

type RawRequest = AsyncIterable<Buffer | string> & { rawBody?: unknown };

/**
 * The exact bytes Stripe sent. Cloud Functions already read the stream and keep the bytes on
 * req.rawBody; elsewhere the route is registered with rawBody, so the stream is untouched and read here.
 */
export const readRawBody = async (request: RawRequest, maxBytes: number): Promise<Buffer> => {
	if (Buffer.isBuffer(request.rawBody))
		return request.rawBody;

	const chunks: Buffer[] = [];
	let size = 0;
	for await (const chunk of request) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		size += buffer.length;
		if (size > maxBytes)
			throw HttpCodes._4XX.PAYLOAD_TOO_LARGE('Webhook body too large', `More than ${maxBytes} bytes`);

		chunks.push(buffer);
	}

	return Buffer.concat(chunks);
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

	/** rawBody: the global body parsers skip this route, so the signature is checked against the exact bytes. */
	@ApiHandler(ApiDef_Stripe.webhook, {rawBody: true})
	async webhook(_body: API_Stripe['webhook']['Body']): Promise<API_Stripe['webhook']['Response']> {
		const request = MemKey_HttpRequest.get();
		const raw = await readRawBody(request as unknown as RawRequest, StripeWebhookMaxBytes);
		const signature = request.headers['stripe-signature'];
		await ModuleBE_Stripe.handleWebhook(raw, Array.isArray(signature) ? signature[0] : signature);
		return {received: true};
	}
}

export const ModuleBE_StripeAPI = new ModuleBE_StripeAPI_Class();
