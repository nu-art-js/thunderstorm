import {ApiCaller, HttpClient} from '@nu-art/http-client';
import {ApiDef_Stripe, ApiDef_StripeAdmin, type API_Stripe, type API_StripeAdmin, type StripeCheckoutRequest} from '@nu-art/stripe-shared';
import {Module} from '@nu-art/ts-common';

/** Sends the user to Stripe Checkout or the customer portal. The backend decides prices and customer. */
export class ModuleFE_Stripe_Class
	extends Module {

	async startCheckout(request: StripeCheckoutRequest): Promise<void> {
		this.redirect((await this.checkout(request)).url);
	}

	async openPortal(returnPath: string): Promise<void> {
		this.redirect((await this.portal({returnPath})).url);
	}

	protected redirect(url: string) {
		window.location.assign(url);
	}

	@ApiCaller(ApiDef_Stripe.checkout, {httpClient: () => HttpClient.default})
	protected async checkout(body: API_Stripe['checkout']['Body']): Promise<API_Stripe['checkout']['Response']> {
		void body;
		return undefined as unknown as API_Stripe['checkout']['Response'];
	}

	@ApiCaller(ApiDef_Stripe.portal, {httpClient: () => HttpClient.default})
	protected async portal(body: API_Stripe['portal']['Body']): Promise<API_Stripe['portal']['Response']> {
		void body;
		return undefined as unknown as API_Stripe['portal']['Response'];
	}

	@ApiCaller(ApiDef_StripeAdmin.updateCustomer, {httpClient: () => HttpClient.default})
	async updateCustomer(body: API_StripeAdmin['updateCustomer']['Body']): Promise<API_StripeAdmin['updateCustomer']['Response']> {
		void body;
		return undefined as unknown as API_StripeAdmin['updateCustomer']['Response'];
	}

	@ApiCaller(ApiDef_StripeAdmin.createCoupon, {httpClient: () => HttpClient.default})
	async createCoupon(body: API_StripeAdmin['createCoupon']['Body']): Promise<API_StripeAdmin['createCoupon']['Response']> {
		void body;
		return undefined as unknown as API_StripeAdmin['createCoupon']['Response'];
	}

	@ApiCaller(ApiDef_StripeAdmin.listCoupons, {httpClient: () => HttpClient.default})
	async listCoupons(body: API_StripeAdmin['listCoupons']['Body']): Promise<API_StripeAdmin['listCoupons']['Response']> {
		void body;
		return undefined as unknown as API_StripeAdmin['listCoupons']['Response'];
	}

	@ApiCaller(ApiDef_StripeAdmin.deleteCoupon, {httpClient: () => HttpClient.default})
	async deleteCoupon(params: API_StripeAdmin['deleteCoupon']['Params']): Promise<API_StripeAdmin['deleteCoupon']['Response']> {
		void params;
		return undefined as unknown as API_StripeAdmin['deleteCoupon']['Response'];
	}

	@ApiCaller(ApiDef_StripeAdmin.createPromotionCode, {httpClient: () => HttpClient.default})
	async createPromotionCode(body: API_StripeAdmin['createPromotionCode']['Body']): Promise<API_StripeAdmin['createPromotionCode']['Response']> {
		void body;
		return undefined as unknown as API_StripeAdmin['createPromotionCode']['Response'];
	}

	@ApiCaller(ApiDef_StripeAdmin.listPromotionCodes, {httpClient: () => HttpClient.default})
	async listPromotionCodes(params: API_StripeAdmin['listPromotionCodes']['Params']): Promise<API_StripeAdmin['listPromotionCodes']['Response']> {
		void params;
		return undefined as unknown as API_StripeAdmin['listPromotionCodes']['Response'];
	}

	@ApiCaller(ApiDef_StripeAdmin.updatePromotionCode, {httpClient: () => HttpClient.default})
	async updatePromotionCode(body: API_StripeAdmin['updatePromotionCode']['Body']): Promise<API_StripeAdmin['updatePromotionCode']['Response']> {
		void body;
		return undefined as unknown as API_StripeAdmin['updatePromotionCode']['Response'];
	}
}

export const ModuleFE_Stripe = new ModuleFE_Stripe_Class();
