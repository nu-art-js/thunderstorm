/*
 * @nu-art/ga4-frontend - Consent-gated Google Analytics 4 for Thunderstorm frontends
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {ConsentCategoryKey, ConsentSource} from '@nu-art/consent-shared';

/** The browser side effects, injectable for tests. */
export type Ga4Environment = {
	/** The global object gtag lives on (`window`). */
	global: Record<string, unknown> & { dataLayer?: unknown[] };
	/** Injects `<script async src>` once. */
	loadScript: (src: string) => void;
	/** Removes first-party cookies whose names start with any prefix (GA: `_ga`). */
	deleteCookies: (prefixes: string[]) => void;
};

export type Ga4Options = {
	measurementId: string;
	consent: ConsentSource;
	/** Category that allows loading GA at all. Default 'analytics'. */
	analyticsCategory: ConsentCategoryKey;
	/** Category that allows ad signals (Consent Mode ad_*). Default 'marketing'. */
	marketingCategory: ConsentCategoryKey;
	/** Send the automatic page_view on config. Default true; SPAs usually set false and call pageView. */
	sendPageView: boolean;
	scriptUrl: string;
	env: Ga4Environment;
};

type Gtag = (...args: unknown[]) => void;

const Denied = 'denied';
const Granted = 'granted';

/**
 * Loads GA4 only after the analytics category is granted, keeps Google Consent Mode v2 in sync with
 * the consent choice, and on withdrawal disables collection and deletes the `_ga` cookies.
 * Events sent while not granted are dropped (never queued).
 */
export class Ga4Controller {

	private readonly options: Ga4Options;
	private readonly unsubscribe: (() => void)[] = [];
	private loaded = false;
	private enabled = false;

	constructor(options: Ga4Options) {
		this.options = options;
	}

	start(): void {
		const {consent, analyticsCategory, marketingCategory} = this.options;
		this.unsubscribe.push(consent.subscribe(analyticsCategory, granted => granted ? this.enable() : this.disable()));
		this.unsubscribe.push(consent.subscribe(marketingCategory, () => this.enabled && this.updateConsentMode()));
		if (consent.isGranted(analyticsCategory))
			this.enable();
	}

	stop(): void {
		this.unsubscribe.splice(0).forEach(unsubscribe => unsubscribe());
	}

	isEnabled(): boolean {
		return this.enabled;
	}

	/** Returns false when the event was dropped for lack of consent. */
	event(name: string, params?: Record<string, unknown>): boolean {
		if (!this.enabled)
			return false;

		this.gtag()('event', name, params ?? {});
		return true;
	}

	pageView(params?: { page_path?: string; page_title?: string; page_location?: string }): boolean {
		return this.event('page_view', params);
	}

	private enable(): void {
		if (this.enabled)
			return;

		this.enabled = true;
		this.options.env.global[this.disableFlag()] = false;
		if (this.loaded)
			return this.updateConsentMode();

		this.loaded = true;
		const gtag = this.gtag();
		gtag('consent', 'default', {analytics_storage: Denied, ad_storage: Denied, ad_user_data: Denied, ad_personalization: Denied});
		this.updateConsentMode();
		gtag('js', new Date());
		gtag('config', this.options.measurementId, {send_page_view: this.options.sendPageView});
		this.options.env.loadScript(`${this.options.scriptUrl}?id=${encodeURIComponent(this.options.measurementId)}`);
	}

	private disable(): void {
		if (!this.enabled)
			return;

		this.enabled = false;
		this.gtag()('consent', 'update', {analytics_storage: Denied, ad_storage: Denied, ad_user_data: Denied, ad_personalization: Denied});
		// Google's documented opt-out flag; the loaded script cannot be removed.
		this.options.env.global[this.disableFlag()] = true;
		this.options.env.deleteCookies(['_ga']);
	}

	private updateConsentMode(): void {
		const ads = this.options.consent.isGranted(this.options.marketingCategory) ? Granted : Denied;
		this.gtag()('consent', 'update', {analytics_storage: Granted, ad_storage: ads, ad_user_data: ads, ad_personalization: ads});
	}

	private disableFlag(): string {
		return `ga-disable-${this.options.measurementId}`;
	}

	private gtag(): Gtag {
		const global = this.options.env.global;
		const dataLayer = global.dataLayer ??= [];
		if (typeof global.gtag !== 'function')
			global.gtag = function gtag() {
				// gtag.js requires the `arguments` object itself, not an array.
				// eslint-disable-next-line prefer-rest-params
				dataLayer.push(arguments);
			};

		return global.gtag as Gtag;
	}
}
