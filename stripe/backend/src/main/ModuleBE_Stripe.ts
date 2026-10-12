import {HttpCodes} from '@nu-art/api-types';
import {ModuleBE_SecretManager} from '@nu-art/google-services-backend';
import {appUrl, type StripeCheckoutRequest, type StripePortalRequest, type StripeRedirect} from '@nu-art/stripe-shared';
import {Dispatcher, ImplementationMissingException, LogLevel, Minute, Module} from '@nu-art/ts-common';
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
		});
		if (!session.url)
			throw HttpCodes._5XX.SERVICE_UNAVAILABLE('Stripe returned no checkout url', `session ${session.id}`);

		this.logInfo(`Checkout session ${session.id} created`);
		return {url: session.url};
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
