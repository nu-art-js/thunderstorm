import {HttpCodes} from '@nu-art/api-types';
import {ModuleBE_SecretManager} from '@nu-art/google-services-backend';
import {
	appUrl,
	type StripeCheckoutRequest,
	type StripeCoupon,
	type StripeCouponCreate,
	type StripeCouponDeleted,
	type StripeCouponDuration,
	type StripeCouponList,
	type StripeCouponPage,
	type StripeMetadata,
	type StripeCustomer,
	type StripeCustomerUpdate,
	type StripePortalRequest,
	type StripePromotionCode,
	type StripePromotionCodeCreate,
	type StripePromotionCodeList,
	type StripePromotionCodePage,
	type StripePromotionCodeUpdate,
	type StripeRedirect,
} from '@nu-art/stripe-shared';
import {BadImplementationException, Dispatcher, ImplementationMissingException, LogLevel, Minute, Module} from '@nu-art/ts-common';
import Stripe from 'stripe';
import {RtdbStripeEventLedger, type StripeEventLedger} from './event-ledger.js';

type Config = {
	/** Secret Manager secret holding the Stripe secret key, stored raw. */
	secretKeySecretName: string;
	/** Secret Manager secret holding the webhook signing secret (`whsec_...`), stored raw. */
	webhookSecretName: string;
	/** Origin that success, cancel and return paths are joined to. */
	appBaseUrl: string;
	/** Prices a client may check out. Anything else is refused. */
	allowedPriceIds: string[];
	/** A claimed but unfinished event can be re-claimed after this long. */
	eventClaimLeaseMs: number;
};

/** Who is paying: resolved by the app from its own session. */
export type StripeCustomerContext = {
	/** Existing Stripe customer, if the app stores one. Required for the portal. */
	customerId?: string;
	email?: string;
	/** Usually the app account id; comes back on checkout.session.completed. */
	clientReferenceId?: string;
};

export type StripeCustomerResolver = () => Promise<StripeCustomerContext>;

export interface OnStripeEvent {
	/** Every verified event, once. Throwing makes the delivery fail, so Stripe retries it. */
	__onStripeEvent(event: Stripe.Event): Promise<void>;
}

export interface OnStripeCheckoutCompleted {
	__onStripeCheckoutCompleted(session: Stripe.Checkout.Session, event: Stripe.Event): Promise<void>;
}

export interface OnStripeSubscriptionChanged {
	/** customer.subscription.created / updated / deleted: the subscription as Stripe now has it. */
	__onStripeSubscriptionChanged(subscription: Stripe.Subscription, event: Stripe.Event): Promise<void>;
}

export const dispatch_onStripeEvent = new Dispatcher<OnStripeEvent, '__onStripeEvent'>('__onStripeEvent');
export const dispatch_onStripeCheckoutCompleted = new Dispatcher<OnStripeCheckoutCompleted, '__onStripeCheckoutCompleted'>('__onStripeCheckoutCompleted');
export const dispatch_onStripeSubscriptionChanged = new Dispatcher<OnStripeSubscriptionChanged, '__onStripeSubscriptionChanged'>('__onStripeSubscriptionChanged');

const SubscriptionEvents = ['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'];

export type StripeClient = Pick<Stripe, 'checkout' | 'billingPortal' | 'webhooks'>;

type StripeBillingClient = StripeClient & Pick<Stripe, 'customers' | 'coupons' | 'promotionCodes'>;

export type StripeWebhookResult = { status: 'processed' | 'duplicate'; eventId: string; type: string };

