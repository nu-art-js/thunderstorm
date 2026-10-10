/*
 * @nu-art/ga4-frontend - Consent-gated Google Analytics 4 for Thunderstorm frontends
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ImplementationMissingException, Module} from '@nu-art/ts-common';
import type {ConsentCategoryKey, ConsentSource} from '@nu-art/consent-shared';
import {Ga4Controller, type Ga4Environment} from './Ga4Controller.js';

type Config = {
	/** GA4 measurement id (G-XXXXXXX). Empty disables the module. */
	measurementId: string;
	analyticsCategory: ConsentCategoryKey;
	marketingCategory: ConsentCategoryKey;
	sendPageView: boolean;
	scriptUrl: string;
};

const browserEnvironment = (): Ga4Environment => ({
	global: window as unknown as Ga4Environment['global'],
	loadScript: (src: string) => {
		if (document.querySelector(`script[src="${src}"]`))
			return;

		const script = document.createElement('script');
		script.async = true;
		script.src = src;
		document.head.appendChild(script);
	},
	deleteCookies: (prefixes: string[]) => {
		const names = document.cookie.split(';').map(c => c.split('=')[0]?.trim() ?? '').filter(name => prefixes.some(prefix => name.startsWith(prefix)));
		const host = location.hostname.split('.');
		// GA sets cookies on the widest domain it can; expire every candidate.
		const domains = [undefined, ...host.map((_, i) => '.' + host.slice(i).join('.'))];
		for (const name of names)
			for (const domain of domains)
				document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
	},
});

/**
 * GA4 gated by consent. The app passes any ConsentSource (normally ModuleFE_Consent):
 *
 *   ModuleFE_GA4.setConsentSource(ModuleFE_Consent);
 *
 * Nothing (no script, no cookie, no dataLayer call) happens until the analytics category is granted.
 */
export class ModuleFE_GA4_Class
	extends Module<Config> {

	private consent?: ConsentSource;
	private controller?: Ga4Controller;
	private initDone = false;

	constructor() {
		super();
		this.setDefaultConfig({
			measurementId: '',
			analyticsCategory: 'analytics',
			marketingCategory: 'marketing',
			sendPageView: true,
			scriptUrl: 'https://www.googletagmanager.com/gtag/js',
		});
	}

	/** Call before init (or any time after); GA starts as soon as both config and consent source exist. */
	setConsentSource(consent: ConsentSource): void {
		this.consent = consent;
		if (this.initDone)
			this.startController();
	}

	protected init() {
		this.initDone = true;
		this.startController();
	}

	event = (name: string, params?: Record<string, unknown>): boolean => this.controller?.event(name, params) ?? false;
	pageView = (params?: { page_path?: string; page_title?: string; page_location?: string }): boolean => this.controller?.pageView(params) ?? false;
	isEnabled = (): boolean => this.controller?.isEnabled() ?? false;

	private startController(): void {
		if (!this.config.measurementId) {
			this.logWarning('ModuleFE_GA4 has no measurementId; analytics stays off');
			return;
		}

		if (!this.consent)
			throw new ImplementationMissingException('ModuleFE_GA4 needs a consent source: call ModuleFE_GA4.setConsentSource(ModuleFE_Consent)');

		this.controller?.stop();
		this.controller = new Ga4Controller({...this.config, consent: this.consent, env: browserEnvironment()});
		this.controller.start();
	}
}

export const ModuleFE_GA4 = new ModuleFE_GA4_Class();
