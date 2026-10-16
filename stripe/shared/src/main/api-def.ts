import {type ApiDefResolver, type BodyApi, HttpMethod, type QueryApi, type ResponseError} from '@nu-art/api-types';
import type {
	StripeCheckoutRequest,
	StripeCoupon,
	StripeCouponCreate,
	StripeCouponDeleted,
	StripeCouponId,
	StripeCustomer,
	StripeCustomerUpdate,
	StripePortalRequest,
	StripePromotionCode,
	StripePromotionCodeCreate,
	StripePromotionCodeList,
	StripePromotionCodePage,
	StripePromotionCodeUpdate,
	StripeRedirect,
} from './types.js';

export type API_Stripe = {
	checkout: BodyApi<StripeRedirect, StripeCheckoutRequest>;
	portal: BodyApi<StripeRedirect, StripePortalRequest>;
	/** Called by Stripe only. Must be in the app's openApis (it is authenticated by its signature). */
	webhook: BodyApi<{ received: true }, unknown>;
};

export const ApiDef_Stripe: ApiDefResolver<API_Stripe> = {
	checkout: {method: HttpMethod.POST, path: '/v1/stripe/checkout'},
	portal: {method: HttpMethod.POST, path: '/v1/stripe/portal'},
	webhook: {method: HttpMethod.POST, path: '/v1/stripe/webhook'},
};

export type API_StripeAdmin = {
	updateCustomer: BodyApi<StripeCustomer, StripeCustomerUpdate>;
	createCoupon: BodyApi<StripeCoupon, StripeCouponCreate>;
	deleteCoupon: QueryApi<StripeCouponDeleted, StripeCouponId, ResponseError, HttpMethod.DELETE>;
	createPromotionCode: BodyApi<StripePromotionCode, StripePromotionCodeCreate>;
	listPromotionCodes: QueryApi<StripePromotionCodePage, StripePromotionCodeList>;
	updatePromotionCode: BodyApi<StripePromotionCode, StripePromotionCodeUpdate, ResponseError, HttpMethod.PATCH>;
};

export const ApiDef_StripeAdmin: ApiDefResolver<API_StripeAdmin> = {
	updateCustomer: {method: HttpMethod.POST, path: '/v1/stripe/admin/customer'},
	createCoupon: {method: HttpMethod.POST, path: '/v1/stripe/admin/coupon'},
	deleteCoupon: {method: HttpMethod.DELETE, path: '/v1/stripe/admin/coupon'},
	createPromotionCode: {method: HttpMethod.POST, path: '/v1/stripe/admin/promotion-code'},
	listPromotionCodes: {method: HttpMethod.GET, path: '/v1/stripe/admin/promotion-code'},
	updatePromotionCode: {method: HttpMethod.PATCH, path: '/v1/stripe/admin/promotion-code'},
};
