import {expect} from 'chai';
import Stripe from 'stripe';
import {claimStripeEvent, type StripeEventLedger} from '../main/event-ledger.js';
import {ModuleBE_Stripe_Class, type StripeClient} from '../main/ModuleBE_Stripe.js';
import {readRawBody} from '../main/ModuleBE_StripeAPI.js';
import {Readable} from 'stream';

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
	customerArgs: unknown[] = [];
	couponArgs: unknown[] = [];
	couponLists: unknown[] = [];
	couponDeletes: string[] = [];
	couponRetrieves: string[] = [];
	promotionCreates: unknown[] = [];
	promotionLists: unknown[] = [];
	promotionRetrieves: unknown[] = [];
	promotionUpdates: unknown[] = [];
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
		const coupon = {id: 'coupon_1', name: 'Ten', percent_off: 10, amount_off: null, currency: null, duration: 'once', duration_in_months: null, valid: true};
		const catalog = [
			{...coupon, id: 'c1', metadata: {app: 'booking'}, times_redeemed: 2, max_redemptions: 10, redeem_by: 1_700_000_000, applies_to: {products: ['prod_1']}},
			{...coupon, id: 'c2', metadata: {app: 'other'}},
			{...coupon, id: 'c3', metadata: {app: 'booking', campaign: 'spring'}},
			{...coupon, id: 'c4', metadata: {app: 'other'}},
			{...coupon, id: 'c5', metadata: {app: 'booking'}},
		];
		const promotion = (active: boolean, first = false) => ({
			id: 'promo_1', code: 'SAVE', active, promotion: {type: 'coupon', coupon: 'coupon_1'},
			expires_at: null, max_redemptions: null, times_redeemed: 0, restrictions: {first_time_transaction: first},
		});
		return {
			checkout: {sessions: {create: async (args: unknown) => (this.checkoutArgs.push(args), {id: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1'})}},
			billingPortal: {sessions: {create: async (args: unknown) => (this.portalArgs.push(args), {url: 'https://billing.stripe.com/p/1'})}},
			webhooks: realWebhooks,
			customers: {update: async (id: string, args: unknown) => (this.customerArgs.push({id, args}), {id, email: 'a@b.nl', preferred_locales: ['nl']})},
			coupons: {
				create: async (args: unknown) => (this.couponArgs.push(args), coupon),
				del: async (id: string) => (this.couponDeletes.push(id), {id, object: 'coupon', deleted: true}),
				retrieve: async (id: string) => (this.couponRetrieves.push(id), {...coupon, id, metadata: {app: 'booking'}}),
				list: async (args: { limit?: number; starting_after?: string; ending_before?: string }) => {
					this.couponLists.push(args);
					const start = args.starting_after ? catalog.findIndex(item => item.id === args.starting_after) + 1 : 0;
					const end = args.ending_before ? catalog.findIndex(item => item.id === args.ending_before) : catalog.length;
					const pageSize = args.limit === 100 ? 2 : args.limit ?? catalog.length;
					const data = catalog.slice(Math.max(start, 0), end < 0 ? catalog.length : end).slice(0, pageSize);
					const scanned = Math.max(start, 0) + data.length;
					return {data, has_more: scanned < (end < 0 ? catalog.length : end)};
				},
			},
			promotionCodes: {
				create: async (args: { active?: boolean; restrictions?: { first_time_transaction?: boolean } }) => (this.promotionCreates.push(args), promotion(args.active !== false, args.restrictions?.first_time_transaction === true)),
				list: async (args: unknown) => (this.promotionLists.push(args), {data: [{...promotion(true, true), promotion: {type: 'coupon', coupon: {id: 'coupon_1'}}}], has_more: false}),
				retrieve: async (id: string, args: unknown) => {
					this.promotionRetrieves.push({id, args});
					const referenced = id === 'promo_ref' ? 'coupon_1' : {id: 'coupon_1', metadata: {app: id === 'promo_other' ? 'other' : 'booking'}};
					return {...promotion(true), id, promotion: {type: 'coupon', coupon: referenced}};
				},
				update: async (id: string, args: { active?: boolean }) => (this.promotionUpdates.push({id, args}), promotion(args.active === true)),
			},
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
		expect(stripe.checkoutArgs[0]).to.not.have.property('allow_promotion_codes');
		expect(stripe.checkoutArgs[0]).to.not.have.property('payment_method_collection');
		expect(stripe.checkoutArgs[0]).to.not.have.property('automatic_tax');
		expect(stripe.checkoutArgs[0]).to.not.have.property('billing_address_collection');
		expect(stripe.checkoutArgs[0]).to.not.have.property('customer_update');
		expect(stripe.checkoutArgs[0]).to.not.have.property('tax_id_collection');
	});

	it('passes promotion codes and payment method collection through when set', async () => {
		const stripe = new TestStripe_Class();
		stripe.setCustomerResolver(async () => ({customerId: 'cus_1'}));
		await stripe.createCheckoutSession({
			priceId: 'price_basic', mode: 'subscription', successPath: '/ok', cancelPath: '/no',
			allowPromotionCodes: false, paymentMethodCollection: 'if_required',
		});
		expect(stripe.checkoutArgs[0]).to.deep.include({allow_promotion_codes: false, payment_method_collection: 'if_required', customer: 'cus_1'});
		expect(stripe.checkoutArgs[0]).to.not.have.property('customer_update');
	});

	it('enables automatic tax and saves the address only for an existing customer', async () => {
		const stripe = new TestStripe_Class();
		stripe.setCustomerResolver(async () => ({customerId: 'cus_1', email: 'a@b.nl'}));
		await stripe.createCheckoutSession({
			priceId: 'price_basic', mode: 'payment', successPath: '/ok', cancelPath: '/no', automaticTax: true,
		});
		expect(stripe.checkoutArgs[0]).to.deep.include({
			customer: 'cus_1',
			automatic_tax: {enabled: true},
			billing_address_collection: 'required',
			customer_update: {address: 'auto'},
		});
		expect(stripe.checkoutArgs[0]).to.not.have.property('customer_email');
		expect(stripe.checkoutArgs[0]).to.not.have.property('tax_id_collection');

		stripe.setCustomerResolver(async () => ({email: 'a@b.nl'}));
		await stripe.createCheckoutSession({
			priceId: 'price_basic', mode: 'payment', successPath: '/ok', cancelPath: '/no', automaticTax: true, taxIdCollection: false,
		});
		expect(stripe.checkoutArgs[1]).to.deep.include({
			customer_email: 'a@b.nl',
			automatic_tax: {enabled: true},
			billing_address_collection: 'required',
		});
		expect(stripe.checkoutArgs[1]).to.not.have.property('customer_update');
		expect(stripe.checkoutArgs[1]).to.not.have.property('tax_id_collection');
	});

	it('collects a tax id and saves the name only for an existing customer', async () => {
		const stripe = new TestStripe_Class();
		stripe.setCustomerResolver(async () => ({customerId: 'cus_1'}));
		await stripe.createCheckoutSession({
			priceId: 'price_basic', mode: 'subscription', successPath: '/ok', cancelPath: '/no',
			automaticTax: true, taxIdCollection: true,
		});
		expect(stripe.checkoutArgs[0]).to.deep.include({
			automatic_tax: {enabled: true},
			billing_address_collection: 'required',
			tax_id_collection: {enabled: true},
			customer_update: {address: 'auto', name: 'auto'},
			customer: 'cus_1',
		});

		stripe.setCustomerResolver(async () => ({email: 'a@b.nl'}));
		await stripe.createCheckoutSession({
			priceId: 'price_basic', mode: 'subscription', successPath: '/ok', cancelPath: '/no', taxIdCollection: true,
		});
		expect(stripe.checkoutArgs[1]).to.deep.include({
			customer_email: 'a@b.nl',
			tax_id_collection: {enabled: true},
		});
		expect(stripe.checkoutArgs[1]).to.not.have.property('automatic_tax');
		expect(stripe.checkoutArgs[1]).to.not.have.property('billing_address_collection');
		expect(stripe.checkoutArgs[1]).to.not.have.property('customer_update');
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

describe('ModuleBE_Stripe - customer, coupons, promotion codes', () => {
	it('updates email and invoice email locales', async () => {
		const stripe = new TestStripe_Class();
		const customer = await stripe.updateCustomer({customerId: 'cus_1', email: 'a@b.nl', invoiceEmail: {locales: ['nl', 'en']}});
		expect(customer).to.deep.equal({id: 'cus_1', email: 'a@b.nl', invoiceEmail: {locales: ['nl']}});
		expect(stripe.customerArgs[0]).to.deep.equal({id: 'cus_1', args: {email: 'a@b.nl', preferred_locales: ['nl', 'en']}});
		await stripe.updateCustomer({customerId: 'cus_1', invoiceEmail: {locales: []}});
		expect(stripe.customerArgs[1]).to.deep.equal({id: 'cus_1', args: {preferred_locales: []}});
	});

	it('refuses a customer update with nothing to change', async () => {
		const stripe = new TestStripe_Class();
		expect(await stripe.updateCustomer({customerId: 'cus_1'}).then(() => 'ok', () => 'refused')).to.equal('refused');
		expect(stripe.customerArgs).to.have.length(0);
	});

	it('creates a percent coupon and deletes it', async () => {
		const stripe = new TestStripe_Class();
		expect(await stripe.createCoupon({percentOff: 10, name: 'Ten'})).to.deep.equal({
			id: 'coupon_1', name: 'Ten', percentOff: 10, amountOff: null, currency: null, duration: 'once', durationInMonths: null, valid: true,
			timesRedeemed: 0, metadata: {}, maxRedemptions: null, redeemBy: null, appliesToProducts: [],
		});
		expect(stripe.couponArgs[0]).to.deep.equal({percent_off: 10, name: 'Ten', expand: ['applies_to']});
		await stripe.createCoupon({amountOff: 500, currency: 'eur', duration: 'repeating', durationInMonths: 3});
		expect(stripe.couponArgs[1]).to.deep.equal({amount_off: 500, currency: 'eur', duration: 'repeating', duration_in_months: 3, expand: ['applies_to']});
		expect(await stripe.deleteCoupon('coupon_1')).to.deep.equal({id: 'coupon_1', deleted: true});
		expect(stripe.couponDeletes).to.deep.equal(['coupon_1']);
	});

	it('creates a coupon with metadata and applicable products', async () => {
		const stripe = new TestStripe_Class();
		await stripe.createCoupon({percentOff: 15, metadata: {app: 'booking'}, appliesToProducts: ['prod_1', 'prod_2']});
		expect(stripe.couponArgs[0]).to.deep.equal({
			percent_off: 15, metadata: {app: 'booking'}, applies_to: {products: ['prod_1', 'prod_2']}, expand: ['applies_to'],
		});
	});

	it('lists coupons for an app with a forward cursor', async () => {
		const stripe = new TestStripe_Class();
		const first = await stripe.listCoupons({metadata: {app: 'booking'}, limit: 2});
		expect(first.coupons.map(coupon => coupon.id)).to.deep.equal(['c1', 'c3']);
		expect(first.hasMore).to.equal(true);
		expect(first.coupons[0]).to.deep.include({
			timesRedeemed: 2, metadata: {app: 'booking'}, maxRedemptions: 10, redeemBy: 1_700_000_000, appliesToProducts: ['prod_1'],
		});
		expect(stripe.couponLists[0]).to.deep.equal({limit: 100, expand: ['data.applies_to']});
		const second = await stripe.listCoupons({metadata: {app: 'booking', campaign: 'spring'}, startingAfter: 'c1', limit: 2});
		expect(second.coupons.map(coupon => coupon.id)).to.deep.equal(['c3']);
		expect(second.hasMore).to.equal(false);
		const page = await stripe.listCoupons({limit: 2, startingAfter: 'c1', endingBefore: 'c4'});
		expect(page.coupons.map(coupon => coupon.id)).to.deep.equal(['c2', 'c3']);
		expect(page.hasMore).to.equal(false);
		expect(stripe.couponLists.at(-1)).to.deep.equal({limit: 2, starting_after: 'c1', ending_before: 'c4', expand: ['data.applies_to']});
		expect(await stripe.listCoupons({metadata: {app: 'booking'}, endingBefore: 'c4'}).then(() => 'ok', () => 'refused')).to.equal('refused');
		expect(await stripe.listCoupons({metadata: {app: 'booking'}, limit: 0}).then(() => 'ok', () => 'refused')).to.equal('refused');
	});

	it('refuses a coupon that sets both discounts or a repeating duration without months', async () => {
		const stripe = new TestStripe_Class();
		const attempts = [
			{percentOff: 10, amountOff: 500, currency: 'eur'},
			{},
			{percentOff: 10, duration: 'repeating' as const},
			{amountOff: 500},
			{percentOff: 10, duration: 'once' as const, durationInMonths: 2},
		];
		for (const attempt of attempts)
			expect(await stripe.createCoupon(attempt).then(() => 'ok', () => 'refused'), JSON.stringify(attempt)).to.equal('refused');
		expect(stripe.couponArgs).to.have.length(0);
	});

	it('creates, lists and activates promotion codes through the coupon promotion', async () => {
		const stripe = new TestStripe_Class();
		const created = await stripe.createPromotionCode({couponId: 'coupon_1', code: 'SAVE', active: false, firstTimeTransaction: true});
		expect(created).to.deep.include({id: 'promo_1', code: 'SAVE', couponId: 'coupon_1', active: false, firstTimeTransaction: true});
		expect(stripe.promotionCreates[0]).to.deep.equal({
			promotion: {type: 'coupon', coupon: 'coupon_1'}, code: 'SAVE', active: false, restrictions: {first_time_transaction: true},
		});
		expect(stripe.promotionCreates[0]).to.not.have.property('coupon');
		const page = await stripe.listPromotionCodes({couponId: 'coupon_1', active: true, limit: 5, startingAfter: 'promo_0', endingBefore: 'promo_9'});
		expect(page.codes[0]).to.deep.include({couponId: 'coupon_1', firstTimeTransaction: true});
		expect(page.hasMore).to.equal(false);
		expect(stripe.promotionLists[0]).to.deep.equal({coupon: 'coupon_1', active: true, limit: 5, starting_after: 'promo_0', ending_before: 'promo_9'});
		expect((await stripe.updatePromotionCode({id: 'promo_1', active: false})).active).to.equal(false);
		expect(stripe.promotionUpdates[0]).to.deep.equal({id: 'promo_1', args: {active: false}});
		expect(stripe.promotionRetrieves).to.have.length(0);
	});

	it('refuses to deactivate a promotion code whose coupon belongs to another app', async () => {
		const stripe = new TestStripe_Class();
		expect((await stripe.updatePromotionCode({id: 'promo_1', active: false, couponMetadata: {app: 'booking'}})).active).to.equal(false);
		expect(stripe.promotionRetrieves[0]).to.deep.equal({id: 'promo_1', args: {expand: ['promotion.coupon']}});
		expect(await stripe.updatePromotionCode({id: 'promo_other', active: false, couponMetadata: {app: 'booking'}}).then(() => 'ok', () => 'refused')).to.equal('refused');
		expect(stripe.promotionUpdates.map(update => (update as { id: string }).id)).to.deep.equal(['promo_1']);
		await stripe.updatePromotionCode({id: 'promo_ref', active: false, couponMetadata: {app: 'booking'}});
		expect(stripe.couponRetrieves).to.deep.equal(['coupon_1']);
		expect(stripe.promotionUpdates).to.have.length(2);
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

describe('readRawBody', () => {
	const stream = (...chunks: string[]) => Object.assign(Readable.from(chunks.map(c => Buffer.from(c))), {} as { rawBody?: unknown });

	it('uses req.rawBody when Cloud Functions provided it', async () => {
		const req = Object.assign(Readable.from([]), {rawBody: Buffer.from('exact')});
		expect((await readRawBody(req, 100)).toString()).to.equal('exact');
	});

	it('reads the untouched stream byte-exact', async () => {
		expect((await readRawBody(stream('{ "a":', ' 1 }\n'), 100)).toString()).to.equal('{ "a": 1 }\n');
	});

	it('refuses a body over the cap', async () => {
		expect(await readRawBody(stream('x'.repeat(60), 'y'.repeat(60)), 100).then(() => 'ok', () => 'refused')).to.equal('refused');
	});
});
