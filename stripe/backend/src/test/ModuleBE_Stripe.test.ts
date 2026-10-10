import {expect} from 'chai';
import Stripe from 'stripe';
import {claimStripeEvent, type StripeEventLedger} from '../main/event-ledger.js';
import {ModuleBE_Stripe_Class, type StripeClient} from '../main/ModuleBE_Stripe.js';
import {rawRequestBody} from '../main/ModuleBE_StripeAPI.js';

const WebhookSecret = 'whsec_test_secret';
const realWebhooks = new Stripe('sk_test_dummy').webhooks;

class MemoryLedger
	implements StripeEventLedger {
	records = new Map<string, 'processing' | 'done'>();

	async claim(id: string) {
		if (this.records.has(id))
			return false;
		this.records.set(id, 'processing');
		return true;
	}

	async complete(id: string) {
		this.records.set(id, 'done');
	}

	async release(id: string) {
		this.records.delete(id);
	}
}

class TestStripe_Class
	extends ModuleBE_Stripe_Class {
	secretsRead: string[] = [];
	checkoutArgs: unknown[] = [];
	portalArgs: unknown[] = [];
	handled: string[] = [];
	failNext = false;
	memoryLedger = new MemoryLedger();

	constructor() {
		super();
		this.ledger = this.memoryLedger;
		this.setDefaultConfig({
			secretKeySecretName: 'sk', webhookSecretName: 'wh', appBaseUrl: 'https://app.example.com',
			allowedPriceIds: ['price_basic'], eventClaimLeaseMs: 60_000,
		});
	}

	protected async loadSecret(name: string) {
		this.secretsRead.push(name);
		return name === 'wh' ? WebhookSecret : 'sk_test_key';
	}

	protected createClient(): StripeClient {
		return {
			checkout: {sessions: {create: async (args: unknown) => (this.checkoutArgs.push(args), {id: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1'})}},
			billingPortal: {sessions: {create: async (args: unknown) => (this.portalArgs.push(args), {url: 'https://billing.stripe.com/p/1'})}},
			webhooks: realWebhooks,
		} as unknown as StripeClient;
	}

	protected async dispatchEvent(event: Stripe.Event) {
		if (this.failNext) {
			this.failNext = false;
			throw new Error('hook failed');
		}
		this.handled.push(event.id);
	}
}

const signed = (event: object) => {
	const payload = JSON.stringify(event);
	return {payload, signature: realWebhooks.generateTestHeaderString({payload, secret: WebhookSecret})};
};

const event = (id: string, type = 'customer.subscription.updated') => ({id, object: 'event', type, data: {object: {id: 'sub_1', object: 'subscription'}}});

describe('ModuleBE_Stripe - checkout and portal', () => {
	it('reads the secret lazily, once', async () => {
		const stripe = new TestStripe_Class();
		stripe.setCustomerResolver(async () => ({email: 'a@b.nl', clientReferenceId: 'acc-1'}));
		expect(stripe.secretsRead).to.deep.equal([]);
		await stripe.createCheckoutSession({priceId: 'price_basic', mode: 'subscription', successPath: '/ok', cancelPath: '/no'});
		await stripe.createCheckoutSession({priceId: 'price_basic', mode: 'subscription', successPath: '/ok', cancelPath: '/no'});
		expect(stripe.secretsRead).to.deep.equal(['sk']);
	});

	it('creates a checkout session for an allowed price with app URLs and the customer', async () => {
		const stripe = new TestStripe_Class();
		stripe.setCustomerResolver(async () => ({email: 'a@b.nl', clientReferenceId: 'acc-1'}));
		const result = await stripe.createCheckoutSession({priceId: 'price_basic', mode: 'subscription', successPath: '/billing/ok', cancelPath: '/billing'});
		expect(result.url).to.equal('https://checkout.stripe.com/c/cs_1');
		expect(stripe.checkoutArgs[0]).to.deep.include({
			mode: 'subscription', success_url: 'https://app.example.com/billing/ok', cancel_url: 'https://app.example.com/billing',
			customer_email: 'a@b.nl', client_reference_id: 'acc-1',
		});
	});

	it('refuses unknown prices, bad quantities and off-origin paths', async () => {
		const stripe = new TestStripe_Class();
		stripe.setCustomerResolver(async () => ({}));
		const attempts = [
			{priceId: 'price_other', mode: 'payment', successPath: '/ok', cancelPath: '/no'},
			{priceId: 'price_basic', quantity: 0, mode: 'payment', successPath: '/ok', cancelPath: '/no'},
			{priceId: 'price_basic', mode: 'payment', successPath: 'https://evil.com', cancelPath: '/no'},
		] as const;
		for (const attempt of attempts)
			expect(await stripe.createCheckoutSession(attempt).then(() => 'ok', () => 'refused'), JSON.stringify(attempt)).to.equal('refused');
		expect(stripe.checkoutArgs).to.have.length(0);
	});

	it('portal needs a Stripe customer id', async () => {
		const stripe = new TestStripe_Class();
		stripe.setCustomerResolver(async () => ({email: 'a@b.nl'}));
		expect(await stripe.createPortalSession({returnPath: '/billing'}).then(() => 'ok', () => 'refused')).to.equal('refused');
		stripe.setCustomerResolver(async () => ({customerId: 'cus_1'}));
		expect((await stripe.createPortalSession({returnPath: '/billing'})).url).to.equal('https://billing.stripe.com/p/1');
		expect(stripe.portalArgs[0]).to.deep.equal({customer: 'cus_1', return_url: 'https://app.example.com/billing'});
	});

	it('without a customer resolver, checkout fails loudly', async () => {
		const stripe = new TestStripe_Class();
		expect(await stripe.createCheckoutSession({priceId: 'price_basic', mode: 'payment', successPath: '/a', cancelPath: '/b'}).then(() => 'ok', e => e.constructor.name)).to.equal('ImplementationMissingException');
	});
});

describe('ModuleBE_Stripe - webhook', () => {
	it('processes a correctly signed event', async () => {
		const stripe = new TestStripe_Class();
		const {payload, signature} = signed(event('evt_1'));
		expect(await stripe.handleWebhook(Buffer.from(payload), signature)).to.deep.equal({status: 'processed', eventId: 'evt_1', type: 'customer.subscription.updated'});
		expect(stripe.handled).to.deep.equal(['evt_1']);
		expect(stripe.memoryLedger.records.get('evt_1')).to.equal('done');
	});

	it('rejects a missing or wrong signature and a tampered body', async () => {
		const stripe = new TestStripe_Class();
		const {payload, signature} = signed(event('evt_2'));
		const forged = realWebhooks.generateTestHeaderString({payload, secret: 'whsec_other'});
		for (const [body, sig] of [[payload, undefined], [payload, forged], [payload.replace('sub_1', 'sub_X'), signature]] as const)
			expect(await stripe.handleWebhook(body, sig).then(() => 'ok', () => 'rejected')).to.equal('rejected');
		expect(stripe.handled).to.deep.equal([]);
	});

	it('handles a redelivered event once', async () => {
		const stripe = new TestStripe_Class();
		const {payload, signature} = signed(event('evt_3'));
		await stripe.handleWebhook(payload, signature);
		expect((await stripe.handleWebhook(payload, signature)).status).to.equal('duplicate');
		expect(stripe.handled).to.deep.equal(['evt_3']);
	});

	it('a failing hook releases the claim so the retry processes it', async () => {
		const stripe = new TestStripe_Class();
		stripe.failNext = true;
		const {payload, signature} = signed(event('evt_4'));
		expect(await stripe.handleWebhook(payload, signature).then(() => 'ok', () => 'failed')).to.equal('failed');
		expect(stripe.memoryLedger.records.has('evt_4')).to.equal(false);
		expect((await stripe.handleWebhook(payload, signature)).status).to.equal('processed');
	});
});

describe('claimStripeEvent', () => {
	it('claims new and expired claims; refuses done and live claims', () => {
		expect(claimStripeEvent(null, 1000, 100)).to.deep.equal({status: 'processing', at: 1000});
		expect(claimStripeEvent({status: 'done', at: 0}, 1000, 100)).to.equal(undefined);
		expect(claimStripeEvent({status: 'processing', at: 950}, 1000, 100)).to.equal(undefined);
		expect(claimStripeEvent({status: 'processing', at: 800}, 1000, 100)).to.deep.equal({status: 'processing', at: 1000});
	});
});

describe('rawRequestBody', () => {
	it('prefers rawBody, accepts an unparsed body, refuses a parsed one', () => {
		expect(rawRequestBody({rawBody: Buffer.from('x'), body: {a: 1}})?.toString()).to.equal('x');
		expect(rawRequestBody({body: '{"a":1}'})).to.equal('{"a":1}');
		expect(rawRequestBody({body: {a: 1}})).to.equal(undefined);
	});
});
