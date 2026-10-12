import {ApiCaller, HttpClient} from '@nu-art/http-client';
import {ApiDef_Stripe, type API_Stripe, type StripeCheckoutRequest} from '@nu-art/stripe-shared';
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
}

export const ModuleFE_Stripe = new ModuleFE_Stripe_Class();
