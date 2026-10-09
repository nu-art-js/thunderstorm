/*
 * @nu-art/turnstile-frontend - Cloudflare Turnstile widget and script loader for Thunderstorm frontends
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ImplementationMissingException, Module} from '@nu-art/ts-common';

/** The subset of the Cloudflare `turnstile` global this lib uses. */
export type TurnstileApi = {
	render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
	reset: (widgetId: string) => void;
	remove: (widgetId: string) => void;
};

/** Cloudflare explicit-render options this lib passes through. */
export type TurnstileRenderOptions = {
	sitekey: string;
	action?: string;
	theme?: 'auto' | 'light' | 'dark';
	size?: 'normal' | 'flexible' | 'compact';
	language?: string;
	callback?: (token: string) => void;
	'expired-callback'?: () => void;
	'error-callback'?: (errorCode: string) => void;
};

type Config = {
	/** Public Turnstile site key (RTDB frontend config). */
	siteKey: string;
	/** Script URL; explicit rendering is required. */
	scriptUrl: string;
};

type WindowWithTurnstile = Window & { turnstile?: TurnstileApi };

/**
 * Holds the site key and loads the Cloudflare script once (explicit rendering).
 * Rendering happens in Component_Turnstile.
 */
export class ModuleFE_Turnstile_Class
	extends Module<Config> {

	private loading?: Promise<TurnstileApi>;

	constructor() {
		super();
		this.setDefaultConfig({scriptUrl: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'});
	}

	getSiteKey(): string {
		if (!this.config.siteKey)
			throw new ImplementationMissingException('ModuleFE_Turnstile config is missing siteKey');

		return this.config.siteKey;
	}

	/** Resolves the `turnstile` global, injecting the script on first use. */
	load(): Promise<TurnstileApi> {
		const existing = (window as WindowWithTurnstile).turnstile;
		if (existing)
			return Promise.resolve(existing);

		if (!this.loading)
			this.loading = new Promise<TurnstileApi>((resolve, reject) => {
				const script = document.createElement('script');
				script.src = this.config.scriptUrl;
				script.async = true;
				script.defer = true;
				script.onload = () => {
					const api = (window as WindowWithTurnstile).turnstile;
					if (api)
						return resolve(api);

					this.loading = undefined;
					reject(new ImplementationMissingException('Turnstile script loaded without a turnstile global'));
				};
				script.onerror = () => {
					this.loading = undefined;
					script.remove();
					reject(new ImplementationMissingException(`Failed to load Turnstile script: ${this.config.scriptUrl}`));
				};
				document.head.appendChild(script);
			});

		return this.loading;
	}
}

export const ModuleFE_Turnstile = new ModuleFE_Turnstile_Class();
