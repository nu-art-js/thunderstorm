export type StripeCheckoutMode = 'subscription' | 'payment';

export type StripeCheckoutRequest = {
	/** Must be in the backend's allowedPriceIds. */
	priceId: string;
	quantity?: number;
	mode: StripeCheckoutMode;
	/** App-relative paths (`/billing/done`); joined to the backend's appBaseUrl, never absolute. */
	successPath: string;
	cancelPath: string;
};

export type StripePortalRequest = {
	/** App-relative path to return to from the portal. */
	returnPath: string;
};

export type StripeRedirect = { url: string };
