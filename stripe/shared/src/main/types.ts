export type StripeCheckoutMode = 'subscription' | 'payment';

export type StripePaymentMethodCollection = 'always' | 'if_required';

export type StripeCheckoutRequest = {
	/** Must be in the backend's allowedPriceIds. */
	priceId: string;
	quantity?: number;
	mode: StripeCheckoutMode;
	/** App-relative paths (`/billing/done`); joined to the backend's appBaseUrl, never absolute. */
	successPath: string;
	cancelPath: string;
	allowPromotionCodes?: boolean;
	paymentMethodCollection?: StripePaymentMethodCollection;
};

export type StripePortalRequest = {
	/** App-relative path to return to from the portal. */
	returnPath: string;
};

export type StripeRedirect = { url: string };

export type StripeInvoiceEmailPreference = {
	locales?: string[];
};

export type StripeCustomerUpdate = {
	customerId: string;
	email?: string;
	invoiceEmail?: StripeInvoiceEmailPreference;
};

export type StripeCustomer = {
	id: string;
	email: string | null;
	invoiceEmail: { locales: string[] };
};

export type StripeCouponDuration = 'forever' | 'once' | 'repeating';

export type StripeCouponCreate = {
	id?: string;
	name?: string;
	percentOff?: number;
	amountOff?: number;
	currency?: string;
	duration?: StripeCouponDuration;
	durationInMonths?: number;
	maxRedemptions?: number;
	redeemBy?: number;
};

export type StripeCoupon = {
	id: string;
	name: string | null;
	percentOff: number | null;
	amountOff: number | null;
	currency: string | null;
	duration: StripeCouponDuration;
	durationInMonths: number | null;
	valid: boolean;
};

export type StripeCouponId = { id: string };

export type StripeCouponDeleted = { id: string; deleted: true };

export type StripePromotionCodeCreate = {
	couponId: string;
	code?: string;
	active?: boolean;
	customerId?: string;
	expiresAt?: number;
	maxRedemptions?: number;
	firstTimeTransaction?: boolean;
};

export type StripePromotionCode = {
	id: string;
	code: string;
	active: boolean;
	couponId: string | null;
	expiresAt: number | null;
	maxRedemptions: number | null;
	timesRedeemed: number;
};

export type StripePromotionCodeList = {
	couponId?: string;
	code?: string;
	active?: boolean;
	customerId?: string;
	limit?: number;
};

export type StripePromotionCodePage = {
	codes: StripePromotionCode[];
	hasMore: boolean;
};

export type StripePromotionCodeUpdate = {
	id: string;
	active: boolean;
};