export class ModuleBE_Stripe_Class
	extends Module<Config> {

	private client?: Promise<StripeClient>;
	private webhookSecret?: Promise<string>;
	private customerResolver?: StripeCustomerResolver;
	protected ledger: StripeEventLedger = new RtdbStripeEventLedger(this, () => this.config.eventClaimLeaseMs);

	constructor() {
		super();
		this.setDefaultConfig({
			secretKeySecretName: 'stripe-secret-key',
			webhookSecretName: 'stripe-webhook-secret',
			appBaseUrl: '',
			allowedPriceIds: [],
			eventClaimLeaseMs: 5 * Minute,
		});
		// Payloads carry customer data: no debug dumps.
		this.setMinLevel(LogLevel.Info);
	}

	/** The app maps its session to a Stripe customer. Throw (e.g. 401) when there is no paying user. */
	setCustomerResolver(resolver: StripeCustomerResolver) {
		this.customerResolver = resolver;
	}

	async createCheckoutSession(request: StripeCheckoutRequest): Promise<StripeRedirect> {
		if (!this.config.allowedPriceIds.includes(request.priceId))
			throw HttpCodes._4XX.BAD_REQUEST('Unknown price', `Price '${request.priceId}' is not in allowedPriceIds`);

		const quantity = request.quantity ?? 1;
		if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100)
			throw HttpCodes._4XX.BAD_REQUEST('Invalid quantity', `quantity ${quantity}`);

		const customer = await this.resolveCustomer();
		const session = await (await this.getClient()).checkout.sessions.create({
			mode: request.mode,
			line_items: [{price: request.priceId, quantity}],
			success_url: this.appUrl(request.successPath),
			cancel_url: this.appUrl(request.cancelPath),
			...(customer.customerId ? {customer: customer.customerId} : customer.email ? {customer_email: customer.email} : {}),
			...(customer.clientReferenceId ? {client_reference_id: customer.clientReferenceId} : {}),
			...(request.allowPromotionCodes !== undefined ? {allow_promotion_codes: request.allowPromotionCodes} : {}),
			...(request.paymentMethodCollection ? {payment_method_collection: request.paymentMethodCollection} : {}),
			...this.taxParams(request, customer.customerId),
		});
		if (!session.url)
			throw HttpCodes._5XX.SERVICE_UNAVAILABLE('Stripe returned no checkout url', `session ${session.id}`);

		this.logInfo(`Checkout session ${session.id} created`);
		return {url: session.url};
	}

	private taxParams(request: StripeCheckoutRequest, customerId?: string): Stripe.Checkout.SessionCreateParams {
		const params: Stripe.Checkout.SessionCreateParams = {};
		if (request.automaticTax) {
			params.automatic_tax = {enabled: true};
			params.billing_address_collection = 'required';
		}

		if (request.taxIdCollection)
			params.tax_id_collection = {enabled: true};

		if (!customerId)
			return params;

		const customerUpdate: Stripe.Checkout.SessionCreateParams.CustomerUpdate = {};
		if (request.automaticTax)
			customerUpdate.address = 'auto';

		if (request.taxIdCollection)
			customerUpdate.name = 'auto';

		if (customerUpdate.address || customerUpdate.name)
			params.customer_update = customerUpdate;

		return params;
	}

	async createPortalSession(request: StripePortalRequest): Promise<StripeRedirect> {
		const customer = await this.resolveCustomer();
		if (!customer.customerId)
			throw HttpCodes._4XX.NOT_FOUND('No billing account', 'The customer resolver returned no Stripe customer id');

		const session = await (await this.getClient()).billingPortal.sessions.create({
			customer: customer.customerId,
			return_url: this.appUrl(request.returnPath),
		});
		return {url: session.url};
	}

	async updateCustomer(request: StripeCustomerUpdate): Promise<StripeCustomer> {
		if (!request.customerId)
			throw HttpCodes._4XX.BAD_REQUEST('Missing customer', 'customerId');

		const locales = request.invoiceEmail?.locales;
		if (request.email === undefined && locales === undefined)
			throw HttpCodes._4XX.BAD_REQUEST('Empty customer update', 'email or invoiceEmail.locales');

		const customer = await (await this.billingClient()).customers.update(request.customerId, {
			...(request.email !== undefined ? {email: request.email} : {}),
			...(locales !== undefined ? {preferred_locales: [...locales]} : {}),
		});
		this.logInfo(`customer=${customer.id} action=update`);
		return this.customer(customer);
	}

	async createCoupon(request: StripeCouponCreate): Promise<StripeCoupon> {
		const coupon = await (await this.billingClient()).coupons.create(this.couponParams(request));
		this.logInfo(`coupon=${coupon.id} action=create`);
		return this.coupon(coupon);
	}

	async listCoupons(request: StripeCouponList = {}): Promise<StripeCouponPage> {
		const metadata = request.metadata;
		if (!metadata || Object.keys(metadata).length === 0) {
			const page = await (await this.billingClient()).coupons.list(this.couponListParams(request));
			return {coupons: page.data.map(coupon => this.coupon(coupon)), hasMore: page.has_more};
		}

		if (request.endingBefore)
			throw HttpCodes._4XX.BAD_REQUEST('Invalid coupon page', 'metadata filter uses startingAfter');

		const limit = this.couponPageLimit(request.limit);
		const coupons: StripeCoupon[] = [];
		let startingAfter = request.startingAfter;
		for (;;) {
			const page = await (await this.billingClient()).coupons.list({
				limit: 100,
				...(startingAfter ? {starting_after: startingAfter} : {}),
				expand: ['data.applies_to'],
			});
			if (page.data.length === 0)
				break;

			for (const coupon of page.data) {
				if (!this.metadataMatches(coupon.metadata, metadata))
					continue;

				if (coupons.length === limit)
					return {coupons, hasMore: true};

				coupons.push(this.coupon(coupon));
			}

			const last = page.data[page.data.length - 1].id;
			if (!page.has_more || last === startingAfter)
				break;

			startingAfter = last;
		}

		return {coupons, hasMore: false};
	}

	async deleteCoupon(id: string): Promise<StripeCouponDeleted> {
		if (!id)
			throw HttpCodes._4XX.BAD_REQUEST('Missing coupon', 'id');

		const deleted = await (await this.billingClient()).coupons.del(id);
		this.logInfo(`coupon=${deleted.id} action=delete`);
		return {id: deleted.id, deleted: true};
	}

	async createPromotionCode(request: StripePromotionCodeCreate): Promise<StripePromotionCode> {
		if (!request.couponId)
			throw HttpCodes._4XX.BAD_REQUEST('Missing coupon', 'couponId');

		const created = await (await this.billingClient()).promotionCodes.create({
			promotion: {type: 'coupon', coupon: request.couponId},
			...(request.code !== undefined ? {code: request.code} : {}),
			...(request.active !== undefined ? {active: request.active} : {}),
			...(request.customerId ? {customer: request.customerId} : {}),
			...(request.expiresAt !== undefined ? {expires_at: request.expiresAt} : {}),
			...(request.maxRedemptions !== undefined ? {max_redemptions: request.maxRedemptions} : {}),
			...(request.firstTimeTransaction !== undefined ? {restrictions: {first_time_transaction: request.firstTimeTransaction}} : {}),
		});
		this.logInfo(`promotion_code=${created.id} action=create`);
		return this.promotionCode(created);
	}

	async listPromotionCodes(request: StripePromotionCodeList = {}): Promise<StripePromotionCodePage> {
		const page = await (await this.billingClient()).promotionCodes.list({
			...(request.couponId ? {coupon: request.couponId} : {}),
			...(request.code ? {code: request.code} : {}),
			...(request.active !== undefined ? {active: request.active} : {}),
			...(request.customerId ? {customer: request.customerId} : {}),
			...(request.limit !== undefined ? {limit: request.limit} : {}),
			...(request.startingAfter ? {starting_after: request.startingAfter} : {}),
			...(request.endingBefore ? {ending_before: request.endingBefore} : {}),
		});
		return {codes: page.data.map(code => this.promotionCode(code)), hasMore: page.has_more};
	}

	async updatePromotionCode(request: StripePromotionCodeUpdate): Promise<StripePromotionCode> {
		if (!request.id)
			throw HttpCodes._4XX.BAD_REQUEST('Missing promotion code', 'id');

		if (request.couponMetadata !== undefined)
			await this.assertCouponMetadata(request.id, request.couponMetadata);

		const updated = await (await this.billingClient()).promotionCodes.update(request.id, {active: request.active});
		this.logInfo(`promotion_code=${updated.id} active=${updated.active}`);
		return this.promotionCode(updated);
	}

	/**
	 * Verifies the signature against the raw body, then processes each event id once: claim, dispatch
	 * hooks, mark done. A failing hook releases the claim and rethrows, so Stripe's retry reprocesses it.
	 */
	async handleWebhook(rawBody: Buffer | string, signature: string | undefined): Promise<StripeWebhookResult> {
		if (!signature)
			throw HttpCodes._4XX.BAD_REQUEST('Missing signature', 'No stripe-signature header');

		let event: Stripe.Event;
		try {
			event = (await this.getClient()).webhooks.constructEvent(rawBody, signature, await this.getWebhookSecret());
		} catch (e) {
			this.logWarning(`Rejected webhook: ${(e as Error).message}`);
			throw HttpCodes._4XX.BAD_REQUEST('Invalid signature', (e as Error).message);
		}

		if (!await this.ledger.claim(event.id)) {
			this.logInfo(`Skipping already handled event ${event.id} (${event.type})`);
			return {status: 'duplicate', eventId: event.id, type: event.type};
		}

		try {
			await this.dispatchEvent(event);
		} catch (e) {
			await this.ledger.release(event.id);
			this.logError(`Handling event ${event.id} (${event.type}) failed`, e as Error);
			throw e;
		}

		await this.ledger.complete(event.id);
		this.logInfo(`Processed event ${event.id} (${event.type})`);
		return {status: 'processed', eventId: event.id, type: event.type};
	}

	protected async dispatchEvent(event: Stripe.Event) {
		await dispatch_onStripeEvent.dispatchModuleAsync(event);
		if (event.type === 'checkout.session.completed')
			await dispatch_onStripeCheckoutCompleted.dispatchModuleAsync(event.data.object as Stripe.Checkout.Session, event);

		if (SubscriptionEvents.includes(event.type))
			await dispatch_onStripeSubscriptionChanged.dispatchModuleAsync(event.data.object as Stripe.Subscription, event);
	}

	private couponParams(request: StripeCouponCreate): Stripe.CouponCreateParams {
		if (request.duration === 'repeating' && !(request.durationInMonths !== undefined && request.durationInMonths > 0))
			throw HttpCodes._4XX.BAD_REQUEST('Invalid coupon', 'repeating duration requires durationInMonths');

		if (request.duration !== 'repeating' && request.durationInMonths !== undefined)
			throw HttpCodes._4XX.BAD_REQUEST('Invalid coupon', 'durationInMonths requires duration repeating');

		const common: Stripe.CouponCreateParams = {
			...(request.duration ? {duration: request.duration} : {}),
			...(request.durationInMonths !== undefined ? {duration_in_months: request.durationInMonths} : {}),
			...(request.id ? {id: request.id} : {}),
			...(request.name ? {name: request.name} : {}),
			...(request.maxRedemptions !== undefined ? {max_redemptions: request.maxRedemptions} : {}),
			...(request.redeemBy !== undefined ? {redeem_by: request.redeemBy} : {}),
			...(request.metadata ? {metadata: {...request.metadata}} : {}),
			...(request.appliesToProducts?.length ? {applies_to: {products: [...request.appliesToProducts]}} : {}),
			expand: ['applies_to'],
		};
		const percentOff = request.percentOff;
		const amountOff = request.amountOff;
		if (percentOff !== undefined && amountOff === undefined)
			return {...common, percent_off: percentOff};

		if (amountOff !== undefined && percentOff === undefined) {
			if (!request.currency)
				throw HttpCodes._4XX.BAD_REQUEST('Invalid coupon', 'amountOff requires currency');

			return {...common, amount_off: amountOff, currency: request.currency};
		}

		throw HttpCodes._4XX.BAD_REQUEST('Invalid coupon', 'Set percentOff or amountOff');
	}

	private customer(customer: Stripe.Customer): StripeCustomer {
		return {
			id: customer.id,
			email: customer.email,
			invoiceEmail: {locales: customer.preferred_locales ? [...customer.preferred_locales] : []},
		};
	}

	private couponListParams(request: StripeCouponList): Stripe.CouponListParams {
		return {
			...(request.limit !== undefined ? {limit: request.limit} : {}),
			...(request.startingAfter ? {starting_after: request.startingAfter} : {}),
			...(request.endingBefore ? {ending_before: request.endingBefore} : {}),
			expand: ['data.applies_to'],
		};
	}

	private couponPageLimit(limit: number | undefined) {
		if (limit === undefined)
			return 10;

		if (!Number.isInteger(limit) || limit < 1 || limit > 100)
			throw HttpCodes._4XX.BAD_REQUEST('Invalid limit', 'limit');

		return limit;
	}

	private metadataMatches(metadata: Stripe.Metadata | null | undefined, expected: StripeMetadata) {
		const data = metadata ?? {};
		return Object.entries(expected).every(([key, value]) => data[key] === value);
	}

	private async assertCouponMetadata(id: string, expected: StripeMetadata) {
		const client = await this.billingClient();
		const code = await client.promotionCodes.retrieve(id, {expand: ['promotion.coupon']});
		const referenced = code.promotion.coupon;
		const coupon = typeof referenced === 'string' ? await client.coupons.retrieve(referenced) : referenced;
		if (!coupon || !this.metadataMatches(coupon.metadata, expected))
			throw HttpCodes._4XX.FORBIDDEN('Coupon metadata mismatch', id);
	}

	private coupon(coupon: Stripe.Coupon): StripeCoupon {
		return {
			id: coupon.id,
			name: coupon.name,
			percentOff: coupon.percent_off,
			amountOff: coupon.amount_off,
			currency: coupon.currency,
			duration: this.couponDuration(coupon.duration),
			durationInMonths: coupon.duration_in_months,
			valid: coupon.valid,
			timesRedeemed: coupon.times_redeemed ?? 0,
			metadata: {...(coupon.metadata ?? {})},
			maxRedemptions: coupon.max_redemptions ?? null,
			redeemBy: coupon.redeem_by ?? null,
			appliesToProducts: [...(coupon.applies_to?.products ?? [])],
		};
	}

	private couponDuration(duration: Stripe.Coupon.Duration): StripeCouponDuration {
		if (duration === 'forever')
			return 'forever';

		if (duration === 'once')
			return 'once';

		if (duration === 'repeating')
			return 'repeating';

		throw new BadImplementationException(`coupon duration=${duration}`);
	}

	private promotionCode(code: Stripe.PromotionCode): StripePromotionCode {
		const coupon = code.promotion.coupon;
		return {
			id: code.id,
			code: code.code,
			active: code.active,
			couponId: typeof coupon === 'string' ? coupon : coupon?.id ?? null,
			expiresAt: code.expires_at,
			maxRedemptions: code.max_redemptions,
			timesRedeemed: code.times_redeemed,
			firstTimeTransaction: code.restrictions?.first_time_transaction ?? false,
		};
	}

	private async resolveCustomer(): Promise<StripeCustomerContext> {
		if (!this.customerResolver)
			throw new ImplementationMissingException('ModuleBE_Stripe needs setCustomerResolver() before checkout or portal');

		return this.customerResolver();
	}

	private appUrl(path: string) {
		if (!this.config.appBaseUrl)
			throw new ImplementationMissingException('ModuleBE_Stripe config is missing appBaseUrl');

		try {
			return appUrl(this.config.appBaseUrl, path);
		} catch (e) {
			throw HttpCodes._4XX.BAD_REQUEST('Invalid path', (e as Error).message);
		}
	}

	/** Reads a raw secret from Secret Manager. Fails loudly when it is missing. */
	protected async loadSecret(name: string): Promise<string> {
		const projectId = process.env.GCP_PROJECT_ID ?? process.env.GCLOUD_PROJECT;
		if (!projectId)
			throw new ImplementationMissingException(`Missing GCP_PROJECT_ID / GCLOUD_PROJECT to read '${name}'`);

		const value = (await ModuleBE_SecretManager.tryGetSecretValue({key: name, projectId, version: 'latest'}))?.trim();
		if (!value)
			throw new ImplementationMissingException(`Missing secret '${name}'`);

		return value;
	}

	protected createClient(secretKey: string): StripeClient {
		return new Stripe(secretKey);
	}

	private async billingClient(): Promise<StripeBillingClient> {
		return await this.getClient() as StripeBillingClient;
	}

	private getClient(): Promise<StripeClient> {
		if (!this.client)
			this.client = this.loadSecret(this.config.secretKeySecretName)
				.then(key => this.createClient(key))
				.catch((e: Error) => {
					this.client = undefined;
					throw e;
				});

		return this.client;
	}

	private getWebhookSecret(): Promise<string> {
		if (!this.webhookSecret)
			this.webhookSecret = this.loadSecret(this.config.webhookSecretName)
				.catch((e: Error) => {
					this.webhookSecret = undefined;
					throw e;
				});

		return this.webhookSecret;
	}
}

export const ModuleBE_Stripe = new ModuleBE_Stripe_Class();
